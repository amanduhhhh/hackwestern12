import requests
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime

from tool_generator import tool_function

logger = logging.getLogger(__name__)

LEAGUE_CONFIG = {
    "nba": {
        "sport": "basketball",
        "name": "NBA",
        "teams": {
            "lakers": "lal", "warriors": "gs", "celtics": "bos", "heat": "mia",
            "bulls": "chi", "nets": "bkn", "knicks": "ny", "76ers": "phi",
            "bucks": "mil", "raptors": "tor", "cavaliers": "cle", "pistons": "det",
            "pacers": "ind", "hawks": "atl", "hornets": "cha", "magic": "orl",
            "wizards": "wsh", "nuggets": "den", "timberwolves": "min", "thunder": "okc",
            "blazers": "por", "jazz": "utah", "mavericks": "dal", "rockets": "hou",
            "grizzlies": "mem", "pelicans": "no", "spurs": "sa", "suns": "phx",
            "clippers": "lac", "kings": "sac"
        }
    },
    "nfl": {
        "sport": "football",
        "name": "NFL",
        "teams": {
            "cardinals": "ari", "falcons": "atl", "ravens": "bal", "bills": "buf",
            "panthers": "car", "bears": "chi", "bengals": "cin", "browns": "cle",
            "cowboys": "dal", "broncos": "den", "lions": "det", "packers": "gb",
            "texans": "hou", "colts": "ind", "jaguars": "jax", "chiefs": "kc",
            "raiders": "lv", "chargers": "lac", "rams": "lar", "dolphins": "mia",
            "vikings": "min", "patriots": "ne", "saints": "no", "giants": "nyg",
            "jets": "nyj", "eagles": "phi", "steelers": "pit", "49ers": "sf",
            "seahawks": "sea", "buccaneers": "tb", "titans": "ten", "commanders": "wsh"
        }
    },
    "mlb": {
        "sport": "baseball",
        "name": "MLB",
        "teams": {
            "diamondbacks": "ari", "braves": "atl", "orioles": "bal", "red sox": "bos",
            "cubs": "chc", "white sox": "chw", "reds": "cin", "guardians": "cle",
            "rockies": "col", "tigers": "det", "astros": "hou", "royals": "kc",
            "angels": "laa", "dodgers": "lad", "marlins": "mia", "brewers": "mil",
            "twins": "min", "mets": "nym", "yankees": "nyy", "athletics": "oak",
            "phillies": "phi", "pirates": "pit", "padres": "sd", "giants": "sf",
            "mariners": "sea", "cardinals": "stl", "rays": "tb", "rangers": "tex",
            "blue jays": "tor", "nationals": "wsh"
        }
    },
    "nhl": {
        "sport": "hockey",
        "name": "NHL",
        "teams": {
            "ducks": "ana", "coyotes": "ari", "bruins": "bos", "sabres": "buf",
            "flames": "cgy", "hurricanes": "car", "blackhawks": "chi", "avalanche": "col",
            "blue jackets": "cbj", "stars": "dal", "red wings": "det", "oilers": "edm",
            "panthers": "fla", "kings": "la", "wild": "min", "canadiens": "mtl",
            "predators": "nsh", "devils": "njd", "islanders": "nyi", "rangers": "nyr",
            "senators": "ott", "flyers": "phi", "penguins": "pit", "sharks": "sj",
            "kraken": "sea", "blues": "stl", "lightning": "tb", "maple leafs": "tor",
            "canucks": "van", "golden knights": "vgk", "capitals": "wsh", "jets": "wpg"
        }
    }
}


class SportsDataFetcher:
    def __init__(self, api_key: str = ""):
        self.base_url = "https://site.api.espn.com/apis/site/v2/sports"

    def _get_team_abbr(self, team_name: str, league: str) -> Optional[str]:
        name_lower = team_name.lower().strip()
        config = LEAGUE_CONFIG.get(league)
        if not config:
            return None

        for team_key, abbr in config["teams"].items():
            if team_key in name_lower or name_lower in team_key or abbr == name_lower:
                return abbr

        return None

    def _fetch_team_schedule(self, abbr: str, league: str, limit: int = 5) -> List[Dict[str, Any]]:
        config = LEAGUE_CONFIG[league]
        try:
            r = requests.get(
                f"{self.base_url}/{config['sport']}/{league}/teams/{abbr}/schedule",
                timeout=10
            )
            r.raise_for_status()
            data = r.json()

            events = data.get("events", [])
            schedule = []

            for event in events[:limit]:
                competitions = event.get("competitions", [{}])
                if not competitions:
                    continue

                comp = competitions[0]
                competitors = comp.get("competitors", [])

                home_team = None
                away_team = None
                for team in competitors:
                    if team.get("homeAway") == "home":
                        home_team = team
                    else:
                        away_team = team

                # Score is a dict with 'value' and 'displayValue'
                home_score_data = home_team.get("score", {}) if home_team else {}
                away_score_data = away_team.get("score", {}) if away_team else {}

                if isinstance(home_score_data, dict):
                    home_score = int(home_score_data.get("value", 0))
                else:
                    home_score = int(home_score_data) if home_score_data else 0

                if isinstance(away_score_data, dict):
                    away_score = int(away_score_data.get("value", 0))
                else:
                    away_score = int(away_score_data) if away_score_data else 0

                schedule.append({
                    "date": event.get("date", "")[:10],
                    "name": event.get("name", ""),
                    "shortName": event.get("shortName", ""),
                    "completed": comp.get("status", {}).get("type", {}).get("completed", False),
                    "homeTeam": home_team.get("team", {}).get("displayName", "") if home_team else "",
                    "awayTeam": away_team.get("team", {}).get("displayName", "") if away_team else "",
                    "homeScore": home_score,
                    "awayScore": away_score,
                })

            return schedule
        except Exception as e:
            logger.error(f"Failed to fetch {league} schedule: {e}")
            return []

    def _fetch_team_data(self, team_name: str, league: str) -> Optional[Dict[str, Any]]:
        abbr = self._get_team_abbr(team_name, league)
        if not abbr:
            return None

        config = LEAGUE_CONFIG[league]

        try:
            r = requests.get(
                f"{self.base_url}/{config['sport']}/{league}/teams/{abbr}",
                timeout=10
            )
            r.raise_for_status()
            data = r.json()

            team = data.get("team", {})
            team_id = team.get("id")
            record = team.get("record", {})
            items = record.get("items", [])

            stats = {
                "wins": 0, "losses": 0, "winPercent": 0,
                "avgPointsFor": 0, "avgPointsAgainst": 0,
                "streak": 0, "playoffSeed": 0, "pointDifferential": 0
            }
            for item in items:
                if item.get("type") == "total":
                    stats_data = item.get("stats", [])
                    for stat in stats_data:
                        name = stat.get("name")
                        value = stat.get("value", 0)
                        if name == "wins":
                            stats["wins"] = int(value)
                        elif name == "losses":
                            stats["losses"] = int(value)
                        elif name == "winPercent":
                            stats["winPercent"] = round(value * 100, 1)
                        elif name == "avgPointsFor":
                            stats["avgPointsFor"] = round(value, 1)
                        elif name == "avgPointsAgainst":
                            stats["avgPointsAgainst"] = round(value, 1)
                        elif name == "streak":
                            stats["streak"] = int(value)
                        elif name == "playoffSeed":
                            stats["playoffSeed"] = int(value)
                        elif name == "pointDifferential":
                            stats["pointDifferential"] = round(value, 1)

            # Fetch recent/upcoming games
            schedule = self._fetch_team_schedule(abbr, league, limit=5)

            return {
                "id": team_id,
                "name": team.get("displayName"),
                "sport": config["sport"].title(),
                "league": config["name"],
                "abbreviation": abbr,
                "color": team.get("color", ""),
                "wins": stats["wins"],
                "losses": stats["losses"],
                "winPercent": stats["winPercent"],
                "avgPointsFor": stats["avgPointsFor"],
                "avgPointsAgainst": stats["avgPointsAgainst"],
                "streak": stats["streak"],
                "playoffSeed": stats["playoffSeed"],
                "pointDifferential": stats["pointDifferential"],
                "schedule": schedule
            }
        except Exception as e:
            logger.error(f"Failed to fetch {league} team {team_name}: {e}")
            return None

    @tool_function(
        description="Get NBA basketball team stats including wins and losses. Valid teams: lakers, warriors, celtics, heat, bulls, nets, knicks, 76ers, bucks, raptors, cavaliers, pistons, pacers, hawks, hornets, magic, wizards, nuggets, timberwolves, thunder, blazers, jazz, mavericks, rockets, grizzlies, pelicans, spurs, suns, clippers, kings",
        params={
            "team_names": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of NBA team names (e.g., ['lakers', 'warriors', 'celtics'])"
            }
        }
    )
    def fetch_nba_summary(self, team_names: List[str]) -> Optional[Dict[str, Any]]:
        try:
            teams = []
            for name in team_names:
                team_data = self._fetch_team_data(name, "nba")
                if team_data:
                    teams.append(team_data)

            if not teams:
                return None

            return {"teams": teams, "league": "NBA", "last_updated": datetime.now().isoformat()}
        except Exception as e:
            logger.error(f"Failed to fetch NBA summary: {e}")
            return None

    @tool_function(
        description="Get NFL football team stats including wins and losses. Valid teams: cardinals, falcons, ravens, bills, panthers, bears, bengals, browns, cowboys, broncos, lions, packers, texans, colts, jaguars, chiefs, raiders, chargers, rams, dolphins, vikings, patriots, saints, giants, jets, eagles, steelers, 49ers, seahawks, buccaneers, titans, commanders",
        params={
            "team_names": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of NFL team names (e.g., ['cowboys', 'patriots', 'chiefs'])"
            }
        }
    )
    def fetch_nfl_summary(self, team_names: List[str]) -> Optional[Dict[str, Any]]:
        try:
            teams = []
            for name in team_names:
                team_data = self._fetch_team_data(name, "nfl")
                if team_data:
                    teams.append(team_data)

            if not teams:
                return None

            return {"teams": teams, "league": "NFL", "last_updated": datetime.now().isoformat()}
        except Exception as e:
            logger.error(f"Failed to fetch NFL summary: {e}")
            return None

    @tool_function(
        description="Get MLB baseball team stats including wins and losses. Valid teams: diamondbacks, braves, orioles, red sox, cubs, white sox, reds, guardians, rockies, tigers, astros, royals, angels, dodgers, marlins, brewers, twins, mets, yankees, athletics, phillies, pirates, padres, giants, mariners, cardinals, rays, rangers, blue jays, nationals",
        params={
            "team_names": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of MLB team names (e.g., ['yankees', 'dodgers', 'red sox'])"
            }
        }
    )
    def fetch_mlb_summary(self, team_names: List[str]) -> Optional[Dict[str, Any]]:
        try:
            teams = []
            for name in team_names:
                team_data = self._fetch_team_data(name, "mlb")
                if team_data:
                    teams.append(team_data)

            if not teams:
                return None

            return {"teams": teams, "league": "MLB", "last_updated": datetime.now().isoformat()}
        except Exception as e:
            logger.error(f"Failed to fetch MLB summary: {e}")
            return None

    @tool_function(
        description="Get NHL hockey team stats including wins and losses. Valid teams: ducks, coyotes, bruins, sabres, flames, hurricanes, blackhawks, avalanche, blue jackets, stars, red wings, oilers, panthers, kings, wild, canadiens, predators, devils, islanders, rangers, senators, flyers, penguins, sharks, kraken, blues, lightning, maple leafs, canucks, golden knights, capitals, jets",
        params={
            "team_names": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of NHL team names (e.g., ['bruins', 'penguins', 'maple leafs'])"
            }
        }
    )
    def fetch_nhl_summary(self, team_names: List[str]) -> Optional[Dict[str, Any]]:
        try:
            teams = []
            for name in team_names:
                team_data = self._fetch_team_data(name, "nhl")
                if team_data:
                    teams.append(team_data)

            if not teams:
                return None

            return {"teams": teams, "league": "NHL", "last_updated": datetime.now().isoformat()}
        except Exception as e:
            logger.error(f"Failed to fetch NHL summary: {e}")
            return None

    def is_authenticated(self) -> bool:
        return True
