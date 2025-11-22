from typing import Dict, Any


MOCK_DATA = {
    "music": {
        "top_songs": [
            {"title": "Blinding Lights", "artist": "The Weeknd", "plays": 342},
            {"title": "Levitating", "artist": "Dua Lipa", "plays": 289},
        ],
        "total_minutes": 87234,
        "top_genres": ["Pop", "Electronic", "Hip-Hop"],
    },
    "travel": {
        "cities": [
            {"name": "Tokyo", "country": "Japan", "days": 7, "photos": 156},
            {"name": "Paris", "country": "France", "days": 5, "photos": 89},
        ],
        "total_countries": 8,
    },
    "fitness": {
        "workouts": 127,
        "total_minutes": 5430,
        "by_type": [
            {"type": "Running", "count": 45, "calories": 12300},
            {"type": "Strength", "count": 50, "calories": 6700},
        ],
    },
    "reading": {
        "books_read": 52,
        "total_pages": 18420,
        "top_books": [
            {"title": "Project Hail Mary", "author": "Andy Weir", "rating": 5},
            {"title": "The Midnight Library", "author": "Matt Haig", "rating": 4},
        ],
    },
}

COMPONENT_SCHEMAS = {
    "List": {
        "description": "Displays a list of items with primary/secondary text",
        "data": [{"id": "string|number", "title": "string", "subtitle": "string"}],
        "config": {"template": {"primary": "field_name", "secondary": "field_name"}},
    },
    "Card": {
        "description": "Single card with title, description, optional image",
        "data": {"title": "string", "description": "string", "image": "url"},
        "config": {},
    },
    "Chart": {
        "description": "Bar chart for numerical data",
        "data": [{"label": "string", "value": "number"}],
        "config": {},
    },
    "Grid": {
        "description": "Grid of items with images",
        "data": [{"id": "string|number", "title": "string", "image": "url"}],
        "config": {"columns": "number (default 3)"},
    },
    "Timeline": {
        "description": "Vertical timeline of events",
        "data": [
            {
                "id": "string|number",
                "title": "string",
                "description": "string",
                "timestamp": "string",
            }
        ],
        "config": {},
    },
}
