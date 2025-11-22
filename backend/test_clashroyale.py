#!/usr/bin/env python3
"""
Quick test script to verify Clash Royale integration setup
"""

from integrations.clashroyale import ClashRoyaleDataFetcher
from config import get_settings


# PUT YOUR PLAYER TAG HERE
PLAYER_TAG = "#JP9R8V8G8"


def main():
    print("🎮 Clash Royale Integration Test\n")
    
    # Check if credentials are configured
    settings = get_settings()
    
    if not settings.clashroyale_api_key:
        print("❌ Clash Royale API key not found in .env file")
        print("\nTo set up Clash Royale integration:")
        print("1. Create an account at https://developer.clashroyale.com")
        print("2. Create a new API key (add your IP address)")
        print("3. Add to your .env file:")
        print("   CLASHROYALE_API_KEY=your_api_key")
        return
    
    print("✅ Clash Royale API key found")
    
    # Create fetcher instance
    fetcher = ClashRoyaleDataFetcher(api_key=settings.clashroyale_api_key)
    
    if PLAYER_TAG == "#PASTE_YOUR_TAG_HERE":
        print("❌ Set your player tag in test_clashroyale.py")
        return
    
    print(f"\nFetching data for {PLAYER_TAG}...")
    
    # Get player data
    player = fetcher.get_player(PLAYER_TAG)
    if player:
        print("\n📊 Player data fetched successfully!")
        print(f"   Name: {player['name']}")
        print(f"   Trophies: {player['trophies']}")
        print(f"   Arena: {player['arena']}")
        print(f"   Wins: {player['wins']} | Losses: {player['losses']}")
        print(f"   Clan: {player['clan'] or 'None'}")
        
        # Get recent battles
        battles = fetcher.get_player_battle_log(PLAYER_TAG, limit=3)
        if battles:
            print("\n⚔️ Recent battles:")
            for i, b in enumerate(battles, 1):
                print(f"   {i}. vs {b['opponent_name']} - {b['result'].upper()} ({b['team_crowns']}-{b['opponent_crowns']})")
        
        # Get current deck
        deck = fetcher.get_current_deck(PLAYER_TAG)
        if deck:
            print("\n🃏 Current deck:")
            print(f"   {', '.join([c['name'] for c in deck])}")
        
        # Get upcoming chests
        chests = fetcher.get_player_upcoming_chests(PLAYER_TAG)
        if chests:
            print("\n📦 Next 5 chests:")
            for c in chests[:5]:
                print(f"   +{c['index']}: {c['name']}")
    else:
        print("❌ Failed to fetch player data")
        print("   Check your API key and player tag")


if __name__ == "__main__":
    main()