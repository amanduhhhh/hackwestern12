"""
Data source integrations for the application.
Each integration handles authentication and data fetching for external APIs.
"""

from .spotify import SpotifyDataFetcher
from .sports import SportsDataFetcher
from .stocks import StocksDataFetcher
from .clashroyale import ClashRoyaleDataFetcher
from .strava import StravaDataFetcher  

__all__ = ['SpotifyDataFetcher', 'SportsDataFetcher', 'StocksDataFetcher', 'ClashRoyaleDataFetcher', 'StravaDataFetcher']
