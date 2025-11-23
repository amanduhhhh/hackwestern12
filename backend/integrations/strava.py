import requests
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime

from tool_generator import tool_function

logger = logging.getLogger(__name__)


class StravaDataFetcher:
    def __init__(
        self, client_id: str = "", client_secret: str = "", refresh_token: str = ""
    ):
        self.client_id = client_id
        self.client_secret = client_secret
        self.refresh_token = refresh_token
        self.access_token = None
        self.token_expires_at = 0
        self.base_url = "https://www.strava.com/api/v3"

    def _ensure_token(self) -> bool:
        if self.access_token and datetime.now().timestamp() < self.token_expires_at:
            return True

        try:
            r = requests.post(
                "https://www.strava.com/oauth/token",
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "refresh_token": self.refresh_token,
                    "grant_type": "refresh_token",
                },
                timeout=10,
            )
            r.raise_for_status()

            data = r.json()
            self.access_token = data.get("access_token")
            self.token_expires_at = data.get("expires_at", 0)
            return True
        except Exception as e:
            logger.error(f"Strava token refresh failed: {e}")
            return False

    def _get_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Accept": "application/json",
        }

    def get_athlete(self) -> Optional[Dict[str, Any]]:
        if not self._ensure_token():
            return None

        try:
            r = requests.get(
                f"{self.base_url}/athlete", headers=self._get_headers(), timeout=10
            )
            r.raise_for_status()
            data = r.json()

            return {
                "id": data.get("id"),
                "firstname": data.get("firstname"),
                "lastname": data.get("lastname"),
                "city": data.get("city"),
                "state": data.get("state"),
                "country": data.get("country"),
                "sex": data.get("sex"),
                "premium": data.get("premium"),
                "profile": data.get("profile"),
                "profile_medium": data.get("profile_medium"),
                "created_at": data.get("created_at"),
            }
        except Exception as e:
            logger.error(f"Failed to fetch Strava athlete: {e}")
            return None

    def get_athlete_stats(self, athlete_id: int) -> Optional[Dict[str, Any]]:
        if not self._ensure_token():
            return None

        try:
            r = requests.get(
                f"{self.base_url}/athletes/{athlete_id}/stats",
                headers=self._get_headers(),
                timeout=10,
            )
            r.raise_for_status()
            data = r.json()

            def convert_totals(totals: Dict[str, Any]) -> Dict[str, Any]:
                return {
                    "count": totals.get("count", 0),
                    "distance_miles": round(totals.get("distance", 0) / 1609.34, 1),
                    "moving_time_hours": round(totals.get("moving_time", 0) / 3600, 1),
                    "elevation_gain_feet": round(
                        totals.get("elevation_gain", 0) * 3.28084, 0
                    ),
                }

            return {
                "all_run_totals": convert_totals(data.get("all_run_totals", {})),
                "all_ride_totals": convert_totals(data.get("all_ride_totals", {})),
                "all_swim_totals": {
                    "count": data.get("all_swim_totals", {}).get("count", 0),
                    "distance_yards": round(
                        data.get("all_swim_totals", {}).get("distance", 0) * 1.09361, 1
                    ),
                    "moving_time_hours": round(
                        data.get("all_swim_totals", {}).get("moving_time", 0) / 3600, 1
                    ),
                },
                "recent_run_totals": convert_totals(data.get("recent_run_totals", {})),
                "ytd_run_totals": convert_totals(data.get("ytd_run_totals", {})),
                "ytd_ride_totals": convert_totals(data.get("ytd_ride_totals", {})),
            }
        except Exception as e:
            logger.error(f"Failed to fetch Strava stats: {e}")
            return None

    @tool_function(
        description="Get user's recent Strava activities with distance, duration, elevation, speed, and heart rate data",
        params={
            "limit": {
                "type": "integer",
                "description": "Number of activities to return (1-200, default: 10)"
            }
        }
    )
    def get_activities(self, limit: int = 10) -> Optional[List[Dict[str, Any]]]:
        if not self._ensure_token():
            return None

        try:
            r = requests.get(
                f"{self.base_url}/athlete/activities",
                headers=self._get_headers(),
                params={"per_page": limit},
                timeout=10,
            )
            r.raise_for_status()

            activities = []
            for activity in r.json():
                activities.append(
                    {
                        "id": activity.get("id"),
                        "name": activity.get("name"),
                        "type": activity.get("type"),
                        "sport_type": activity.get("sport_type"),
                        "start_date": activity.get("start_date_local"),
                        "distance_miles": round(
                            activity.get("distance", 0) / 1609.34, 2
                        ),
                        "moving_time_minutes": round(
                            activity.get("moving_time", 0) / 60, 1
                        ),
                        "elapsed_time_minutes": round(
                            activity.get("elapsed_time", 0) / 60, 1
                        ),
                        "elevation_gain_feet": round(
                            activity.get("total_elevation_gain", 0) * 3.28084, 0
                        ),
                        "average_speed_mph": round(
                            activity.get("average_speed", 0) * 2.23694, 1
                        ),
                        "max_speed_mph": round(
                            activity.get("max_speed", 0) * 2.23694, 1
                        ),
                        "average_heartrate": activity.get("average_heartrate"),
                        "max_heartrate": activity.get("max_heartrate"),
                        "calories": activity.get("calories"),
                        "kudos_count": activity.get("kudos_count", 0),
                        "achievement_count": activity.get("achievement_count", 0),
                    }
                )

            return activities
        except Exception as e:
            logger.error(f"Failed to fetch Strava activities: {e}")
            return None

    @tool_function(
        description="Get user's complete Strava fitness summary including athlete profile, all-time stats for running/cycling/swimming, and recent activities",
        params={}
    )
    def fetch_user_summary(self) -> Optional[Dict[str, Any]]:
        athlete = self.get_athlete()
        if not athlete:
            return None

        stats = self.get_athlete_stats(athlete["id"])
        activities = self.get_activities(limit=10)

        return {
            "athlete": athlete,
            "stats": stats or {},
            "recent_activities": activities or [],
            "last_updated": datetime.now().isoformat(),
        }

    def is_authenticated(self) -> bool:
        return bool(self.client_id and self.client_secret and self.refresh_token)
