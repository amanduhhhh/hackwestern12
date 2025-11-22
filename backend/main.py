from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse, HTMLResponse
from pydantic import BaseModel
from litellm import acompletion
import json
from typing import AsyncGenerator, Optional

from config import get_settings
from data import MOCK_DATA
from utils import get_data, sanitize_prompt
from prompts import build_planning_prompt, build_ui_system_prompt, build_ui_user_prompt
import openai
from integrations import (
    SpotifyDataFetcher,
    StocksDataFetcher,
    SportsDataFetcher,
    StravaDataFetcher,
    ClashRoyaleDataFetcher,
)

app = FastAPI()
settings = get_settings()

spotify_fetcher = SpotifyDataFetcher(
    client_id=settings.spotify_client_id,
    client_secret=settings.spotify_client_secret,
    redirect_uri=settings.spotify_redirect_uri
)

stocks_fetcher = StocksDataFetcher(alpha_vantage_key=settings.alpha_vantage_api_key)

sports_fetcher = SportsDataFetcher(api_key=settings.sports_api_key)

strava_fetcher = StravaDataFetcher(
    client_id=settings.strava_client_id,
    client_secret=settings.strava_client_secret,
    refresh_token=settings.strava_refresh_token,
)
clash_fetcher = ClashRoyaleDataFetcher(api_key=settings.clashroyale_api_key)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    query: str

class QueryRequest(BaseModel):
    prompt: str


def get_spotify_data():
    """Get user's Spotify listening data including top songs, artists, and genres"""
    return spotify_fetcher.fetch_user_data()

def get_stock_info(symbol: str):
    """Get detailed information for a specific stock symbol"""
    return stocks_fetcher.fetch_stock_info(symbol)

def get_market_trends():
    """Get current stock market trends, indices, and top movers"""
    return stocks_fetcher.fetch_market_trends()

def get_portfolio_data(symbols: list):
    """Get portfolio data for multiple stock symbols"""
    return stocks_fetcher.fetch_portfolio_data(symbols)

def get_sports_team_data(team_name: str):
    """Search for a sports team and get their current stats"""
    team_info = sports_fetcher.search_team(team_name)
    if team_info:
        stats = sports_fetcher.get_team_stats(team_info["abbreviation"])
        return {**team_info, **stats}
    return None

def get_strava_data():
    """Get user's Strava fitness activities and stats"""
    return strava_fetcher.fetch_activities()

def get_clash_data():
    """Get user's Clash Royale game data"""
    return clash_fetcher.fetch_player_data()

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_spotify_data",
            "description": "Get user's Spotify listening data including top songs, artists, genres, and listening time"
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_stock_info",
            "description": "Get detailed information for a specific stock symbol",
            "parameters": {
                "type": "object",
                "properties": {
                    "symbol": {"type": "string", "description": "Stock ticker symbol (e.g., AAPL, TSLA)"}
                },
                "required": ["symbol"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_market_trends",
            "description": "Get current stock market trends, major indices, and top gainers/losers"
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_portfolio_data",
            "description": "Get portfolio data for multiple stock symbols",
            "parameters": {
                "type": "object",
                "properties": {
                    "symbols": {"type": "array", "items": {"type": "string"}, "description": "List of stock symbols"}
                },
                "required": ["symbols"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_sports_team_data",
            "description": "Search for a sports team and get their current stats including wins, losses, and venue",
            "parameters": {
                "type": "object",
                "properties": {
                    "team_name": {"type": "string", "description": "Name of the sports team (e.g., Lakers, Warriors)"}
                },
                "required": ["team_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_strava_data",
            "description": "Get user's Strava fitness activities and running stats"
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_clash_data",
            "description": "Get user's Clash Royale game statistics and player data"
        }
    }
]

available_functions = {
    "get_spotify_data": get_spotify_data,
    "get_stock_info": get_stock_info,
    "get_market_trends": get_market_trends,
    "get_portfolio_data": get_portfolio_data,
    "get_sports_team_data": get_sports_team_data,
    "get_strava_data": get_strava_data,
    "get_clash_data": get_clash_data
}

@app.post("/api/query")
async def intelligent_query(request: QueryRequest):
    """Use OpenAI function calling to dynamically fetch data based on user prompt"""
    prompt = sanitize_prompt(request.prompt)
    openai.api_key = settings.openai_api_key
    
    messages = [
        {"role": "system", "content": "You are a helpful assistant that retrieves user data from various sources. Use the available functions to fetch the requested data."},
        {"role": "user", "content": prompt}
    ]
    
    response = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        tools=tools,
        tool_choice="auto"
    )
    
    response_message = response.choices[0].message
    tool_calls = response_message.tool_calls
    
    if not tool_calls:
        return {"prompt": prompt, "message": response_message.content, "data": {}}
    
    data = {}
    functions_called = []
    
    for tool_call in tool_calls:
        function_name = tool_call.function.name
        function_args = json.loads(tool_call.function.arguments)
        functions_called.append({"function": function_name, "args": function_args})
        
        function_to_call = available_functions[function_name]
        
        try:
            if function_args:
                result = function_to_call(**function_args)
            else:
                result = function_to_call()
            
            data[function_name] = result
        except Exception as e:
            data[function_name] = {"error": str(e)}
    
    return {"prompt": prompt, "functions_called": functions_called, "data": data}


class RefineRequest(BaseModel):
    query: str
    currentHtml: str
    dataContext: dict


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/spotify/auth")
async def spotify_auth():
    if not spotify_fetcher:
        return JSONResponse(
            status_code=400, content={"error": "Spotify not configured"}
        )
    return {"auth_url": spotify_fetcher.get_authorization_url()}


@app.get("/api/spotify/callback")
async def spotify_callback(
    code: Optional[str] = Query(None), error: Optional[str] = Query(None)
):
    if error:
        return JSONResponse(
            status_code=400, content={"error": f"Authorization failed: {error}"}
        )
    if not code:
        return JSONResponse(status_code=400, content={"error": "No authorization code"})
    if not spotify_fetcher:
        return JSONResponse(
            status_code=400, content={"error": "Spotify not configured"}
        )

    try:
        spotify_fetcher.fetch_token_from_code(code)
        data = spotify_fetcher.fetch_user_data()

        if data:
            songs = "<br>".join(
                [
                    f"{i + 1}. {s['title']} - {s['artist']}"
                    for i, s in enumerate(data["top_songs"][:5])
                ]
            )
            html = f"""
            <html>
                <head><title>Spotify Connected</title></head>
                <body style="font-family: Arial; max-width: 800px; margin: 50px auto; padding: 20px;">
                    <h1 style="color: #1DB954;">Connected Successfully</h1>
                    <h2>Top 5 Songs:</h2><p>{songs}</p>
                    <h2>Top Genres:</h2><p>{", ".join(data["top_genres"])}</p>
                    <p><a href="/api/spotify/data">View JSON</a></p>
                </body>
            </html>
            """
            return HTMLResponse(content=html)
        return JSONResponse(content={"message": "Connected but no data"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/spotify/status")
async def spotify_status():
    if not spotify_fetcher:
        return {"authenticated": False}
    return {"authenticated": spotify_fetcher.is_authenticated()}


@app.get("/api/spotify/data")
async def spotify_data():
    if not spotify_fetcher:
        return JSONResponse(
            status_code=400, content={"error": "Spotify not configured"}
        )
    if not spotify_fetcher.is_authenticated():
        return JSONResponse(status_code=401, content={"error": "Not authenticated"})

    data = spotify_fetcher.fetch_user_data()
    if not data:
        return JSONResponse(status_code=500, content={"error": "Failed to fetch data"})
    return data


@app.post("/api/spotify/refresh")
async def spotify_refresh():
    if not spotify_fetcher:
        return JSONResponse(
            status_code=400, content={"error": "Spotify not configured"}
        )
    if not spotify_fetcher.is_authenticated():
        return JSONResponse(status_code=401, content={"error": "Not authenticated"})

    data = spotify_fetcher.fetch_user_data()
    if not data:
        return JSONResponse(status_code=500, content={"error": "Failed to refresh"})
    return {"message": "Refreshed", "data": data}


@app.get("/api/stocks/portfolio")
async def stocks_portfolio(
    symbols: str = Query(..., description="Comma-separated symbols"),
):
    try:
        symbol_list = [s.strip().upper() for s in symbols.split(",")]
        data = stocks_fetcher.fetch_portfolio_data(symbol_list)
        if not data:
            return JSONResponse(
                status_code=500, content={"error": "Failed to fetch portfolio"}
            )
        return data
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/stocks/market")
async def stocks_market():
    try:
        data = stocks_fetcher.fetch_market_trends()
        if not data:
            return JSONResponse(
                status_code=500, content={"error": "Failed to fetch market"}
            )
        return data
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/stocks/{symbol}")
async def stocks_info(symbol: str):
    try:
        data = stocks_fetcher.fetch_stock_info(symbol.upper())
        if not data:
            return JSONResponse(
                status_code=404, content={"error": f"{symbol} not found"}
            )
        return data
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/sports/search")
async def sports_search(team: str = Query(...)):
    try:
        data = sports_fetcher.search_team(team)
        if not data:
            return JSONResponse(
                status_code=404, content={"error": f"Team '{team}' not found"}
            )
        return data
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/sports/team/{team_id}")
async def sports_team_stats(team_id: str):
    try:
        data = sports_fetcher.get_team_stats(team_id)
        if not data:
            return JSONResponse(status_code=404, content={"error": "Team not found"})
        return data
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/sports/summary")
async def sports_summary(teams: str = Query(...)):
    try:
        team_list = [t.strip() for t in teams.split(",")]
        data = sports_fetcher.fetch_user_sports_summary(team_list)
        if not data:
            return JSONResponse(
                status_code=500, content={"error": "Failed to fetch summary"}
            )
        return data
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/strava/summary")
async def strava_summary():
    if not strava_fetcher.is_authenticated():
        return JSONResponse(status_code=401, content={"error": "Strava not configured"})
    data = strava_fetcher.fetch_user_summary()
    if not data:
        return JSONResponse(status_code=500, content={"error": "Failed to fetch data"})
    return data


@app.get("/api/strava/activities")
async def strava_activities(limit: int = Query(10)):
    if not strava_fetcher.is_authenticated():
        return JSONResponse(status_code=401, content={"error": "Strava not configured"})
    data = strava_fetcher.get_activities(limit=limit)
    if not data:
        return JSONResponse(
            status_code=500, content={"error": "Failed to fetch activities"}
        )
    return data


@app.get("/api/clash/player/{player_tag:path}")
async def clash_player(player_tag: str):
    if not clash_fetcher.is_authenticated():
        return JSONResponse(
            status_code=401, content={"error": "API key not configured"}
        )
    data = clash_fetcher.get_player(player_tag)
    if not data:
        return JSONResponse(status_code=404, content={"error": "Player not found"})
    return data


@app.get("/api/clash/summary/{player_tag:path}")
async def clash_summary(player_tag: str):
    if not clash_fetcher.is_authenticated():
        return JSONResponse(
            status_code=401, content={"error": "API key not configured"}
        )
    data = clash_fetcher.fetch_user_summary(player_tag)
    if not data:
        return JSONResponse(status_code=404, content={"error": "Player not found"})
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
                    {
                        "role": "system",
                        "content": build_ui_system_prompt(intent, approach),
                    },
                    {
                        "role": "user",
                        "content": build_ui_user_prompt(request.query, data_context),
                    },
                ],
                stream=True,
                max_tokens=4000,
                api_key=settings.anthropic_api_key,
            )

            async for chunk in response:
                if (
                    hasattr(chunk.choices[0].delta, "content")
                    and chunk.choices[0].delta.content
                ):
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
        },
    )


@app.post("/api/refine")
async def refine_ui(request: RefineRequest):
    """
    Refine an existing UI based on user feedback.
    Takes the current HTML and generates an improved version.
    """
    async def event_stream() -> AsyncGenerator[str, None]:
        try:
            yield f"event: data\ndata: {json.dumps(request.dataContext)}\n\n"

            system_prompt = f"""You're editing a live app screen. Make the requested changes while preserving data bindings.

## Current Screen
{request.currentHtml}

## Golden Rule: NO SYNTHETIC DATA

Never write literal numbers, names, or values. All data comes through:
- `<data-value data-source="namespace::key"></data-value>`
- `<component-slot type="..." data-source="namespace::key" ...>`

If you write "87,234" or any actual data value, you've broken the screen.

## Edit Rules
- Output raw HTML only (no markdown, code fences)
- Preserve all data-source bindings - move them, don't delete them
- Same data sources - never invent new ones
- Sharp edges only (rounded-sm or rounded, never rounded-xl/2xl/3xl)
- Dark theme: bg-zinc-900/950, text-white/zinc-100

## What to Change
Respond to the user's edit request:
- Layout: rearrange, resize, change grid structure
- Style: colors, spacing, typography, accents
- Emphasis: scale up/down, reposition
- Flow: reorder the narrative, change the "hook"

## What to Keep
- All data-value and component-slot elements
- Data bindings intact (namespace::key references)
- The emotional intent unless explicitly changing it

Think: tweaking a shipped app, not rebuilding."""

            response = await acompletion(
                model=settings.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": request.query},
                ],
                stream=True,
                max_tokens=4000,
                api_key=settings.anthropic_api_key,
            )

            async for chunk in response:
                if (
                    hasattr(chunk.choices[0].delta, "content")
                    and chunk.choices[0].delta.content
                ):
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
        },
    )


async def plan_and_classify(query: str) -> dict:
    response = await acompletion(
        model=settings.model,
        messages=[{"role": "user", "content": build_planning_prompt(query)}],
        max_tokens=300,
        api_key=settings.anthropic_api_key,
    )

    text = response.choices[0].message.content
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
