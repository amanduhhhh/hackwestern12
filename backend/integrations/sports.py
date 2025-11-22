import requests
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime

logger = logging.getLogger(__name__)

# ESPN team abbreviation mapping for NBA
NBA_TEAMS = {
    "lakers": "lal", "warriors": "gs", "celtics": "bos", "heat": "mia",
    "bulls": "chi", "nets": "bkn", "knicks": "ny", "76ers": "phi",
    "bucks": "mil", "raptors": "tor", "cavaliers": "cle", "pistons": "det",
    "pacers": "ind", "hawks": "atl", "hornets": "cha", "magic": "orl",
    "wizards": "wsh", "nuggets": "den", "timberwolves": "min", "thunder": "okc",
    "blazers": "por", "jazz": "utah", "mavericks": "dal", "rockets": "hou",
    "grizzlies": "mem", "pelicans": "no", "spurs": "sa", "suns": "phx",
    "clippers": "lac", "kings": "sac"
}


class SportsDataFetcher:
    def __init__(self, api_key: str = ""):
        self.base_url = "https://site.api.espn.com/apis/site/v2/sports"

    def search_team(self, team_name: str) -> Optional[Dict[str, Any]]:
        try:
            team_abbr = None
            name_lower = team_name.lower()
            for key, abbr in NBA_TEAMS.items():
                if key in name_lower or name_lower in key:
                    team_abbr = abbr
                    break
            
            if not team_abbr:
                return None
            
            r = requests.get(
                f"{self.base_url}/basketball/nba/teams/{team_abbr}",
                timeout=10
            )
            r.raise_for_status()
            data = r.json()
            
            team = data.get("team", {})
            venue = team.get("nextEvent", [{}])[0].get("competitions", [{}])[0].get("venue", {})
            if not venue:
                venue = {"fullName": "crypto.com Arena" if team_abbr == "lal" else None}
            
            return {
                "id": team.get("id"),
                "name": team.get("displayName"),
                "sport": "Basketball",
                "league": "NBA",
                "stadium": venue.get("fullName"),
                "abbreviation": team_abbr
            }
        except Exception as e:
            logger.error(f"Failed to search team {team_name}: {e}")
            return None

    def get_team_stats(self, team_id: str) -> Optional[Dict[str, Any]]:
        try:
            r = requests.get(
                f"{self.base_url}/basketball/nba/teams/{team_id}",
                timeout=10
            )
            r.raise_for_status()
            data = r.json()
            
            team = data.get("team", {})
            record = team.get("record", {})
            items = record.get("items", [])
            
            stats = {"wins": 0, "losses": 0}
            for item in items:
                if item.get("type") == "total":
                    stats_data = item.get("stats", [])
                    for stat in stats_data:
                        if stat.get("name") == "wins":
                            stats["wins"] = int(stat.get("value", 0))
                        elif stat.get("name") == "losses":
                            stats["losses"] = int(stat.get("value", 0))
            
            return stats
        except Exception as e:
            logger.error(f"Failed to get team stats for {team_id}: {e}")
            return {"wins": 0, "losses": 0}

    def fetch_user_sports_summary(self, team_names: List[str]) -> Optional[Dict[str, Any]]:
        try:
            teams = []
            for name in team_names:
                team_info = self.search_team(name)
                if team_info:
                    stats = self.get_team_stats(team_info["abbreviation"])
                    teams.append({**team_info, **stats})

            if not teams:
                return None

            return {"teams": teams, "last_updated": datetime.now().isoformat()}
        except Exception as e:
            logger.error(f"Failed to fetch sports summary: {e}")
            return None

    def is_authenticated(self) -> bool:
        return True
