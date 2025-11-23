import json
from typing import Any
from data import COMPONENT_SCHEMAS, MOCK_DATA


def describe_data(data_context: dict) -> str:
    """
    Generate a natural language description of the data schema for the LLM.
    Shows the exact data-source strings to use and the structure of each.
    """
    lines = []

    for namespace, data in data_context.items():
        lines.append(f"{namespace}:")

        for key, value in data.items():
            source = f"{namespace}::{key}"

            if isinstance(value, list):
                if len(value) > 0:
                    sample = value[0]
                    if isinstance(sample, dict):
                        # Show field names with their types
                        field_types = [f"{k}: {type(v).__name__}" for k, v in sample.items()]
                        lines.append(f"  {source} (array of {len(value)}) - {{{', '.join(field_types)}}}")
                        # Show first item as example
                        items = [f"{k}={repr(v)[:25]}" for k, v in list(sample.items())[:4]]
                        lines.append(f"    [0]: {{{', '.join(items)}}}")
                    else:
                        lines.append(f"  {source} (array of {len(value)} {type(sample).__name__}s)")
                        lines.append(f"    [0]: {repr(value[0])[:50]}")
                else:
                    lines.append(f"  {source} (empty array)")

            elif isinstance(value, dict):
                field_types = [f"{k}: {type(v).__name__}" for k, v in value.items()]
                lines.append(f"  {source} (object) - {{{', '.join(field_types)}}}")
                items = [f"{k}={repr(v)[:25]}" for k, v in list(value.items())[:4]]
                lines.append(f"    example: {{{', '.join(items)}}}")

            else:
                lines.append(f"  {source} ({type(value).__name__}) = {repr(value)}")

        lines.append("")

    return "\n".join(lines)


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
    return f"""You generate HTML for a mobile-first app screen that feels alive and engaging. Output raw HTML only - no markdown, no code fences.

## Vision
Intent: {intent}
Approach: {approach}

## Design Philosophy

Think iOS/Android native apps, not web dashboards. Every screen should feel like opening a premium mobile app:
- Smooth, fluid interactions
- Subtle motion and feedback
- Bold typography that breathes
- Content that draws you in

## How Data Binding Works

The frontend has a component registry that renders data. You place containers; the system fills them.

### Single Values: data-value
For numbers, strings, or single fields. The element's textContent gets replaced with the actual value.

```html
<p class="text-8xl font-black text-white">
  <data-value data-source="music::total_minutes"></data-value>
</p>
<p class="text-zinc-400">
  <data-value data-source="fitness::workouts"></data-value> workouts completed
</p>
```

### Arrays/Objects: component-slot
For lists, charts, grids. The registry looks up the component type and renders with the data.

```html
<!-- List: map array fields to display template -->
<component-slot
  type="List"
  data-source="music::top_songs"
  config='{{"template":{{"primary":"title","secondary":"artist"}}}}'
  click-prompt="Dive into this track - show play history, audio features, and similar songs"
></component-slot>

<!-- Chart: numerical data visualization -->
<component-slot
  type="Chart"
  data-source="fitness::by_type"
  config='{{"template":{{"x":"type","y":"calories"}}}}'
  click-prompt="Break down this workout type - show trends over time and personal records"
></component-slot>

<!-- Grid: image grid with columns -->
<component-slot
  type="Grid"
  data-source="travel::cities"
  config='{{"template":{{"title":"name","subtitle":"country"}},"columns":3}}'
  click-prompt="Explore this destination - show trip details, photos, and recommendations"
></component-slot>

<!-- Timeline: ONLY for chronological/dated events like activities, workouts, history -->
<component-slot
  type="Timeline"
  data-source="fitness::recent_activities"
  config='{{"template":{{"title":"name","description":"date"}}}}'
  click-prompt="Show workout details - distance, pace, and heart rate data"
></component-slot>

<!-- Card: single object display (no click-prompt = not interactive) -->
<component-slot
  type="Card"
  data-source="user::profile"
  config='{{"template":{{"primary":"name","secondary":"bio"}}}}'
></component-slot>

<!-- Table: tabular data with multiple columns -->
<component-slot
  type="Table"
  data-source="finance::recent_transactions"
  config='{{"template":{{"columns":["date","merchant","category","amount","status"]}}}}'
  click-prompt="Show transaction details and related spending patterns"
></component-slot>
```

The `config.template` maps the component's display fields to your data's field names. Check the data fields in the context to know what to map.

For interactive elements, add `click-prompt` describing what happens when clicked. Write from user perspective ("Show me...", "Dive into...", "Break down..."). Omit for non-interactive elements.

Check each component's `use_when` field in the registry below to pick the right component for your data.

## Component Registry

{json.dumps(COMPONENT_SCHEMAS, indent=2)}

## Golden Rule: NO SYNTHETIC DATA

Never write literal values. If you write "87,234" or "Blinding Lights", you've broken the binding.

Wrong: `<p>87,234 minutes</p>`
Right: `<p><data-value data-source="music::total_minutes"></data-value> minutes</p>`

Wrong: `<span>Blinding Lights by The Weeknd</span>`
Right: Use a List component-slot with the array data-source

## Visual Language: Make It Alive

### Typography & Hierarchy
- Hero numbers: text-7xl to text-9xl font-black (make them impossible to ignore)
- Supporting text: text-xs uppercase tracking-widest text-zinc-500
- Scale contrast is everything - tiny labels next to massive numbers

### Animation & Motion (Tailwind)
Add life with subtle animations:
- hover:scale-[1.02] transition-transform duration-200 (cards that breathe)
- hover:bg-zinc-800 transition-colors (responsive feedback)
- hover:translate-x-1 (list items that nudge)
- animate-pulse on accent elements (subtle attention)
- group-hover:opacity-100 for reveal effects

### Color & Energy
- Dark canvas: bg-zinc-950 (true black feel)
- Accent gradients: bg-gradient-to-br from-violet-500 to-fuchsia-500
- Glows: shadow-lg shadow-violet-500/20 (depth and warmth)
- Semi-transparent accents: bg-emerald-500/10 border-emerald-500/30
- One vibrant accent per screen (violet, emerald, amber, rose, cyan)

### Containers & Depth
- Cards: bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/50
- Hover states: hover:border-zinc-700 hover:bg-zinc-800/80
- Subtle shadows: shadow-xl shadow-black/20
- Sharp edges: rounded or rounded-sm only

### Layout: Mobile-App Feel
- Full-bleed hero sections (no padding on top element)
- Generous vertical rhythm (space-y-6, mb-10)
- Asymmetric grids: col-span-2 next to col-span-1
- Bottom-anchored CTAs (fixed bottom-0 or mt-auto)
- Pull-to-refresh style top spacing

### Micro-interactions
Every interactive element should respond:
```html
<div class="group cursor-pointer bg-zinc-900 p-4 rounded transition-all duration-200 hover:bg-zinc-800 hover:scale-[1.01] active:scale-[0.99]">
  <p class="text-white group-hover:text-violet-300 transition-colors">...</p>
</div>
```

## What to Avoid

- Dashboard/SaaS aesthetic (boring grids, "Overview" headers)
- Static, lifeless cards with no hover states
- Equal spacing everywhere
- Centered everything
- Small, timid typography
- "Statistics", "Metrics", "Data" labels
- Filling every pixel - let it breathe

## Requirements

Must:
1. Start with `<div class="...">` - no html/head/body
2. Tailwind CSS only
3. Use ALL data sources from context
4. Multiple component-slots (3-4+)
5. Animation/transition classes on interactive elements
6. At least one bold accent color with glow/gradient

Must NOT:
- Write literal data values
- Use placeholder text
- Use image URLs
- Use emojis
- Invent data sources
- Create static, hover-less layouts

## Full Example

```html
<div class="min-h-screen bg-zinc-950 p-6">
  <!-- Hero stat with presence -->
  <div class="mb-12">
    <p class="text-xs uppercase tracking-widest text-zinc-600 mb-2">This Year</p>
    <p class="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 leading-none">
      <data-value data-source="music::total_minutes"></data-value>
    </p>
    <p class="text-lg text-zinc-500 mt-1">minutes of music</p>
  </div>

  <!-- Asymmetric grid with depth -->
  <div class="grid grid-cols-3 gap-4 mb-8">
    <div class="col-span-2 bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/50 p-5 rounded transition-all duration-200 hover:border-zinc-700 hover:shadow-xl hover:shadow-black/20">
      <p class="text-xs uppercase tracking-widest text-zinc-500 mb-4">Top Tracks</p>
      <component-slot
        type="List"
        data-source="music::top_songs"
        config='{{"template":{{"primary":"title","secondary":"artist"}}}}'
        click-prompt="Dive into this track - show play history and similar songs"
      ></component-slot>
    </div>

    <div class="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/30 p-5 rounded shadow-lg shadow-violet-500/10 transition-all duration-200 hover:shadow-violet-500/20 hover:border-violet-500/50">
      <p class="text-xs uppercase tracking-widest text-violet-400 mb-4">Activity</p>
      <component-slot
        type="Chart"
        data-source="fitness::by_type"
        config='{{"template":{{"x":"type","y":"calories"}}}}'
        click-prompt="Break down this workout - show trends and records"
      ></component-slot>
    </div>
  </div>

  <!-- Interactive list with motion -->
  <div class="space-y-2">
    <component-slot
      type="Timeline"
      data-source="reading::top_books"
      config='{{"template":{{"title":"title","description":"author"}}}}'
      click-prompt="Show book details - progress and highlights"
    ></component-slot>
  </div>
</div>
```

Output raw HTML now."""


def build_ui_user_prompt(query: str, data_context: dict) -> str:
    data_description = describe_data(data_context)

    return f"""Query: {query}

Data Available:
{data_description}

Use data-source="namespace::key" to reference this data. The components will render the actual values - you never write them yourself.

Generate the HTML now."""
