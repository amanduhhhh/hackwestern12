from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    anthropic_api_key: str
    openai_api_key: str = ""
    litellm_log: str = "INFO"
    cors_origins: list[str] = ["http://localhost:3000"]
    
    # Spotify credentials
    spotify_client_id: str = ""
    spotify_client_secret: str = ""
    spotify_redirect_uri: str = "http://localhost:8000/api/spotify/callback"
    
    # Sports API (TheSportsDB - free tier available)
    sports_api_key: str = ""


    # Clash Royale API key
    clashroyale_api_key: str = ""
    
    # Stocks - using yfinance (no API key needed for basic features)
    # But can add Alpha Vantage for more features
    alpha_vantage_api_key: str = ""

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()
