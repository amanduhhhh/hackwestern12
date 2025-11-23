# Integration Parameters Reference

This document describes valid parameters for each data fetcher tool.

---

## Sports (ESPN API)

Separate functions for each league so the LLM knows exactly what's valid.

### `sports_fetch_nba_summary`

**Valid teams (30):** lakers, warriors, celtics, heat, bulls, nets, knicks, 76ers, bucks, raptors, cavaliers, pistons, pacers, hawks, hornets, magic, wizards, nuggets, timberwolves, thunder, blazers, jazz, mavericks, rockets, grizzlies, pelicans, spurs, suns, clippers, kings

```python
team_names: List[str]  # e.g., ["lakers", "warriors", "celtics"]
```

### `sports_fetch_nfl_summary`

**Valid teams (32):** cardinals, falcons, ravens, bills, panthers, bears, bengals, browns, cowboys, broncos, lions, packers, texans, colts, jaguars, chiefs, raiders, chargers, rams, dolphins, vikings, patriots, saints, giants, jets, eagles, steelers, 49ers, seahawks, buccaneers, titans, commanders

```python
team_names: List[str]  # e.g., ["cowboys", "patriots", "chiefs"]
```

### `sports_fetch_mlb_summary`

**Valid teams (30):** diamondbacks, braves, orioles, red sox, cubs, white sox, reds, guardians, rockies, tigers, astros, royals, angels, dodgers, marlins, brewers, twins, mets, yankees, athletics, phillies, pirates, padres, giants, mariners, cardinals, rays, rangers, blue jays, nationals

```python
team_names: List[str]  # e.g., ["yankees", "dodgers", "red sox"]
```

### `sports_fetch_nhl_summary`

**Valid teams (32):** ducks, coyotes, bruins, sabres, flames, hurricanes, blackhawks, avalanche, blue jackets, stars, red wings, oilers, panthers, kings, wild, canadiens, predators, devils, islanders, rangers, senators, flyers, penguins, sharks, kraken, blues, lightning, maple leafs, canucks, golden knights, capitals, jets

```python
team_names: List[str]  # e.g., ["bruins", "penguins", "maple leafs"]
```

**Note:** Team names are case-insensitive.

---

## Stocks (yfinance)

### `stocks_fetch_stock_info`

**Parameters:**
```python
symbols: List[str]  # Required - List of stock ticker symbols
```

**Valid Symbols:**
- Any NYSE/NASDAQ listed stock ticker
- Common examples: `AAPL`, `MSFT`, `GOOGL`, `AMZN`, `TSLA`, `NVDA`, `META`, `NFLX`
- ETFs: `SPY`, `QQQ`, `DIA`, `IWM`
- Indices: `^GSPC` (S&P 500), `^IXIC` (NASDAQ), `^DJI` (DOW)

**Examples:**
```python
["AAPL"]                    # Single stock
["AAPL", "GOOGL", "MSFT"]   # Multiple stocks
["TSLA", "NVDA"]            # Tech stocks
```

**Returns:**
```python
{
    "stocks": [
        {"symbol": "AAPL", "name": "Apple Inc.", "current_price": 271.49, ...},
        {"symbol": "GOOGL", "name": "Alphabet Inc.", "current_price": 299.66, ...}
    ],
    "last_updated": "2025-11-23T00:32:01.174366"
}
```

### `stocks_fetch_portfolio_data`

**Parameters:**
```python
symbols: List[str]  # Required - List of stock ticker symbols
```

**Examples:**
```python
["AAPL", "GOOGL", "MSFT"]
["TSLA", "NVDA", "AMD", "INTC"]
```

### `stocks_fetch_market_trends`

**Parameters:** None

**Returns:** Market overview with:
- Major indices (S&P 500, NASDAQ, DOW)
- Top gainers from: AAPL, MSFT, GOOGL, AMZN, TSLA, NVDA, META
- Top losers

---

## Strava

Requires OAuth authentication (client_id, client_secret, refresh_token).

### `strava_fetch_user_summary`

**Parameters:** None (uses authenticated user)

**Returns:**
- Athlete profile
- All-time stats (run, ride, swim)
- Recent activities (10)

### `strava_get_activities`

**Parameters:**
```python
limit: int = 10  # Optional, default 10
```

**Valid Range:** 1-200 (API max is 200 per page)

**Examples:**
```python
10   # Default - last 10 activities
50   # Last 50 activities
200  # Maximum per request
```

**Note:** For more than 200 activities, use pagination with `page` parameter (not currently exposed).

---

## Clash Royale

Requires API key from [developer.clashroyale.com](https://developer.clashroyale.com/)

### `clash_fetch_user_summary`

**Parameters:**
```python
player_tag: str  # Required - Player tag with # prefix
```

**Format:** `#` followed by alphanumeric characters (letters and numbers only)

**Examples:**
```python
"#JYJQC88"      # Valid
"#89U82VQ0R"    # Valid
"#2908VQ08"     # Valid
"#GUG0R829"     # Valid
```

**Invalid Examples:**
```python
"JYJQC88"       # Missing # prefix
"#jyjqc88"      # Lowercase (must be uppercase)
"#JYJ-QC88"     # Contains invalid character (-)
```

**Note:** The `#` is automatically URL-encoded to `%23` when making API requests.

### `clash_get_player`

**Parameters:**
```python
player_tag: str  # Same format as above
```

---

## Spotify

Requires OAuth authentication (client_id, client_secret, redirect_uri).

### `spotify_fetch_user_data`

**Parameters:** None (uses authenticated user)

**Returns:**
- Top songs (with title, artist, plays)
- Top artists
- Top genres
- Total listening time

**Note:** Requires user to complete OAuth flow via `/api/spotify/auth` first.

---

## Tool Decorator Examples

When adding `@tool_function` decorators, use these descriptions:

```python
@tool_function(
    description="Get summary of favorite NBA teams including wins, losses, and standings",
    params={
        "team_names": {
            "type": "array",
            "items": {"type": "string"},
            "description": "List of NBA team names (e.g., ['lakers', 'warriors', 'celtics']). Valid: lakers, warriors, celtics, heat, bulls, nets, knicks, 76ers, bucks, raptors, cavaliers, pistons, pacers, hawks, hornets, magic, wizards, nuggets, timberwolves, thunder, blazers, jazz, mavericks, rockets, grizzlies, pelicans, spurs, suns, clippers, kings"
        }
    }
)
def fetch_user_sports_summary(self, team_names: List[str]):
    ...

@tool_function(
    description="Get real-time stock price, volume, market cap, and year performance for one or more ticker symbols",
    params={
        "symbols": {
            "type": "array",
            "items": {"type": "string"},
            "description": "List of stock ticker symbols (e.g., ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN', 'NVDA', 'META'])"
        }
    }
)
def fetch_stock_info(self, symbols: List[str]):
    ...

@tool_function(
    description="Get Clash Royale player stats including trophies, wins, and current deck",
    params={
        "player_tag": {
            "type": "string",
            "description": "Player tag with # prefix (e.g., '#JYJQC88', '#89U82VQ0R'). Must be uppercase alphanumeric."
        }
    }
)
def fetch_user_summary(self, player_tag: str):
    ...

@tool_function(
    description="Get user's recent Strava activities with distance, duration, and pace",
    params={
        "limit": {
            "type": "integer",
            "description": "Number of activities to return (1-200, default: 10)"
        }
    }
)
def get_activities(self, limit: int = 10):
    ...
```

---

## API Documentation Links

- **Strava**: [developers.strava.com/docs/reference](https://developers.strava.com/docs/reference/)
- **Clash Royale**: [developer.clashroyale.com](https://developer.clashroyale.com/)
- **Yahoo Finance**: [finance.yahoo.com/lookup](https://finance.yahoo.com/lookup/)
- **ESPN**: Uses public API at `site.api.espn.com`
