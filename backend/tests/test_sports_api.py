#!/usr/bin/env python3
import requests

BASE_URL = "https://www.thesportsdb.com/api/v1/json"
API_KEY = "3"  # Free tier key

print("=" * 60)
print("Testing TheSportsDB API")
print("=" * 60)

# Test 1: Search for a team
print("\n[TEST 1] Searching for 'Arsenal'...")
try:
    url = f"{BASE_URL}/{API_KEY}/searchteams.php"
    r = requests.get(url, params={"t": "Arsenal"}, timeout=10)
    print(f"Status: {r.status_code}")
    print(f"URL: {r.url}")
    data = r.json()
    
    if data.get("teams"):
        team = data["teams"][0]
        print(f"Found: {team.get('strTeam')}")
        print(f"  ID: {team.get('idTeam')}")
        print(f"  Sport: {team.get('strSport')}")
        print(f"  League: {team.get('strLeague')}")
        team_id = team.get("idTeam")
    else:
        print("No teams found!")
        print(f"Response: {data}")
        team_id = None
except Exception as e:
    print(f"Error: {e}")
    team_id = None

# Test 2: Get last events for the team
if team_id:
    print(f"\n[TEST 2] Getting last events for team ID {team_id}...")
    try:
        url = f"{BASE_URL}/{API_KEY}/eventslast.php"
        r = requests.get(url, params={"id": team_id}, timeout=10)
        print(f"Status: {r.status_code}")
        print(f"URL: {r.url}")
        data = r.json()
        
        print(f"Response keys: {data.keys()}")
        
        if data.get("results"):
            print(f"Found {len(data['results'])} events")
            for i, event in enumerate(data["results"][:3]):
                print(f"  {i+1}. {event.get('strEvent')}")
                print(f"      Home: {event.get('intHomeScore')} - Away: {event.get('intAwayScore')}")
        else:
            print("No results found!")
            print(f"Full response: {data}")
    except Exception as e:
        print(f"Error: {e}")

# Test 3: Try alternative endpoint for past events
print(f"\n[TEST 3] Trying eventspastleague endpoint...")
try:
    # Get Premier League events (English Premier League ID is 4328)
    url = f"{BASE_URL}/{API_KEY}/eventspastleague.php"
    r = requests.get(url, params={"id": "4328"}, timeout=10)
    print(f"Status: {r.status_code}")
    data = r.json()
    
    if data.get("events"):
        print(f"Found {len(data['events'])} past events")
        for event in data["events"][:3]:
            print(f"  - {event.get('strEvent')}: {event.get('intHomeScore')}-{event.get('intAwayScore')}")
    else:
        print(f"No events. Response: {data}")
except Exception as e:
    print(f"Error: {e}")

# Test 4: Check what endpoints are available
print(f"\n[TEST 4] Testing lookup endpoint for team details...")
if team_id:
    try:
        url = f"{BASE_URL}/{API_KEY}/lookupteam.php"
        r = requests.get(url, params={"id": team_id}, timeout=10)
        print(f"Status: {r.status_code}")
        data = r.json()
        
        if data.get("teams"):
            team = data["teams"][0]
            print(f"Team: {team.get('strTeam')}")
            print(f"Stadium: {team.get('strStadium')}")
            print(f"Description available: {bool(team.get('strDescriptionEN'))}")
        else:
            print(f"Response: {data}")
    except Exception as e:
        print(f"Error: {e}")

print("\n" + "=" * 60)
print("Testing Complete")
print("=" * 60)