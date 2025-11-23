import sys
import os
import json
import time
import logging
import requests
from typing import Dict, Any

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import get_settings
from integrations import (
    SpotifyDataFetcher,
    StocksDataFetcher,
    SportsDataFetcher,
    StravaDataFetcher,
    ClashRoyaleDataFetcher,
)
from tool_generator import generate_tools_from_fetchers

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger(__name__)

BASE_URL = "http://localhost:8000"


def test_health():
    logger.info("=" * 60)
    logger.info("Testing /health endpoint")
    logger.info("=" * 60)

    try:
        r = requests.get(f"{BASE_URL}/health", timeout=5)
        r.raise_for_status()
        logger.info(f"Status: {r.status_code}")
        logger.info(f"Response: {r.json()}")
        return True
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return False


def test_generate_stream(query: str):
    logger.info("=" * 60)
    logger.info(f"Testing /api/generate with: '{query}'")
    logger.info("=" * 60)

    try:
        r = requests.post(
            f"{BASE_URL}/api/generate",
            json={"query": query},
            stream=True,
            timeout=60
        )
        r.raise_for_status()

        data_context = None
        html_chunks = []
        statuses = []

        for line in r.iter_lines():
            if not line:
                continue

            line = line.decode("utf-8")

            if line.startswith("event:"):
                event_type = line.replace("event:", "").strip()
                continue

            if line.startswith("data:"):
                data_str = line.replace("data:", "").strip()

                try:
                    data = json.loads(data_str)
                except:
                    continue

                if "message" in data:
                    statuses.append(data["message"])
                    logger.info(f"Status: {data['message']}")
                elif "content" in data:
                    html_chunks.append(data["content"])
                elif data and not isinstance(data, dict):
                    pass
                elif data and "message" not in data and "content" not in data:
                    data_context = data
                    logger.info(f"Data context received: {list(data.keys())}")

        html = "".join(html_chunks)

        logger.info(f"Statuses received: {statuses}")
        logger.info(f"HTML length: {len(html)} chars")

        if data_context:
            for ns, content in data_context.items():
                if isinstance(content, dict):
                    logger.info(f"  {ns}: {list(content.keys())}")
                else:
                    logger.info(f"  {ns}: {type(content).__name__}")

        return True
    except Exception as e:
        logger.error(f"Generate failed: {e}")
        return False


def test_query_endpoint(prompt: str, model: str = "gpt-5-mini"):
    logger.info("=" * 60)
    logger.info(f"Testing /api/query with: '{prompt}'")
    logger.info(f"Model: {model}")
    logger.info("=" * 60)

    try:
        r = requests.post(
            f"{BASE_URL}/api/query",
            json={"prompt": prompt, "model": model},
            timeout=30
        )
        r.raise_for_status()

        result = r.json()

        logger.info(f"Functions called: {len(result.get('functions_called', []))}")
        for fc in result.get("functions_called", []):
            logger.info(f"  - {fc['function']}({fc['args']})")

        logger.info(f"Data keys: {list(result.get('data', {}).keys())}")

        return True
    except Exception as e:
        logger.error(f"Query failed: {e}")
        return False


def test_tool_generation():
    logger.info("=" * 60)
    logger.info("Testing tool generation from fetchers")
    logger.info("=" * 60)

    settings = get_settings()

    fetchers = {}

    try:
        fetchers["spotify"] = SpotifyDataFetcher(
            client_id=settings.spotify_client_id or "dummy",
            client_secret=settings.spotify_client_secret or "dummy",
            redirect_uri=settings.spotify_redirect_uri or "http://localhost"
        )
    except Exception as e:
        logger.warning(f"Spotify init failed: {e}")

    try:
        fetchers["stocks"] = StocksDataFetcher(
            alpha_vantage_key=settings.alpha_vantage_api_key or "dummy"
        )
    except Exception as e:
        logger.warning(f"Stocks init failed: {e}")

    try:
        fetchers["sports"] = SportsDataFetcher(
            api_key=settings.sports_api_key or "dummy"
        )
    except Exception as e:
        logger.warning(f"Sports init failed: {e}")

    try:
        fetchers["strava"] = StravaDataFetcher(
            client_id=settings.strava_client_id or "dummy",
            client_secret=settings.strava_client_secret or "dummy",
            refresh_token=settings.strava_refresh_token or "dummy"
        )
    except Exception as e:
        logger.warning(f"Strava init failed: {e}")

    try:
        fetchers["clash"] = ClashRoyaleDataFetcher(
            api_key=settings.clashroyale_api_key or "dummy"
        )
    except Exception as e:
        logger.warning(f"Clash init failed: {e}")

    if not fetchers:
        logger.error("No fetchers initialized")
        return False

    tools, functions = generate_tools_from_fetchers(fetchers)

    logger.info(f"Generated {len(tools)} tools:")

    for tool in tools:
        func = tool["function"]
        name = func["name"]
        desc = func["description"]
        params = func.get("parameters", {}).get("properties", {})

        logger.info(f"\n  {name}")
        logger.info(f"    Description: {desc[:80]}...")

        if params:
            for param_name, param_schema in params.items():
                param_type = param_schema.get("type", "unknown")
                param_desc = param_schema.get("description", "")[:60]
                logger.info(f"    - {param_name} ({param_type}): {param_desc}...")
        else:
            logger.info("    - No parameters")

    return True


def test_sports_direct():
    logger.info("=" * 60)
    logger.info("Testing SportsDataFetcher directly")
    logger.info("=" * 60)

    fetcher = SportsDataFetcher()

    logger.info("Testing NBA:")
    nba = fetcher.fetch_nba_summary(["lakers", "warriors", "celtics"])
    if nba:
        for team in nba["teams"]:
            logger.info(f"  {team['name']}: {team['wins']}-{team['losses']}")
    else:
        logger.error("  NBA fetch failed")

    logger.info("\nTesting NFL:")
    nfl = fetcher.fetch_nfl_summary(["cowboys", "patriots", "chiefs"])
    if nfl:
        for team in nfl["teams"]:
            logger.info(f"  {team['name']}: {team['wins']}-{team['losses']}")
    else:
        logger.error("  NFL fetch failed")

    logger.info("\nTesting MLB:")
    mlb = fetcher.fetch_mlb_summary(["yankees", "dodgers", "red sox"])
    if mlb:
        for team in mlb["teams"]:
            logger.info(f"  {team['name']}: {team['wins']}-{team['losses']}")
    else:
        logger.error("  MLB fetch failed")

    logger.info("\nTesting NHL:")
    nhl = fetcher.fetch_nhl_summary(["bruins", "penguins", "maple leafs"])
    if nhl:
        for team in nhl["teams"]:
            logger.info(f"  {team['name']}: {team['wins']}-{team['losses']}")
    else:
        logger.error("  NHL fetch failed")

    return nba and nfl and mlb and nhl


def test_stocks_direct():
    logger.info("=" * 60)
    logger.info("Testing StocksDataFetcher directly")
    logger.info("=" * 60)

    settings = get_settings()
    fetcher = StocksDataFetcher(alpha_vantage_key=settings.alpha_vantage_api_key or "")

    logger.info("Fetching stock info for AAPL, GOOGL, MSFT:")
    info = fetcher.fetch_stock_info(["AAPL", "GOOGL", "MSFT"])
    if info:
        for stock in info["stocks"]:
            logger.info(f"  {stock['name']}: ${stock['current_price']}")
            logger.info(f"    Year performance: {stock['year_performance']}%")

        try:
            json.dumps(info)
            logger.info("  JSON serialization: OK")
        except (TypeError, ValueError) as e:
            logger.error(f"  JSON serialization FAILED: {e}")
            return False
    else:
        logger.error("  Failed to fetch stock info")
        return False

    logger.info("\nFetching portfolio data:")
    portfolio = fetcher.fetch_portfolio_data(["AAPL", "GOOGL", "MSFT"])
    if portfolio:
        logger.info(f"  Total value: ${portfolio['total_value']}")
        for stock in portfolio["portfolio"]:
            logger.info(f"  {stock['symbol']}: ${stock['current_price']} ({stock['gain_percent']}%)")
        return True
    else:
        logger.error("  Failed to fetch portfolio")
        return False


def main():
    logger.info("=" * 60)
    logger.info("E2E TEST SUITE")
    logger.info("=" * 60)

    results = {}

    results["tool_generation"] = test_tool_generation()

    results["sports_direct"] = test_sports_direct()

    results["stocks_direct"] = test_stocks_direct()

    logger.info("\n" + "=" * 60)
    logger.info("Testing server endpoints (requires server running)")
    logger.info("=" * 60)

    results["health"] = test_health()

    if results["health"]:
        results["query_sports"] = test_query_endpoint(
            "Get stats for the Lakers and Cowboys"
        )

        results["query_stocks"] = test_query_endpoint(
            "What's the current price of Apple stock?"
        )

        results["generate_music"] = test_generate_stream(
            "Show me my music listening stats"
        )

        results["generate_sports"] = test_generate_stream(
            "Show me Lakers and Warriors standings"
        )

    logger.info("\n" + "=" * 60)
    logger.info("TEST RESULTS")
    logger.info("=" * 60)

    passed = 0
    failed = 0

    for test_name, result in results.items():
        status = "PASS" if result else "FAIL"
        logger.info(f"  {test_name}: {status}")
        if result:
            passed += 1
        else:
            failed += 1

    logger.info(f"\nTotal: {passed} passed, {failed} failed")

    return failed == 0


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
