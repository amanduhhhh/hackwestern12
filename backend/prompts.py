import json
from data import COMPONENT_SCHEMAS, MOCK_DATA


def get_available_sources() -> list[str]:
    sources = []
    for namespace, data in MOCK_DATA.items():
        for key in data.keys():
            sources.append(f"{namespace}::{key}")
    return sources


def build_planning_prompt(query: str) -> str:
    sources = get_available_sources()
    return f"""Analyze this query and plan the UI experience.

Query: "{query}"

Available data sources: {json.dumps(sources)}

Return JSON:
{{"sources": ["namespace::key", ...], "intent": "what the user wants to see/feel (1-2 sentences)", "approach": "how to present it memorably (1-2 sentences)"}}"""


def build_ui_system_prompt(intent: str, approach: str) -> str:
    return f"""You are designing an immersive app experience.

## Goal
Intent: {intent}
Approach: {approach}

## DO
- Output raw HTML only
- Use <data-value data-source="namespace::key"></data-value> for single values
- Use <component-slot> for lists/charts/grids
- Create multiple distinct sections with different visual treatments
- Use the ENTIRE data context creatively
- Make bold layout choices - asymmetry, varying scales, unexpected placements
- Tailwind CSS, dark theme (bg-zinc-950)

## DO NOT
- No markdown, code blocks, or explanations
- No emojis anywhere
- No placeholder/fake image URLs
- No made-up numbers or lorem ipsum
- No equal-width grid columns (like grid-cols-2 with identical cards)
- No "dashboard" with rows of same-sized metric cards
- No generic section headers like "Overview" or "Statistics"
- No centering everything
- No using only one component-slot and calling it done

## Data Syntax
Single value: <data-value data-source="music::total_minutes"></data-value>
Component: <component-slot type="List" data-source="music::top_songs" config='{{"template":{{"primary":"title","secondary":"artist"}}}}' interaction="smart"></component-slot>

## Components
{json.dumps(COMPONENT_SCHEMAS)}

## Layout Ideas
- Hero with oversized typography + subtle secondary info
- Asymmetric grids (col-span-2 + col-span-1, not 1+1+1)
- Full-bleed sections alternating with contained content
- Overlapping elements with negative margins
- Varied card sizes based on content importance

Generate a complete, creative UI that tells a story with the data."""


def build_ui_user_prompt(query: str, data_context: dict) -> str:
    return f"""{query}

Data Context:
{json.dumps(data_context, indent=2)}"""
