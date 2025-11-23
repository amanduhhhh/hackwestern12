from typing import Dict, Any


MOCK_DATA = {
    "music": {
        "top_songs": [
            {"title": "Blinding Lights", "artist": "The Weeknd", "plays": 342, "duration_ms": 200040, "album": "After Hours"},
            {"title": "Levitating", "artist": "Dua Lipa", "plays": 289, "duration_ms": 203064, "album": "Future Nostalgia"},
            {"title": "Save Your Tears", "artist": "The Weeknd", "plays": 245, "duration_ms": 215627, "album": "After Hours"},
            {"title": "Peaches", "artist": "Justin Bieber", "plays": 198, "duration_ms": 198082, "album": "Justice"},
            {"title": "Kiss Me More", "artist": "Doja Cat", "plays": 176, "duration_ms": 208867, "album": "Planet Her"},
        ],
        "total_minutes": 87234,
        "total_tracks": 1847,
        "top_genres": ["Pop", "Electronic", "Hip-Hop", "R&B", "Indie"],
        "top_artists": [
            {"name": "The Weeknd", "plays": 587, "followers": 52000000},
            {"name": "Dua Lipa", "plays": 423, "followers": 38000000},
            {"name": "Taylor Swift", "plays": 389, "followers": 67000000},
        ],
        "listening_history": [
            {"month": "Jan", "minutes": 6840},
            {"month": "Feb", "minutes": 7230},
            {"month": "Mar", "minutes": 8100},
            {"month": "Apr", "minutes": 6950},
            {"month": "May", "minutes": 7800},
            {"month": "Jun", "minutes": 8200},
        ],
    },
    "travel": {
        "cities": [
            {"name": "Tokyo", "country": "Japan", "days": 7, "photos": 156, "rating": 5, "year": 2023},
            {"name": "Paris", "country": "France", "days": 5, "photos": 89, "rating": 4, "year": 2023},
            {"name": "New York", "country": "USA", "days": 4, "photos": 67, "rating": 4, "year": 2022},
            {"name": "Barcelona", "country": "Spain", "days": 6, "photos": 112, "rating": 5, "year": 2022},
        ],
        "total_countries": 12,
        "total_cities": 18,
        "total_days": 45,
        "total_photos": 892,
        "trips_by_year": [
            {"year": 2022, "trips": 3, "days": 18},
            {"year": 2023, "trips": 4, "days": 27},
        ],
    },
    "fitness": {
        "workouts": 127,
        "total_minutes": 5430,
        "total_calories": 48200,
        "streak_days": 23,
        "by_type": [
            {"type": "Running", "count": 45, "calories": 12300, "avg_duration": 32},
            {"type": "Strength", "count": 50, "calories": 6700, "avg_duration": 45},
            {"type": "Cycling", "count": 22, "calories": 8400, "avg_duration": 55},
            {"type": "Yoga", "count": 10, "calories": 1200, "avg_duration": 30},
        ],
        "weekly_activity": [
            {"day": "Mon", "calories": 450, "minutes": 45},
            {"day": "Tue", "calories": 320, "minutes": 30},
            {"day": "Wed", "calories": 520, "minutes": 55},
            {"day": "Thu", "calories": 280, "minutes": 25},
            {"day": "Fri", "calories": 480, "minutes": 50},
            {"day": "Sat", "calories": 650, "minutes": 70},
            {"day": "Sun", "calories": 200, "minutes": 20},
        ],
        "personal_records": [
            {"activity": "5K Run", "value": "23:45", "date": "2023-09-15"},
            {"activity": "Bench Press", "value": "185 lbs", "date": "2023-11-02"},
            {"activity": "Longest Ride", "value": "42 miles", "date": "2023-08-20"},
        ],
    },
    "reading": {
        "books_read": 52,
        "total_pages": 18420,
        "avg_rating": 4.2,
        "reading_streak": 89,
        "top_books": [
            {"title": "Project Hail Mary", "author": "Andy Weir", "rating": 5, "pages": 496, "genre": "Sci-Fi"},
            {"title": "The Midnight Library", "author": "Matt Haig", "rating": 4, "pages": 304, "genre": "Fiction"},
            {"title": "Atomic Habits", "author": "James Clear", "rating": 5, "pages": 320, "genre": "Self-Help"},
            {"title": "The Song of Achilles", "author": "Madeline Miller", "rating": 4, "pages": 416, "genre": "Fiction"},
        ],
        "by_genre": [
            {"genre": "Fiction", "count": 18, "pages": 6200},
            {"genre": "Sci-Fi", "count": 12, "pages": 4800},
            {"genre": "Self-Help", "count": 8, "pages": 2400},
            {"genre": "Biography", "count": 6, "pages": 2100},
            {"genre": "Fantasy", "count": 8, "pages": 2920},
        ],
        "monthly_pages": [
            {"month": "Jan", "pages": 1200},
            {"month": "Feb", "pages": 980},
            {"month": "Mar", "pages": 1450},
            {"month": "Apr", "pages": 1100},
            {"month": "May", "pages": 1680},
            {"month": "Jun", "pages": 1350},
        ],
    },
    "gaming": {
        "total_hours": 342,
        "games_played": 24,
        "achievements": 156,
        "top_games": [
            {"title": "Elden Ring", "hours": 89, "achievements": 42, "completion": 78},
            {"title": "Baldur's Gate 3", "hours": 67, "achievements": 28, "completion": 45},
            {"title": "Zelda: TotK", "hours": 52, "achievements": 35, "completion": 62},
            {"title": "Hades", "hours": 38, "achievements": 24, "completion": 90},
        ],
        "by_platform": [
            {"platform": "PC", "hours": 198, "games": 14},
            {"platform": "Switch", "hours": 89, "games": 6},
            {"platform": "PS5", "hours": 55, "games": 4},
        ],
        "weekly_playtime": [
            {"week": "W1", "hours": 12},
            {"week": "W2", "hours": 8},
            {"week": "W3", "hours": 15},
            {"week": "W4", "hours": 10},
        ],
    },
    "finance": {
        "total_savings": 12450,
        "monthly_budget": 3200,
        "spending_this_month": 2847,
        "investments_value": 45200,
        "by_category": [
            {"category": "Food & Dining", "amount": 680, "budget": 800, "transactions": 34},
            {"category": "Transportation", "amount": 245, "budget": 300, "transactions": 12},
            {"category": "Entertainment", "amount": 320, "budget": 400, "transactions": 8},
            {"category": "Shopping", "amount": 540, "budget": 500, "transactions": 15},
            {"category": "Utilities", "amount": 180, "budget": 200, "transactions": 5},
        ],
        "monthly_trend": [
            {"month": "Jan", "income": 5200, "expenses": 3100},
            {"month": "Feb", "income": 5200, "expenses": 2900},
            {"month": "Mar", "income": 5400, "expenses": 3400},
            {"month": "Apr", "income": 5200, "expenses": 2800},
            {"month": "May", "income": 5600, "expenses": 3200},
            {"month": "Jun", "income": 5200, "expenses": 2847},
        ],
        "top_merchants": [
            {"name": "Amazon", "amount": 456, "transactions": 12},
            {"name": "Whole Foods", "amount": 380, "transactions": 8},
            {"name": "Netflix", "amount": 45, "transactions": 3},
        ],
        "recent_transactions": [
            {"date": "2024-01-15", "merchant": "Whole Foods", "category": "Food & Dining", "amount": 67.84, "status": "completed"},
            {"date": "2024-01-14", "merchant": "Uber", "category": "Transportation", "amount": 23.50, "status": "completed"},
            {"date": "2024-01-14", "merchant": "Amazon", "category": "Shopping", "amount": 142.99, "status": "completed"},
            {"date": "2024-01-13", "merchant": "Spotify", "category": "Entertainment", "amount": 9.99, "status": "completed"},
            {"date": "2024-01-12", "merchant": "Shell Gas", "category": "Transportation", "amount": 48.20, "status": "completed"},
            {"date": "2024-01-11", "merchant": "Target", "category": "Shopping", "amount": 89.45, "status": "completed"},
            {"date": "2024-01-10", "merchant": "Chipotle", "category": "Food & Dining", "amount": 14.25, "status": "completed"},
            {"date": "2024-01-09", "merchant": "Electric Co", "category": "Utilities", "amount": 95.00, "status": "pending"},
        ],
        "subscriptions": [
            {"service": "Netflix", "amount": 15.99, "billing_date": "1st", "status": "active"},
            {"service": "Spotify", "amount": 9.99, "billing_date": "15th", "status": "active"},
            {"service": "iCloud", "amount": 2.99, "billing_date": "20th", "status": "active"},
            {"service": "Gym", "amount": 49.99, "billing_date": "1st", "status": "active"},
            {"service": "NYTimes", "amount": 4.25, "billing_date": "10th", "status": "paused"},
        ],
    },
    "productivity": {
        "tasks_completed": 847,
        "projects_active": 5,
        "meetings_this_week": 12,
        "focus_hours": 32,
        "tasks": [
            {"title": "Review Q4 metrics", "project": "Analytics", "priority": "high", "due": "2024-01-16", "status": "in_progress"},
            {"title": "Update API docs", "project": "Documentation", "priority": "medium", "due": "2024-01-18", "status": "todo"},
            {"title": "Fix login bug", "project": "Auth Service", "priority": "high", "due": "2024-01-15", "status": "completed"},
            {"title": "Design new dashboard", "project": "Analytics", "priority": "low", "due": "2024-01-25", "status": "todo"},
            {"title": "Team standup prep", "project": "Operations", "priority": "medium", "due": "2024-01-15", "status": "in_progress"},
        ],
        "time_by_project": [
            {"project": "Analytics", "hours": 18, "tasks": 12},
            {"project": "Auth Service", "hours": 8, "tasks": 5},
            {"project": "Documentation", "hours": 6, "tasks": 8},
            {"project": "Operations", "hours": 4, "tasks": 15},
        ],
        "weekly_focus": [
            {"day": "Mon", "deep_work": 4.5, "meetings": 2, "admin": 1.5},
            {"day": "Tue", "deep_work": 5, "meetings": 1.5, "admin": 1.5},
            {"day": "Wed", "deep_work": 3, "meetings": 3.5, "admin": 1.5},
            {"day": "Thu", "deep_work": 6, "meetings": 1, "admin": 1},
            {"day": "Fri", "deep_work": 4, "meetings": 2, "admin": 2},
        ],
    },
}


# Tool registry for agentic data fetching
TOOL_REGISTRY = {
    "get_spotify_stats": {
        "description": "Get user's Spotify listening statistics",
        "parameters": {},
        "returns": {
            "top_songs": "array of {title, artist, plays, duration_ms, album}",
            "total_minutes": "int",
            "top_genres": "array of strings",
            "top_artists": "array of {name, plays, followers}",
            "listening_history": "array of {month, minutes}",
        },
    },
    "get_spotify_top_tracks": {
        "description": "Get user's top tracks with time range filter",
        "parameters": {
            "time_range": "short_term | medium_term | long_term",
            "limit": "int (1-50)",
        },
        "returns": {
            "tracks": "array of {title, artist, plays, duration_ms, album}",
        },
    },
    "get_strava_summary": {
        "description": "Get user's Strava fitness summary",
        "parameters": {},
        "returns": {
            "workouts": "int",
            "total_minutes": "int",
            "total_calories": "int",
            "by_type": "array of {type, count, calories, avg_duration}",
            "personal_records": "array of {activity, value, date}",
        },
    },
    "get_strava_activities": {
        "description": "Get recent Strava activities",
        "parameters": {
            "limit": "int (1-100)",
            "activity_type": "Run | Ride | Swim | Walk | all",
        },
        "returns": {
            "activities": "array of {name, type, distance, duration, calories, date}",
        },
    },
    "get_reading_stats": {
        "description": "Get user's reading statistics from Goodreads",
        "parameters": {},
        "returns": {
            "books_read": "int",
            "total_pages": "int",
            "avg_rating": "float",
            "top_books": "array of {title, author, rating, pages, genre}",
            "by_genre": "array of {genre, count, pages}",
        },
    },
    "get_travel_summary": {
        "description": "Get user's travel history",
        "parameters": {
            "year": "int (optional, filters by year)",
        },
        "returns": {
            "cities": "array of {name, country, days, photos, rating, year}",
            "total_countries": "int",
            "total_days": "int",
        },
    },
    "get_gaming_stats": {
        "description": "Get user's gaming statistics",
        "parameters": {
            "platform": "PC | Switch | PS5 | Xbox | all",
        },
        "returns": {
            "total_hours": "int",
            "games_played": "int",
            "top_games": "array of {title, hours, achievements, completion}",
            "by_platform": "array of {platform, hours, games}",
        },
    },
    "get_finance_summary": {
        "description": "Get user's financial summary",
        "parameters": {
            "month": "string (e.g., '2024-01', optional)",
        },
        "returns": {
            "total_savings": "int",
            "monthly_budget": "int",
            "spending_this_month": "int",
            "by_category": "array of {category, amount, budget, transactions}",
            "monthly_trend": "array of {month, income, expenses}",
        },
    },
    "search_songs": {
        "description": "Search for songs by query",
        "parameters": {
            "query": "string",
            "limit": "int (1-50)",
        },
        "returns": {
            "results": "array of {title, artist, album, duration_ms}",
        },
    },
    "get_weather": {
        "description": "Get current weather for a location",
        "parameters": {
            "city": "string",
        },
        "returns": {
            "temperature": "float",
            "condition": "string",
            "humidity": "int",
            "wind_speed": "float",
        },
    },
}

COMPONENT_SCHEMAS = {
    "List": {
        "description": "Displays a list of items with primary/secondary text",
        "use_when": "Simple items with primary/secondary text (songs, players, books)",
        "data_shape": "array",
        "data": [{"id": "string|number", "title": "string", "subtitle": "string"}],
        "config": {"template": {"primary": "field_name", "secondary": "field_name"}},
    },
    "Card": {
        "description": "Single card with title, description, optional image",
        "use_when": "Single featured item or profile display",
        "data_shape": "object",
        "data": {"title": "string", "description": "string", "image": "url"},
        "config": {"template": {"primary": "field_name", "secondary": "field_name"}},
    },
    "Chart": {
        "description": "Bar chart for numerical data",
        "use_when": "Numerical comparisons and trends (calories by type, performance over time)",
        "data_shape": "array",
        "data": [{"label": "string", "value": "number"}],
        "config": {"template": {"x": "field_name", "y": "field_name"}},
    },
    "Grid": {
        "description": "Side-by-side cards for comparing 2-6 entities",
        "use_when": "Comparing teams, stocks, people. Data MUST be an array, not an object.",
        "data_shape": "array",
        "data": [{"id": "string|number", "title": "string", "subtitle": "string"}],
        "config": {"columns": "number (2-3 for comparisons)", "template": {"title": "field_name", "subtitle": "field_name"}},
    },
    "Timeline": {
        "description": "Vertical timeline of chronological events",
        "use_when": "ONLY for dated/chronological events (activities, workouts). Data MUST be an array.",
        "data_shape": "array",
        "data": [{"id": "string|number", "title": "string", "description": "string", "timestamp": "string"}],
        "config": {"template": {"title": "field_name", "description": "field_name"}},
    },
    "Table": {
        "description": "Tabular data display with rows and columns",
        "use_when": "Data with 3+ comparable columns (transactions, stats). Data MUST be an array of rows.",
        "data_shape": "array",
        "data": [{"column1": "value", "column2": "value"}],
        "config": {"template": {"columns": ["field1", "field2", "field3"]}},
    },
    "Clickable": {
        "description": "Interactive button that triggers an action",
        "use_when": "Any button, CTA, or clickable element that needs interaction handling",
        "data_shape": "string (button label) or not needed",
        "data": "string",
        "config": {"label": "Button text", "class": "Tailwind classes for styling"},
        "note": "ALWAYS use this for buttons, never raw <button> tags. The click-prompt defines what happens when clicked.",
    },
}
