#!/usr/bin/env python3
import os
from integrations import SpotifyDataFetcher
from config import get_settings


def main():
    print("Spotify Integration Test\n")

    settings = get_settings()

    if not settings.spotify_client_id or not settings.spotify_client_secret:
        print("ERROR: Spotify credentials not found in .env file")
        print("\nTo set up Spotify integration:")
        print("1. Create a Spotify app at https://developer.spotify.com/dashboard")
        print("2. Add credentials to your .env file:")
        print("   SPOTIFY_CLIENT_ID=your_client_id")
        print("   SPOTIFY_CLIENT_SECRET=your_client_secret")
        print("3. Set redirect URI: http://localhost:8000/api/spotify/callback")
        return

    print("OK: Spotify credentials found")

    fetcher = SpotifyDataFetcher(
        client_id=settings.spotify_client_id,
        client_secret=settings.spotify_client_secret,
        redirect_uri=settings.spotify_redirect_uri,
    )

    if fetcher.is_authenticated():
        print("OK: Already authenticated with Spotify")
        print("\nFetching your data...")

        data = fetcher.fetch_user_data()
        if data:
            print("\nOK: Data fetched successfully")
            print(f"   Top songs: {len(data['top_songs'])}")
            print(f"   Top genres: {', '.join(data['top_genres'])}")
            print(f"   Total listening time: ~{data['total_minutes']:,} minutes")

            print("\nYour top 3 songs:")
            for i, song in enumerate(data["top_songs"][:3], 1):
                print(f"   {i}. {song['title']} - {song['artist']}")
        else:
            print("ERROR: Failed to fetch data")
    else:
        print("ERROR: Not authenticated with Spotify yet")
        print("\nTo authenticate:")
        print("1. Start the backend server: python main.py")
        print("2. Open: http://localhost:8000/api/spotify/auth")
        print("3. Copy the auth_url and open it in your browser")
        print("4. Authorize the app")
        print("5. Run this script again")


if __name__ == "__main__":
    main()
