import requests
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime

logger = logging.getLogger(__name__)


class SportsDataFetcher:
    def __init__(self, api_key: str = ""):
        self.api_key = api_key or "3"
        self.base_url = "https://www.thesportsdb.com/api/v1/json"

    def search_team(self, team_name: str) -> Optional[Dict[str, Any]]:
        try:
            r = requests.get(
                f"{self.base_url}/{self.api_key}/searchteams.php",
                params={"t": team_name},
                timeout=10,
            )
            r.raise_for_status()
            data = r.json()

            if data.get("teams") and len(data["teams"]) > 0:
                t = data["teams"][0]
                return {
                    "id": t.get("idTeam"),
                    "name": t.get("strTeam"),
                    "sport": t.get("strSport"),
                    "league": t.get("strLeague"),
                    "stadium": t.get("strStadium"),
                }
            return None
        except Exception as e:
            logger.error(f"Failed to search team {team_name}: {e}")
            return None

    def get_team_stats(self, team_id: str) -> Optional[Dict[str, Any]]:
        try:
            r = requests.get(
                f"{self.base_url}/{self.api_key}/eventslast.php",
                params={"id": team_id},
                timeout=10,
            )
            r.raise_for_status()
            data = r.json()

            if not data.get("results"):
                return {"wins": 0, "losses": 0, "draws": 0}

            wins, losses, draws = 0, 0, 0
            for event in data["results"][:5]:
                home_score = event.get("intHomeScore")
                away_score = event.get("intAwayScore")

                if home_score and away_score:
                    home_score, away_score = int(home_score), int(away_score)
                    if home_score > away_score:
                        wins += 1
                    elif home_score < away_score:
                        losses += 1
                    else:
                        draws += 1

            return {"wins": wins, "losses": losses, "draws": draws}
        except Exception as e:
            logger.error(f"Failed to get team stats for {team_id}: {e}")
            return {"wins": 0, "losses": 0, "draws": 0}

    def fetch_user_sports_summary(
        self, team_names: List[str]
    ) -> Optional[Dict[str, Any]]:
        try:
            teams = []
            for name in team_names:
                team_info = self.search_team(name)
                if team_info:
                    stats = self.get_team_stats(team_info["id"])
                    teams.append({**team_info, **stats})

            if not teams:
                return None

            return {"teams": teams, "last_updated": datetime.now().isoformat()}
        except Exception as e:
            logger.error(f"Failed to fetch sports summary: {e}")
            return None

    def is_authenticated(self) -> bool:
        return bool(self.api_key)
