from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse, HTMLResponse
from pydantic import BaseModel
from litellm import acompletion
import json
from typing import AsyncGenerator, Optional, Literal

import logging
from config import get_settings
from data import MOCK_DATA
from utils import get_data, sanitize_prompt
from prompts import (
    build_planning_prompt,
    build_ui_system_prompt,
    build_ui_user_prompt,
    build_refine_system_prompt,
    build_interact_system_prompt,
    describe_data,
)
from litellm import completion
from integrations import (
    SpotifyDataFetcher,
    StocksDataFetcher,
    SportsDataFetcher,
    StravaDataFetcher,
    ClashRoyaleDataFetcher,
)
from tool_generator import generate_tools_from_fetchers

logger = logging.getLogger(__name__)

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

fetchers = {
    "spotify": spotify_fetcher,
    "stocks": stocks_fetcher,
    "sports": sports_fetcher,
    "strava": strava_fetcher,
    "clash": clash_fetcher
}

tools, available_functions = generate_tools_from_fetchers(fetchers)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    query: str


ModelType = Literal[
    "gpt-5-mini",
    "gpt-5",
    "anthropic/claude-sonnet-4-5-20250929",
]


class QueryRequest(BaseModel):
    prompt: str
    model: ModelType = "gpt-5-mini"


@app.post("/api/query")
async def intelligent_query(request: QueryRequest):
    """Use LiteLLM function calling to dynamically fetch data based on user prompt"""
    prompt = sanitize_prompt(request.prompt)

    if request.model.startswith("anthropic/"):
        api_key = settings.anthropic_api_key
    else:
        api_key = settings.openai_api_key

    messages = [
        {"role": "system", "content": "You are a helpful assistant that retrieves user data from various sources. Use the available functions to fetch the requested data."},
        {"role": "user", "content": prompt}
    ]

    response = completion(
        model=request.model,
        messages=messages,
        tools=tools,
        tool_choice="auto",
        api_key=api_key
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

        function_to_call = available_functions.get(function_name)
        if not function_to_call:
            data[function_name] = {"error": f"Unknown function: {function_name}"}
            continue

        try:
            if function_args:
                result = function_to_call(**function_args)
            else:
                result = function_to_call()

            data[function_name] = result
        except Exception as e:
            data[function_name] = {"error": str(e)}

    return {"prompt": prompt, "model": request.model, "functions_called": functions_called, "data": data}


class RefineRequest(BaseModel):
    query: str
    currentHtml: str
    dataContext: dict


class InteractRequest(BaseModel):
    clickPrompt: str
    clickedData: dict
    currentHtml: str
    dataContext: dict
    componentType: str


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


@app.post("/api/generate-legacy")
async def generate_ui_legacy(request: GenerateRequest):
    """Legacy endpoint using mock data. Use /api/generate for agent-based fetching."""
    async def event_stream() -> AsyncGenerator[str, None]:
        try:
            plan = await plan_and_classify(request.query)
            data_context = get_data(plan["sources"], MOCK_DATA)

            intent = plan.get("intent", "")
            approach = plan.get("approach", "")

            yield f"event: data\ndata: {json.dumps(data_context)}\n\n"

            response = await acompletion(
                model="anthropic/claude-sonnet-4-5-20250929",
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


# Namespace mapping: tool function prefixes → data context keys
TOOL_TO_NAMESPACE = {
    "spotify": "music",
    "stocks": "stocks",
    "sports": "sports",
    "strava": "fitness",
    "clash": "gaming",
}


@app.post("/api/generate")
async def generate_ui(request: GenerateRequest):
    async def event_stream() -> AsyncGenerator[str, None]:
        try:
            yield f"event: thinking\ndata: {json.dumps({'message': 'Planning query...'})}\n\n"
            plan = await plan_and_classify(request.query)

            intent = plan.get("intent", "")
            approach = plan.get("approach", "")

            yield f"event: thinking\ndata: {json.dumps({'message': f'Intent: {intent}'})}\n\n"

            agent_prompt = f"""Based on this user query, fetch the relevant data.

Query: {request.query}
Intent: {intent}
Suggested sources: {', '.join(plan.get('sources', []))}

Call the appropriate functions to get the data needed."""

            agent_messages = [
                {
                    "role": "system",
                    "content": "You are a data fetching agent. Use the available functions to retrieve user data. Call multiple functions if needed."
                },
                {"role": "user", "content": agent_prompt}
            ]

            agent_response = completion(
                model="gpt-5-mini",
                messages=agent_messages,
                tools=tools,
                tool_choice="auto",
                api_key=settings.openai_api_key
            )

            data_context = {}
            tool_calls = agent_response.choices[0].message.tool_calls

            if tool_calls:
                for tool_call in tool_calls:
                    function_name = tool_call.function.name
                    function_args = json.loads(tool_call.function.arguments)

                    yield f"event: tool_call\ndata: {json.dumps({'function': function_name, 'args': function_args})}\n\n"

                    prefix = function_name.split("_")[0]
                    namespace = TOOL_TO_NAMESPACE.get(prefix, prefix)

                    function_to_call = available_functions.get(function_name)
                    if function_to_call:
                        try:
                            if function_args:
                                result = function_to_call(**function_args)
                            else:
                                result = function_to_call()

                            if namespace not in data_context:
                                data_context[namespace] = {}

                            if isinstance(result, dict):
                                data_context[namespace].update(result)
                            else:
                                key = function_name.replace(f"{prefix}_", "")
                                data_context[namespace][key] = result

                            yield f"event: tool_result\ndata: {json.dumps({'function': function_name, 'success': True})}\n\n"

                        except Exception as e:
                            logger.error(f"Tool {function_name} failed: {e}")
                            yield f"event: tool_error\ndata: {json.dumps({'function': function_name, 'error': str(e)})}\n\n"

            if not data_context:
                yield f"event: thinking\ndata: {json.dumps({'message': 'No tools called, using sample data'})}\n\n"
                data_context = get_data(plan["sources"], MOCK_DATA)

            yield f"event: data\ndata: {json.dumps(data_context)}\n\n"
            yield f"event: thinking\ndata: {json.dumps({'message': 'Generating UI...'})}\n\n"

            response = await acompletion(
                model="anthropic/claude-sonnet-4-5-20250929",
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

            system_prompt = build_refine_system_prompt(request.currentHtml)

            response = await acompletion(
                model="anthropic/claude-sonnet-4-5-20250929",
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


@app.post("/api/interact")
async def interact_drilldown(request: InteractRequest):
    async def event_stream() -> AsyncGenerator[str, None]:
        try:
            yield f"event: thinking\ndata: {json.dumps({'message': 'Analyzing clicked item...'})}\n\n"

            clicked_item_desc = json.dumps(request.clickedData, indent=2)

            yield f"event: thinking\ndata: {json.dumps({'message': f'Item: {list(request.clickedData.keys())[:3]}'})}\n\n"

            agent_prompt = f"""The user clicked on an item and wants more details.

Click instruction: {request.clickPrompt}

Clicked item data:
{clicked_item_desc}

Component type: {request.componentType}

Based on this context, fetch detailed data about the clicked item. For example:
- If it's a song, get audio features, similar tracks, or play history
- If it's a stock, get detailed quotes, news, or historical data
- If it's a team, get recent games, roster, or detailed stats
- If it's an activity, get detailed metrics, splits, or comparisons

Call the appropriate functions to get detailed data for this drill-down view."""

            agent_messages = [
                {
                    "role": "system",
                    "content": "You are a data fetching agent. Fetch detailed data for a drill-down view based on the clicked item. Use available functions to get relevant details."
                },
                {"role": "user", "content": agent_prompt}
            ]

            agent_response = completion(
                model="gpt-5-mini",
                messages=agent_messages,
                tools=tools,
                tool_choice="auto",
                api_key=settings.openai_api_key
            )

            detail_data = {}
            tool_calls = agent_response.choices[0].message.tool_calls

            if tool_calls:
                for tool_call in tool_calls:
                    function_name = tool_call.function.name
                    function_args = json.loads(tool_call.function.arguments)

                    yield f"event: tool_call\ndata: {json.dumps({'function': function_name, 'args': function_args})}\n\n"

                    prefix = function_name.split("_")[0]
                    namespace = TOOL_TO_NAMESPACE.get(prefix, prefix)

                    function_to_call = available_functions.get(function_name)
                    if function_to_call:
                        try:
                            if function_args:
                                result = function_to_call(**function_args)
                            else:
                                result = function_to_call()

                            if namespace not in detail_data:
                                detail_data[namespace] = {}

                            if isinstance(result, dict):
                                detail_data[namespace].update(result)
                            else:
                                key = function_name.replace(f"{prefix}_", "")
                                detail_data[namespace][key] = result

                            yield f"event: tool_result\ndata: {json.dumps({'function': function_name, 'success': True})}\n\n"

                        except Exception as e:
                            logger.error(f"Tool {function_name} failed: {e}")
                            yield f"event: tool_error\ndata: {json.dumps({'function': function_name, 'error': str(e)})}\n\n"

            combined_context = {**request.dataContext}
            for namespace, data in detail_data.items():
                if namespace in combined_context:
                    combined_context[namespace].update(data)
                else:
                    combined_context[namespace] = data

            combined_context["clicked_item"] = request.clickedData

            yield f"event: data\ndata: {json.dumps(combined_context)}\n\n"
            yield f"event: thinking\ndata: {json.dumps({'message': 'Generating detail view...'})}\n\n"

            system_prompt = build_interact_system_prompt(
                clicked_item_desc,
                request.clickPrompt,
                request.componentType
            )

            user_prompt = f"""Clicked item: {request.clickPrompt}

Data Available:
{describe_data(combined_context)}

Generate the detail view HTML now."""

            response = await acompletion(
                model="anthropic/claude-sonnet-4-5-20250929",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
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
        model="anthropic/claude-sonnet-4-5-20250929",
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
