"""
Test Strava API Connection
Run: uv run python test_strava.py
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Import your client
from integrations.strava.client import StravaDataFetcher

# Initialize with your credentials
strava = StravaDataFetcher(
    client_id=os.getenv("STRAVA_CLIENT_ID", ""),
    client_secret=os.getenv("STRAVA_CLIENT_SECRET", ""),
    refresh_token=os.getenv("STRAVA_REFRESH_TOKEN", "")
)

print("=" * 50)
print("Testing Strava API")
print("=" * 50)

# Check auth
print(f"\nAuthenticated: {strava.is_authenticated()}")

# Test 1: Get athlete profile
print("\n--- Athlete Profile ---")
athlete = strava.get_athlete()
if athlete:
    print(f"Name: {athlete['firstname']} {athlete['lastname']}")
    print(f"Location: {athlete['city']}, {athlete['state']}")
    print(f"Premium: {athlete['premium']}")
else:
    print("Failed to fetch athlete")

# Test 2: Get stats
if athlete:
    print("\n--- Athlete Stats ---")
    stats = strava.get_athlete_stats(athlete['id'])
    if stats:
        print(f"All-time runs: {stats['all_run_totals']['count']} ({stats['all_run_totals']['distance_miles']} miles)")
        print(f"All-time rides: {stats['all_ride_totals']['count']} ({stats['all_ride_totals']['distance_miles']} miles)")
        print(f"YTD runs: {stats['ytd_run_totals']['count']} ({stats['ytd_run_totals']['distance_miles']} miles)")
    else:
        print("Failed to fetch stats")

# Test 3: Get recent activities
print("\n--- Recent Activities ---")
activities = strava.get_activities(limit=5)
if activities:
    for a in activities:
        print(f"- {a['name']} ({a['type']}): {a['distance_miles']} mi, {a['moving_time_minutes']} min")
else:
    print("Failed to fetch activities (or no activities)")

# Test 4: Full summary
print("\n--- Full Summary ---")
summary = strava.fetch_user_summary()
if summary:
    print(f"Athlete: {summary['athlete']['firstname']}")
    print(f"Recent activities: {len(summary['recent_activities'])}")
    print(f"Last updated: {summary['last_updated']}")
else:
    print("Failed to fetch summary")

print("\n" + "=" * 50)
print("Done!")
print("=" * 50)