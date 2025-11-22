from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, RedirectResponse, JSONResponse, HTMLResponse
from pydantic import BaseModel
from litellm import acompletion
import json
from typing import AsyncGenerator, Optional

from config import get_settings
from data import MOCK_DATA, get_spotify_data
from utils import get_data
from prompts import (
    build_planning_prompt,
    build_ui_system_prompt,
    build_ui_user_prompt,
)
from integrations.spotify import SpotifyDataFetcher
from integrations.stocks import StocksDataFetcher
from integrations.sports import SportsDataFetcher
from integrations.strava import StravaDataFetcher
from integrations.clashroyale import ClashRoyaleDataFetcher

app = FastAPI()
settings = get_settings()

# Initialize Spotify fetcher
spotify_fetcher = None
if settings.spotify_client_id and settings.spotify_client_secret:
    spotify_fetcher = SpotifyDataFetcher(
        client_id=settings.spotify_client_id,
        client_secret=settings.spotify_client_secret,
        redirect_uri=settings.spotify_redirect_uri
    )

# Initialize Stocks fetcher (no API key needed!)
stocks_fetcher = StocksDataFetcher(alpha_vantage_key=settings.alpha_vantage_api_key)

# Initialize Sports fetcher
sports_fetcher = SportsDataFetcher(api_key=settings.sports_api_key)

# Initialize Strava fetcher
strava_fetcher = StravaDataFetcher(
    client_id=settings.strava_client_id,
    client_secret=settings.strava_client_secret,
    refresh_token=settings.strava_refresh_token
)

# Initialize Clash Royale fetcher
clash_fetcher = ClashRoyaleDataFetcher(
    api_key=settings.clashroyale_api_key
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    query: str


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/spotify/auth")
async def spotify_auth():
    """Initiate Spotify OAuth flow"""
    if not spotify_fetcher:
        return JSONResponse(
            status_code=400, 
            content={"error": "Spotify credentials not configured"}
        )
    
    auth_url = spotify_fetcher.get_authorization_url()
    return {"auth_url": auth_url}


@app.get("/api/spotify/callback")
async def spotify_callback(code: Optional[str] = Query(None), error: Optional[str] = Query(None)):
    """Handle Spotify OAuth callback"""
    if error:
        return JSONResponse(
            status_code=400,
            content={"error": f"Spotify authorization failed: {error}"}
        )
    
    if not code:
        return JSONResponse(
            status_code=400,
            content={"error": "No authorization code provided"}
        )
    
    if not spotify_fetcher:
        return JSONResponse(
            status_code=400,
            content={"error": "Spotify credentials not configured"}
        )
    
    try:
        # Exchange code for token
        token_info = spotify_fetcher.fetch_token_from_code(code)
        
        # Fetch user data
        user_data = spotify_fetcher.fetch_user_data()
        
        # Return success page with data summary
        if user_data:
            top_songs = "<br>".join([f"{i+1}. {s['title']} - {s['artist']}" for i, s in enumerate(user_data['top_songs'][:5])])
            html = f"""
            <html>
                <head><title>Spotify Connected</title></head>
                <body style="font-family: Arial; max-width: 800px; margin: 50px auto; padding: 20px;">
                    <h1 style="color: #1DB954;">Spotify Connected Successfully!</h1>
                    <p>Your Spotify data has been cached and will refresh automatically.</p>
                    <h2>Your Top 5 Songs:</h2>
                    <p>{top_songs}</p>
                    <h2>Top Genres:</h2>
                    <p>{', '.join(user_data['top_genres'])}</p>
                    <hr>
                    <p><a href="/api/spotify/data">View Full Data (JSON)</a> | <a href="/api/spotify/status">Check Status</a></p>
                    <p><small>You can close this window now.</small></p>
                </body>
            </html>
            """
            return HTMLResponse(content=html)
        else:
            return JSONResponse(content={"message": "Connected but failed to fetch data. Try /api/spotify/refresh"})
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to complete authorization: {str(e)}"}
        )


@app.get("/api/spotify/status")
async def spotify_status():
    """Check if Spotify is authenticated"""
    if not spotify_fetcher:
        return {"authenticated": False, "message": "Spotify not configured"}
    
    is_auth = spotify_fetcher.is_authenticated()
    return {"authenticated": is_auth}


@app.get("/api/spotify/data")
async def spotify_data():
    """Get current Spotify data"""
    if not spotify_fetcher:
        return JSONResponse(
            status_code=400,
            content={"error": "Spotify credentials not configured"}
        )
    
    if not spotify_fetcher.is_authenticated():
        return JSONResponse(
            status_code=401,
            content={"error": "Not authenticated with Spotify", "auth_required": True}
        )
    
    data = spotify_fetcher.fetch_user_data()
    if not data:
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to fetch Spotify data"}
        )
    
    return data


@app.post("/api/spotify/refresh")
async def spotify_refresh():
    """Manually refresh Spotify data"""
    if not spotify_fetcher:
        return JSONResponse(
            status_code=400,
            content={"error": "Spotify credentials not configured"}
        )
    
    if not spotify_fetcher.is_authenticated():
        return JSONResponse(
            status_code=401,
            content={"error": "Not authenticated with Spotify"}
        )
    
    data = spotify_fetcher.fetch_user_data()
    if not data:
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to refresh Spotify data"}
        )
    
    return {"message": "Data refreshed successfully", "data": data}


# ==================== STOCKS ENDPOINTS ====================

@app.get("/api/stocks/portfolio")
async def stocks_portfolio(symbols: str = Query(..., description="Comma-separated stock symbols (e.g., AAPL,TSLA,NVDA)")):
    """Get portfolio data for specified stock symbols"""
    try:
        symbol_list = [s.strip().upper() for s in symbols.split(",")]
        data = stocks_fetcher.fetch_portfolio_data(symbol_list)
        
        if not data:
            return JSONResponse(
                status_code=500,
                content={"error": "Failed to fetch portfolio data"}
            )
        
        return data
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Error fetching portfolio: {str(e)}"}
        )


@app.get("/api/stocks/market")
async def stocks_market():
    """Get market trends and indices"""
    try:
        data = stocks_fetcher.fetch_market_trends()
        
        if not data:
            return JSONResponse(
                status_code=500,
                content={"error": "Failed to fetch market data"}
            )
        
        return data
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Error fetching market data: {str(e)}"}
        )


@app.get("/api/stocks/{symbol}")
async def stocks_info(symbol: str):
    """Get detailed info for a specific stock"""
    try:
        data = stocks_fetcher.fetch_stock_info(symbol.upper())
        
        if not data:
            return JSONResponse(
                status_code=404,
                content={"error": f"Stock {symbol} not found"}
            )
        
        return data
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Error fetching stock info: {str(e)}"}
        )


# ==================== SPORTS ENDPOINTS ====================

@app.get("/api/sports/search")
async def sports_search(team: str = Query(..., description="Team name to search for")):
    """Search for a sports team"""
    try:
        data = sports_fetcher.search_team(team)
        
        if not data:
            return JSONResponse(
                status_code=404,
                content={"error": f"Team '{team}' not found"}
            )
        
        return data
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Error searching team: {str(e)}"}
        )


@app.get("/api/sports/team/{team_id}")
async def sports_team_stats(team_id: str):
    """Get stats for a specific team"""
    try:
        data = sports_fetcher.get_team_stats(team_id)
        
        if not data:
            return JSONResponse(
                status_code=404,
                content={"error": f"Stats for team {team_id} not found"}
            )
        
        return data
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Error fetching team stats: {str(e)}"}
        )


@app.get("/api/sports/summary")
async def sports_summary(teams: str = Query(..., description="Comma-separated team names")):
    """Get sports summary for multiple teams"""
    try:
        team_list = [t.strip() for t in teams.split(",")]
        data = sports_fetcher.fetch_user_sports_summary(team_list)
        
        if not data:
            return JSONResponse(
                status_code=500,
                content={"error": "Failed to fetch sports summary"}
            )
        
        return data
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Error fetching sports summary: {str(e)}"}
        )
# ==================== STRAVA ENDPOINTS ====================

@app.get("/api/strava/summary")
async def strava_summary():
    """Get Strava user summary"""
    if not strava_fetcher.is_authenticated():
        return JSONResponse(
            status_code=401,
            content={"error": "Strava not configured"}
        )
    
    data = strava_fetcher.fetch_user_summary()
    if not data:
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to fetch Strava data"}
        )
    return data


@app.get("/api/strava/activities")
async def strava_activities(limit: int = Query(10, description="Number of activities")):
    """Get recent Strava activities"""
    if not strava_fetcher.is_authenticated():
        return JSONResponse(
            status_code=401,
            content={"error": "Strava not configured"}
        )
    
    data = strava_fetcher.get_activities(limit=limit)
    if not data:
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to fetch activities"}
        )
    return data


# ==================== CLASH ROYALE ENDPOINTS ====================

@app.get("/api/clash/player/{player_tag:path}")
async def clash_player(player_tag: str):
    """Get Clash Royale player info"""
    if not clash_fetcher.is_authenticated():
        return JSONResponse(
            status_code=401,
            content={"error": "Clash Royale API key not configured"}
        )
    
    data = clash_fetcher.get_player(player_tag)
    if not data:
        return JSONResponse(
            status_code=404,
            content={"error": f"Player {player_tag} not found"}
        )
    return data


@app.get("/api/clash/summary/{player_tag:path}")
async def clash_summary(player_tag: str):
    """Get full Clash Royale player summary"""
    if not clash_fetcher.is_authenticated():
        return JSONResponse(
            status_code=401,
            content={"error": "Clash Royale API key not configured"}
        )
    
    data = clash_fetcher.fetch_user_summary(player_tag)
    if not data:
        return JSONResponse(
            status_code=404,
            content={"error": f"Player {player_tag} not found"}
        )
    return data

@app.post("/api/generate")
async def generate_ui(request: GenerateRequest):
    async def event_stream() -> AsyncGenerator[str, None]:
        try:
            plan = await plan_and_classify(request.query)
            data_context = get_data(plan["sources"], MOCK_DATA)
            intent = plan.get("intent", "")
            approach = plan.get("approach", "")

            yield f"event: data\ndata: {json.dumps(data_context)}\n\n"

            response = await acompletion(
                model=settings.model,
                messages=[
                    {"role": "system", "content": build_ui_system_prompt(intent, approach)},
                    {"role": "user", "content": build_ui_user_prompt(request.query, data_context)}
                ],
                stream=True,
                max_tokens=4000,
                api_key=settings.openai_api_key
            )

            async for chunk in response:
                if hasattr(chunk.choices[0].delta, 'content') and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    yield f"event: ui\ndata: {json.dumps({'content': content})}\n\n"

            yield f"event: done\ndata: {{}}\n\n"

        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'message': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


async def plan_and_classify(query: str) -> dict:
    response = await acompletion(
        model=settings.model,
        messages=[{
            "role": "user",
            "content": build_planning_prompt(query)
        }],
        max_tokens=300,
        api_key=settings.openai_api_key
    )

    text = response.choices[0].message.content
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
