from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    anthropic_api_key: str
    openai_api_key: str
    litellm_log: str = "INFO"
    cors_origins: list[str] = ["http://localhost:3000"]
    model: str = "gpt-4o"

    spotify_client_id: str
    spotify_client_secret: str
    spotify_redirect_uri: str = "http://localhost:8000/api/spotify/callback"

    sports_api_key: str

    strava_client_id: str
    strava_client_secret: str
    strava_refresh_token: str

    clashroyale_api_key: str

    # not used currently, using yahoo finance instead
    alpha_vantage_api_key: str = ""

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()
