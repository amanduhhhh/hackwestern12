import requests
from typing import Optional, Dict, Any, List
from datetime import datetime


class StravaDataFetcher:
    def __init__(self, client_id: str = "", client_secret: str = "", refresh_token: str = ""):
        self.client_id = client_id
        self.client_secret = client_secret
        self.refresh_token = refresh_token
        self.access_token = None
        self.token_expires_at = 0
        self.base_url = "https://www.strava.com/api/v3"
    
    def _ensure_token(self) -> bool:
        """Refresh access token if expired"""
        if self.access_token and datetime.now().timestamp() < self.token_expires_at:
            return True
        
        try:
            r = requests.post(
                "https://www.strava.com/oauth/token",
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "refresh_token": self.refresh_token,
                    "grant_type": "refresh_token"
                },
                timeout=10
            )
            if r.status_code != 200:
                print(f"Token refresh failed: {r.status_code}")
                return False
            
            data = r.json()
            self.access_token = data.get("access_token")
            self.token_expires_at = data.get("expires_at", 0)
            return True
        except Exception as e:
            print(f"Error refreshing token: {e}")
            return False
    
    def _get_headers(self) -> Dict[str, str]:
        """Get authorization headers"""
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Accept": "application/json"
        }
    
    def get_athlete(self) -> Optional[Dict[str, Any]]:
        """Get authenticated athlete profile"""
        if not self._ensure_token():
            return None
        
        try:
            r = requests.get(
                f"{self.base_url}/athlete",
                headers=self._get_headers(),
                timeout=10
            )
            if r.status_code != 200:
                return None
            
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
            print(f"Error fetching athlete: {e}")
            return None
    
    def get_athlete_stats(self, athlete_id: int) -> Optional[Dict[str, Any]]:
        """Get athlete statistics (totals, recent, ytd)"""
        if not self._ensure_token():
            return None
        
        try:
            r = requests.get(
                f"{self.base_url}/athletes/{athlete_id}/stats",
                headers=self._get_headers(),
                timeout=10
            )
            if r.status_code != 200:
                return None
            
            data = r.json()
            return {
                "all_run_totals": {
                    "count": data.get("all_run_totals", {}).get("count", 0),
                    "distance_miles": round(data.get("all_run_totals", {}).get("distance", 0) / 1609.34, 1),
                    "moving_time_hours": round(data.get("all_run_totals", {}).get("moving_time", 0) / 3600, 1),
                    "elevation_gain_feet": round(data.get("all_run_totals", {}).get("elevation_gain", 0) * 3.28084, 0),
                },
                "all_ride_totals": {
                    "count": data.get("all_ride_totals", {}).get("count", 0),
                    "distance_miles": round(data.get("all_ride_totals", {}).get("distance", 0) / 1609.34, 1),
                    "moving_time_hours": round(data.get("all_ride_totals", {}).get("moving_time", 0) / 3600, 1),
                    "elevation_gain_feet": round(data.get("all_ride_totals", {}).get("elevation_gain", 0) * 3.28084, 0),
                },
                "all_swim_totals": {
                    "count": data.get("all_swim_totals", {}).get("count", 0),
                    "distance_yards": round(data.get("all_swim_totals", {}).get("distance", 0) * 1.09361, 1),
                    "moving_time_hours": round(data.get("all_swim_totals", {}).get("moving_time", 0) / 3600, 1),
                },
                "recent_run_totals": {
                    "count": data.get("recent_run_totals", {}).get("count", 0),
                    "distance_miles": round(data.get("recent_run_totals", {}).get("distance", 0) / 1609.34, 1),
                    "moving_time_hours": round(data.get("recent_run_totals", {}).get("moving_time", 0) / 3600, 1),
                },
                "ytd_run_totals": {
                    "count": data.get("ytd_run_totals", {}).get("count", 0),
                    "distance_miles": round(data.get("ytd_run_totals", {}).get("distance", 0) / 1609.34, 1),
                    "moving_time_hours": round(data.get("ytd_run_totals", {}).get("moving_time", 0) / 3600, 1),
                },
                "ytd_ride_totals": {
                    "count": data.get("ytd_ride_totals", {}).get("count", 0),
                    "distance_miles": round(data.get("ytd_ride_totals", {}).get("distance", 0) / 1609.34, 1),
                    "moving_time_hours": round(data.get("ytd_ride_totals", {}).get("moving_time", 0) / 3600, 1),
                },
            }
        except Exception as e:
            print(f"Error fetching athlete stats: {e}")
            return None
    
    def get_activities(self, limit: int = 10) -> Optional[List[Dict[str, Any]]]:
        """Get recent activities"""
        if not self._ensure_token():
            return None
        
        try:
            r = requests.get(
                f"{self.base_url}/athlete/activities",
                headers=self._get_headers(),
                params={"per_page": limit},
                timeout=10
            )
            if r.status_code != 200:
                return None
            
            activities = []
            for activity in r.json():
                activities.append({
                    "id": activity.get("id"),
                    "name": activity.get("name"),
                    "type": activity.get("type"),
                    "sport_type": activity.get("sport_type"),
                    "start_date": activity.get("start_date_local"),
                    "distance_miles": round(activity.get("distance", 0) / 1609.34, 2),
                    "moving_time_minutes": round(activity.get("moving_time", 0) / 60, 1),
                    "elapsed_time_minutes": round(activity.get("elapsed_time", 0) / 60, 1),
                    "elevation_gain_feet": round(activity.get("total_elevation_gain", 0) * 3.28084, 0),
                    "average_speed_mph": round(activity.get("average_speed", 0) * 2.23694, 1),
                    "max_speed_mph": round(activity.get("max_speed", 0) * 2.23694, 1),
                    "average_heartrate": activity.get("average_heartrate"),
                    "max_heartrate": activity.get("max_heartrate"),
                    "calories": activity.get("calories"),
                    "kudos_count": activity.get("kudos_count", 0),
                    "achievement_count": activity.get("achievement_count", 0),
                })
            
            return activities
        except Exception as e:
            print(f"Error fetching activities: {e}")
            return None
    
    def get_activity_detail(self, activity_id: int) -> Optional[Dict[str, Any]]:
        """Get detailed info for a single activity"""
        if not self._ensure_token():
            return None
        
        try:
            r = requests.get(
                f"{self.base_url}/activities/{activity_id}",
                headers=self._get_headers(),
                timeout=10
            )
            if r.status_code != 200:
                return None
            
            data = r.json()
            
            # Parse splits if available
            splits = []
            for split in data.get("splits_standard", []):
                splits.append({
                    "split": split.get("split"),
                    "distance_miles": round(split.get("distance", 0) / 1609.34, 2),
                    "elapsed_time_seconds": split.get("elapsed_time"),
                    "pace_per_mile": self._seconds_to_pace(split.get("elapsed_time", 0), split.get("distance", 0)),
                    "elevation_diff_feet": round(split.get("elevation_difference", 0) * 3.28084, 0),
                    "average_heartrate": split.get("average_heartrate"),
                })
            
            # Parse laps if available
            laps = []
            for lap in data.get("laps", []):
                laps.append({
                    "name": lap.get("name"),
                    "distance_miles": round(lap.get("distance", 0) / 1609.34, 2),
                    "elapsed_time_minutes": round(lap.get("elapsed_time", 0) / 60, 1),
                    "average_speed_mph": round(lap.get("average_speed", 0) * 2.23694, 1),
                    "average_heartrate": lap.get("average_heartrate"),
                    "max_heartrate": lap.get("max_heartrate"),
                })
            
            return {
                "id": data.get("id"),
                "name": data.get("name"),
                "type": data.get("type"),
                "sport_type": data.get("sport_type"),
                "description": data.get("description"),
                "start_date": data.get("start_date_local"),
                "distance_miles": round(data.get("distance", 0) / 1609.34, 2),
                "moving_time_minutes": round(data.get("moving_time", 0) / 60, 1),
                "elapsed_time_minutes": round(data.get("elapsed_time", 0) / 60, 1),
                "elevation_gain_feet": round(data.get("total_elevation_gain", 0) * 3.28084, 0),
                "elevation_high_feet": round(data.get("elev_high", 0) * 3.28084, 0),
                "elevation_low_feet": round(data.get("elev_low", 0) * 3.28084, 0),
                "average_speed_mph": round(data.get("average_speed", 0) * 2.23694, 1),
                "max_speed_mph": round(data.get("max_speed", 0) * 2.23694, 1),
                "average_heartrate": data.get("average_heartrate"),
                "max_heartrate": data.get("max_heartrate"),
                "calories": data.get("calories"),
                "kudos_count": data.get("kudos_count", 0),
                "comment_count": data.get("comment_count", 0),
                "achievement_count": data.get("achievement_count", 0),
                "gear": data.get("gear", {}).get("name") if data.get("gear") else None,
                "device_name": data.get("device_name"),
                "splits": splits,
                "laps": laps,
            }
        except Exception as e:
            print(f"Error fetching activity detail: {e}")
            return None
    
    def _seconds_to_pace(self, seconds: int, distance_meters: float) -> str:
        """Convert to pace per mile (mm:ss)"""
        if distance_meters <= 0:
            return "0:00"
        pace_seconds = seconds / (distance_meters / 1609.34)
        minutes = int(pace_seconds // 60)
        secs = int(pace_seconds % 60)
        return f"{minutes}:{secs:02d}"
    
    def fetch_user_summary(self) -> Optional[Dict[str, Any]]:
        """Get complete user summary (matches pattern from other integrations)"""
        try:
            athlete = self.get_athlete()
            if not athlete:
                return None
            
            stats = self.get_athlete_stats(athlete["id"])
            activities = self.get_activities(limit=5)
            
            return {
                "athlete": athlete,
                "stats": stats or {},
                "recent_activities": activities or [],
                "last_updated": datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error fetching user summary: {e}")
            return None
    
    def is_authenticated(self) -> bool:
        return bool(self.client_id and self.client_secret and self.refresh_token) 