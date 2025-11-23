"""
Test script to compare inspect-based vs decorator-based tool generation.
Run with: python -m tests.test_tool_generator

Shows side-by-side comparison of current inspect-based output vs
what it SHOULD look like with proper @tool_function decorators.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import inspect
from tool_generator import tool_function, generate_tools_from_fetchers
from config import get_settings
from integrations import (
    SpotifyDataFetcher,
    StocksDataFetcher,
    SportsDataFetcher,
    StravaDataFetcher,
    ClashRoyaleDataFetcher,
)


# What the decorators SHOULD look like for each fetcher
IDEAL_METADATA = {
    "spotify_fetch_user_data": {
        "description": "Get user's Spotify listening stats including top songs, artists, genres, and total listening time",
        "params": {}
    },
    "stocks_fetch_stock_info": {
        "description": "Get real-time stock price, volume, and company info for a ticker symbol",
        "params": {
            "symbol": {
                "type": "string",
                "description": "Stock ticker symbol (e.g., AAPL, TSLA, GOOGL, MSFT, AMZN)"
            }
        }
    },
    "stocks_fetch_market_trends": {
        "description": "Get current market overview including major indices (S&P 500, NASDAQ, DOW) and top movers",
        "params": {}
    },
    "stocks_fetch_portfolio_data": {
        "description": "Get portfolio performance data for multiple stock symbols",
        "params": {
            "symbols": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of stock ticker symbols (e.g., ['AAPL', 'GOOGL', 'MSFT'])"
            }
        }
    },
    "strava_fetch_user_summary": {
        "description": "Get user's Strava fitness summary including total workouts, distance, and calories",
        "params": {}
    },
    "strava_fetch_activities": {
        "description": "Get user's recent Strava activities with details like distance, duration, and pace",
        "params": {}
    },
    "strava_get_activities": {
        "description": "Get list of recent Strava activities",
        "params": {
            "limit": {
                "type": "integer",
                "description": "Maximum number of activities to return (1-100, default: 10)"
            }
        }
    },
    "sports_fetch_user_sports_summary": {
        "description": "Get summary of favorite sports teams including recent games and standings",
        "params": {
            "team_names": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of team names to get stats for (e.g., ['Lakers', 'Warriors', 'Celtics'])"
            }
        }
    },
    "sports_get_team_stats": {
        "description": "Get detailed stats for a specific sports team",
        "params": {
            "team_id": {
                "type": "string",
                "description": "Team ID or abbreviation (e.g., 'LAL' for Lakers, 'GSW' for Warriors)"
            }
        }
    },
    "clash_fetch_player_data": {
        "description": "Get Clash Royale player stats including trophies, wins, and favorite cards",
        "params": {}
    },
    "clash_get_player": {
        "description": "Get detailed Clash Royale player profile",
        "params": {
            "player_tag": {
                "type": "string",
                "description": "Player tag with # prefix (e.g., '#ABC123')"
            }
        }
    },
    "clash_fetch_user_summary": {
        "description": "Get Clash Royale player summary with key stats",
        "params": {
            "player_tag": {
                "type": "string",
                "description": "Player tag with # prefix (e.g., '#ABC123')"
            }
        }
    },
}


def generate_inspect_based_schema(method, tool_name: str) -> dict:
    """Generate tool schema using inspect (current approach)"""
    doc = inspect.getdoc(method) or f"Execute {tool_name}"

    sig = inspect.signature(method)
    params = {}
    required_params = []

    for param_name, param in sig.parameters.items():
        if param_name == "self":
            continue

        param_type = "string"
        param_desc = f"Parameter {param_name}"

        annotation = param.annotation
        if annotation != inspect.Parameter.empty:
            if annotation == str:
                param_type = "string"
            elif annotation == int:
                param_type = "integer"
            elif annotation == float:
                param_type = "number"
            elif annotation == bool:
                param_type = "boolean"
            elif hasattr(annotation, "__origin__") and annotation.__origin__ == list:
                params[param_name] = {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": f"List of {param_name}"
                }
                if param.default == inspect.Parameter.empty:
                    required_params.append(param_name)
                continue

        params[param_name] = {"type": param_type, "description": param_desc}

        if param.default == inspect.Parameter.empty:
            required_params.append(param_name)

    schema = {
        "name": tool_name,
        "description": doc.split('\n')[0] if doc else f"Execute {tool_name}"
    }

    if params:
        schema["parameters"] = {
            "type": "object",
            "properties": params,
            "required": required_params
        }

    return schema


def main():
    settings = get_settings()

    # Initialize fetchers (some may fail without valid API keys, that's ok)
    fetchers = {}

    try:
        fetchers["spotify"] = SpotifyDataFetcher(
            client_id=settings.spotify_client_id or "dummy",
            client_secret=settings.spotify_client_secret or "dummy",
            redirect_uri=settings.spotify_redirect_uri or "http://localhost"
        )
    except:
        pass

    try:
        fetchers["stocks"] = StocksDataFetcher(
            alpha_vantage_key=settings.alpha_vantage_api_key or "dummy"
        )
    except:
        pass

    try:
        fetchers["sports"] = SportsDataFetcher(
            api_key=settings.sports_api_key or "dummy"
        )
    except:
        pass

    try:
        fetchers["strava"] = StravaDataFetcher(
            client_id=settings.strava_client_id or "dummy",
            client_secret=settings.strava_client_secret or "dummy",
            refresh_token=settings.strava_refresh_token or "dummy"
        )
    except:
        pass

    try:
        fetchers["clash"] = ClashRoyaleDataFetcher(
            api_key=settings.clashroyale_api_key or "dummy"
        )
    except:
        pass

    if not fetchers:
        print("ERROR: Could not initialize any fetchers")
        return

    # Generate tools using current approach
    tools, functions = generate_tools_from_fetchers(fetchers)

    print("=" * 100)
    print("TOOL GENERATOR COMPARISON: Current (Inspect) vs Ideal (Decorator)")
    print("=" * 100)
    print()

    for tool in tools:
        func = tool["function"]
        name = func["name"]

        print("=" * 100)
        print(f"TOOL: {name}")
        print("=" * 100)
        print()

        # Current (inspect-based)
        print("CURRENT (inspect-based):")
        print("-" * 50)
        print(f"  Description: {func['description']}")

        params = func.get("parameters", {})
        if params:
            print(f"  Parameters:")
            for param_name, param_schema in params.get("properties", {}).items():
                param_type = param_schema.get("type", "unknown")
                param_desc = param_schema.get("description", "No description")
                required = param_name in params.get("required", [])
                req_marker = " [REQUIRED]" if required else ""
                print(f"    - {param_name} ({param_type}){req_marker}")
                print(f"      \"{param_desc}\"")
        else:
            print(f"  Parameters: None")

        print()

        # Ideal (decorator-based)
        print("IDEAL (with @tool_function decorator):")
        print("-" * 50)

        if name in IDEAL_METADATA:
            ideal = IDEAL_METADATA[name]
            print(f"  Description: {ideal['description']}")

            if ideal["params"]:
                print(f"  Parameters:")
                for param_name, param_schema in ideal["params"].items():
                    param_type = param_schema.get("type", "unknown")
                    param_desc = param_schema.get("description", "No description")
                    print(f"    - {param_name} ({param_type})")
                    print(f"      \"{param_desc}\"")
            else:
                print(f"  Parameters: None")
        else:
            print(f"  (No ideal metadata defined for this tool)")

        print()
        print()

    print("=" * 100)
    print("SUMMARY")
    print("=" * 100)
    print()
    print("Problems with inspect-based approach:")
    print("  1. Descriptions are developer docstrings, not LLM-friendly")
    print("  2. Parameter descriptions are useless: 'Parameter symbol'")
    print("  3. No examples of valid values")
    print("  4. LLM has to guess what format to use")
    print()
    print("Benefits of @tool_function decorator:")
    print("  1. LLM-optimized descriptions")
    print("  2. Rich parameter descriptions with examples")
    print("  3. Clear value format expectations")
    print("  4. LLM knows exactly what to pass")
    print()
    print("Next steps:")
    print("  1. Add @tool_function decorators to all fetcher methods")
    print("  2. Use IDEAL_METADATA above as reference")
    print("  3. Read API docs for accurate parameter descriptions")
    print()


if __name__ == "__main__":
    main()
