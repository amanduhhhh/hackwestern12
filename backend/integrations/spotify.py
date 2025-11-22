import os
import logging
from typing import Optional, Dict, Any
from datetime import datetime
import spotipy
from spotipy.oauth2 import SpotifyOAuth

logger = logging.getLogger(__name__)


class SpotifyDataFetcher:
    def __init__(self, client_id: str, client_secret: str, redirect_uri: str):
        self.auth = SpotifyOAuth(
            client_id=client_id,
            client_secret=client_secret,
            redirect_uri=redirect_uri,
            scope="user-top-read user-read-recently-played user-library-read",
            cache_path=".spotify_token_cache",
            show_dialog=True,
        )

    def get_authorization_url(self) -> str:
        return self.auth.get_authorize_url()

    def fetch_token_from_code(self, code: str) -> Dict[str, Any]:
        return self.auth.get_access_token(code, as_dict=True)

    def get_spotify_client(self) -> Optional[spotipy.Spotify]:
        try:
            token = self.auth.get_cached_token()
            if not token:
                return None
            if self.auth.is_token_expired(token):
                self.auth.refresh_access_token(token["refresh_token"])
            return spotipy.Spotify(auth_manager=self.auth)
        except Exception as e:
            logger.error(f"Spotify auth error: {e}")
            return None

    def fetch_user_data(self) -> Optional[Dict[str, Any]]:
        sp = self.get_spotify_client()
        if not sp:
            return None

        try:
            tracks = sp.current_user_top_tracks(limit=10, time_range="short_term")
            artists = sp.current_user_top_artists(limit=20, time_range="medium_term")
            recent = sp.current_user_recently_played(limit=50)

            top_songs = [
                {
                    "title": t["name"],
                    "artist": t["artists"][0]["name"],
                    "album": t["album"]["name"],
                    "popularity": t["popularity"],
                }
                for t in tracks["items"]
            ]

            genres = [g for a in artists["items"] for g in a["genres"]]
            genre_counts = {}
            for g in genres:
                genre_counts[g] = genre_counts.get(g, 0) + 1
            top_genres = [
                g.title()
                for g, _ in sorted(
                    genre_counts.items(), key=lambda x: x[1], reverse=True
                )[:5]
            ]

            top_artists = [
                {
                    "name": a["name"],
                    "genres": a["genres"],
                    "popularity": a["popularity"],
                }
                for a in artists["items"][:10]
            ]

            return {
                "top_songs": top_songs,
                "top_genres": top_genres,
                "top_artists": top_artists,
                "total_minutes": len(recent["items"]) * 365 * 3,
                "last_updated": datetime.now().isoformat(),
            }
        except Exception as e:
            logger.error(f"Failed to fetch Spotify data: {e}")
            return None

    def is_authenticated(self) -> bool:
        return self.auth.get_cached_token() is not None

    def clear_token(self):
        if os.path.exists(".spotify_token_cache"):
            os.remove(".spotify_token_cache")
