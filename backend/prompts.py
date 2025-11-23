import json
from typing import Any
from data import COMPONENT_SCHEMAS, MOCK_DATA


def describe_data(data_context: dict) -> str:
    """
    Generate a natural language description of the data schema for the LLM.
    Shows the exact data-source strings to use and the structure of each.
    """
    lines = []

    def describe_type(v: Any) -> str:
        """Get a descriptive type string, including nested array contents."""
        if isinstance(v, list):
            if len(v) > 0 and isinstance(v[0], dict):
                nested_fields = list(v[0].keys())[:6]
                return f"array[{{{', '.join(nested_fields)}}}]"
            elif len(v) > 0:
                return f"array[{type(v[0]).__name__}]"
            return "array"
        return type(v).__name__

    for namespace, data in data_context.items():
        lines.append(f"{namespace}:")

        for key, value in data.items():
            source = f"{namespace}::{key}"

            if isinstance(value, list):
                if len(value) > 0:
                    sample = value[0]
                    if isinstance(sample, dict):
                        # Show field names with their types (including nested arrays)
                        field_types = [f"{k}: {describe_type(v)}" for k, v in sample.items()]
                        lines.append(f"  {source} (array of {len(value)}) - {{{', '.join(field_types)}}}")
                        # Show first item as example with more fields
                        items = [f"{k}={repr(v)[:30]}" for k, v in list(sample.items())[:8]]
                        lines.append(f"    [0]: {{{', '.join(items)}}}")

                        # If there's a nested array, describe its contents
                        for field_name, field_value in sample.items():
                            if isinstance(field_value, list) and len(field_value) > 0 and isinstance(field_value[0], dict):
                                nested_fields = [f"{k}: {type(v).__name__}" for k, v in field_value[0].items()]
                                nested_example = [f"{k}={repr(v)[:25]}" for k, v in list(field_value[0].items())[:6]]
                                lines.append(f"      {field_name}[0]: {{{', '.join(nested_example)}}}")
                    else:
                        lines.append(f"  {source} (array of {len(value)} {type(sample).__name__}s)")
                        lines.append(f"    [0]: {repr(value[0])[:50]}")
                else:
                    lines.append(f"  {source} (empty array)")

            elif isinstance(value, dict):
                field_types = [f"{k}: {describe_type(v)}" for k, v in value.items()]
                lines.append(f"  {source} (object) - {{{', '.join(field_types)}}}")
                items = [f"{k}={repr(v)[:30]}" for k, v in list(value.items())[:6]]
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


def get_component_rules() -> str:
    """Shared component rules for all UI generation endpoints"""
    return f"""## How Data Binding Works

The frontend has a component registry that renders data. You place containers; the system fills them.

### Data Source Format
Data sources use the format `namespace::path` where path can include array indices and property access.

**VALID examples:**
- `sports::teams` - references the teams array
- `sports::teams[0].schedule` - first team's schedule array
- `sports::teams[0].wins` - first team's wins value
- `music::top_songs` - references top_songs array
- `music::total_minutes` - references a single value

Use array indexing `[0]` and dot notation `.field` to access nested data.

### Single Values: data-value
For **ONLY** primitive values (numbers, strings, booleans). The element's textContent gets replaced with the actual value.

**CRITICAL RULES:**
- data-value is ONLY for single primitive values (numbers, strings, booleans)
- NEVER use non-existent attributes like data-transform, data-format, etc.
- **Fallback behavior**: If you accidentally use data-value with an array, it will display the array length (not ideal, but won't break)
- **Prefer explicit counts**: If the backend provides a count field (like `total_songs: 10`), use that instead

```html
<p class="text-8xl font-black text-white">
  <data-value data-source="music::total_minutes"></data-value>
</p>
<p class="text-zinc-400">
  <data-value data-source="fitness::workouts"></data-value> workouts completed
</p>
```

Fallback example (if music::top_songs is an array, this shows its length):
```html
<p><data-value data-source="music::top_songs"></data-value> songs</p>
```

### Arrays/Objects: component-slot
For lists, charts, grids, tables. The registry looks up the component type and renders with the data.

List example (map array fields to display template):
```html
<component-slot
  type="List"
  data-source="music::top_songs"
  config='{{"template":{{"primary":"title","secondary":"artist"}}}}'
  click-prompt="Dive into this track - show play history, audio features, and similar songs"
></component-slot>
```

Chart example (ONLY for arrays of objects with numeric fields):
```html
<component-slot
  type="Chart"
  data-source="fitness::by_type"
  config='{{"template":{{"x":"type","y":"calories"}}}}'
  click-prompt="Break down this workout type - show trends over time and personal records"
></component-slot>
```

Grid example (side-by-side comparisons):
```html
<component-slot
  type="Grid"
  data-source="sports::teams"
  config='{{"template":{{"title":"name","subtitle":"wins"}},"columns":2}}'
  click-prompt="Show detailed team stats and schedule"
></component-slot>
```

Timeline example (ONLY for chronological/dated events):
```html
<component-slot
  type="Timeline"
  data-source="fitness::recent_activities"
  config='{{"template":{{"title":"name","description":"date"}}}}'
  click-prompt="Show workout details - distance, pace, and heart rate data"
></component-slot>
```

Table example (tabular data with multiple columns):
```html
<component-slot
  type="Table"
  data-source="finance::recent_transactions"
  config='{{"template":{{"columns":["date","merchant","category","amount","status"]}}}}'
  click-prompt="Show transaction details and related spending patterns"
></component-slot>
```

Clickable example (interactive buttons - ALWAYS use this, never raw button tags):
```html
<component-slot
  type="Clickable"
  config='{{"label":"View Details","class":"px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"}}'
  click-prompt="Show detailed breakdown of this metric"
></component-slot>
```

The `config.template` maps the component's display fields to your data's field names. Check the data fields in the context to know what to map.

For interactive elements, add `click-prompt` describing what happens when clicked. Write from user perspective ("Show me...", "Dive into...", "Break down..."). Omit for non-interactive elements.

**CRITICAL: For buttons/CTAs**, ALWAYS use the Clickable component. NEVER use raw `<button>` tags.

## Component Registry

{json.dumps(COMPONENT_SCHEMAS, indent=2)}

## Golden Rule: NO SYNTHETIC DATA

Never write literal values. If you write "87,234" or "Blinding Lights", you've broken the binding.

Wrong: `<p>87,234 minutes</p>`
Right: `<p><data-value data-source="music::total_minutes"></data-value> minutes</p>`

Wrong: `<span>Blinding Lights by The Weeknd</span>`
Right: Use a List component-slot with the array data-source

Wrong: `<data-value data-source="music::top_artists" data-transform="length"></data-value>`
Right: `<data-value data-source="music::top_artists"></data-value>` (will fallback to showing length)
Better: Backend provides explicit count like `music::artist_count`

## Chart Component: Critical Rules

**Chart ONLY works with arrays of objects that have NUMERIC fields.**

✅ CORRECT Chart usage (data is array of objects with numeric fields):
```html
<component-slot type="Chart" data-source="fitness::by_type" 
  config='{{"template":{{"x":"type","y":"calories"}}}}'></component-slot>
```
Example data: `[{{"type": "Running", "calories": 12300}}, {{"type": "Cycling", "calories": 8400}}]`

❌ WRONG Chart usage (data is simple string array):
```html
<component-slot type="Chart" data-source="music::top_genres" 
  config='{{"template":{{"x":"genre","y":"percentage"}}}}'></component-slot>
```
Example data: `["Pop", "Electronic", "Hip-Hop"]` - No "genre" or "percentage" fields!
This will FAIL because the data doesn't have the fields you're trying to map.

**If you have a simple array (strings, numbers, or simple objects), use List or Table instead.**

## Style Rules

- NEVER use fixed positioning (fixed) - layouts must be in flow
- NEVER use HTML comments in your output (no `<!-- comment -->`)
- Use only Tailwind utility classes
- Dark theme: bg-zinc-950, text-white
- Sharp edges: rounded or rounded-sm only (never rounded-xl/2xl/3xl)"""


def build_planning_prompt(query: str) -> str:
    sources = get_available_sources()
    return f"""Analyze this query and plan the UI experience.

Query: "{query}"

Available data sources: {json.dumps(sources)}

Return JSON:
{{"sources": ["namespace::key", ...], "intent": "what the user wants to see/feel (1-2 sentences)", "approach": "how to present it memorably (1-2 sentences)"}}"""


def build_ui_system_prompt(intent: str, approach: str) -> str:
    return f"""You generate HTML for a mobile-first app screen that feels alive and engaging.

IMPORTANT: Output ONLY raw HTML. No markdown. No code fences. No ```html. Just the HTML starting with <div>.

## Vision
Intent: {intent}
Approach: {approach}

## Design Philosophy

Imagine you're designing a real app for this exact use case. What would Spotify Wrapped look like? What would a fantasy sports app look like? What would Robinhood's portfolio view look like?

Design like you're building a REAL product. Not a demo. Not a prototype. A shipped app that millions use.

GO ABSOLUTELY WILD. Be creative. Be degen. Make it memorable.

This is NOT a boring dashboard. This is an experience. Think:
- Dramatic visual hierarchy that slaps
- Unexpected layouts that surprise
- Bold color choices that pop
- Typography that makes a statement
- Animations and hover states everywhere
- The kind of UI that makes people screenshot and share

The ONLY rule: Don't make up data. Everything else is fair game.

## CRITICAL: Thematic Design

Make the UI feel like it LIVES in its domain. Don't just display data - create a vibe:

- **Sports/Basketball**: Scoreboard energy, locker room aesthetics, stadium lights, crowd roar vibes. Make it feel like courtside seats.
- **Music/Spotify**: Album art grids, vinyl spinning vibes, concert poster energy, equalizer aesthetics, late night listening mood
- **Stocks/Finance**: Bloomberg terminal on steroids, ticker tape chaos, green candles to the moon, trading floor energy
- **Fitness/Strava**: Race bib aesthetics, finish line energy, sweat and glory vibes, personal records that hit different
- **Gaming/Clash**: Legendary card reveals, arena battle energy, trophy case flex, clash royale chest opening vibes

A music screen should make you want to put on headphones. A sports screen should make you want to yell at the TV. A stocks screen should make you feel like a degen trader.

{get_component_rules()}

## Visual Language: Make It Alive

### Icons & Graphics
- NO emojis (they look unprofessional)
- YES to inline SVG icons (if you're confident in the syntax)
- Simple geometric shapes can add visual interest
- Use SVGs for arrows, check marks, stars, etc.

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
- Use emojis (but inline SVG icons are encouraged if you're confident!)
- Invent data sources
- Create static, hover-less layouts
- Use HTML comments (no `<!-- -->` in output)
- Use fixed or absolute positioning

## Full Example

```html
<div class="min-h-screen bg-zinc-950 p-6">
  <div class="mb-12">
    <p class="text-xs uppercase tracking-widest text-zinc-600 mb-2">This Year</p>
    <p class="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 leading-none">
      <data-value data-source="music::total_minutes"></data-value>
    </p>
    <p class="text-lg text-zinc-500 mt-1">minutes of music</p>
  </div>

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


def build_refine_system_prompt(current_html: str) -> str:
    """System prompt for refining existing UI"""
    return f"""You're editing a live app screen. Make the requested changes while preserving data bindings.

IMPORTANT: Output ONLY raw HTML. No markdown. No code fences. No ```html. Just the HTML starting with <div>.

## Current Screen
{current_html}

{get_component_rules()}

## Visual Language: Make It Alive

### Icons & Graphics
- NO emojis (they look unprofessional)
- YES to inline SVG icons (if you're confident in the syntax)
- Simple geometric shapes can add visual interest
- Use SVGs for arrows, check marks, stars, etc.

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

## Edit Rules
- Output raw HTML only (no markdown, code fences)
- Preserve all data-source bindings - move them, don't delete them
- Same data sources - never invent new ones
- Sharp edges only (rounded-sm or rounded, never rounded-xl/2xl/3xl)
- Dark theme: bg-zinc-900/950, text-white/zinc-100

## What to Change
Respond to the user's edit request:
- Layout: rearrange, resize, change grid structure
- Style: colors, spacing, typography, accents
- Emphasis: scale up/down, reposition
- Flow: reorder the narrative, change the "hook"

## What to Keep
- All data-value and component-slot elements
- Data bindings intact (namespace::key references)
- The emotional intent unless explicitly changing it

Think: tweaking a shipped app, not rebuilding."""


def build_interact_system_prompt(clicked_item_desc: str, click_prompt: str, component_type: str) -> str:
    """System prompt for drill-down interaction views"""
    return f"""You're generating a drill-down detail view based on user interaction.

IMPORTANT: Output ONLY raw HTML. No markdown. No code fences. No ```html. Just the HTML starting with <div>.

## Interaction Context
The user clicked on a {component_type} component.
Instruction: {click_prompt}

## Clicked Item
{clicked_item_desc}

## Design Philosophy
Imagine you're designing the detail view of a real app. What does Spotify show when you tap on a song? What does ESPN show when you tap on a player? What does Robinhood show when you tap on a stock?

Design like you're building a REAL product that millions use.

GO WILD with this detail view. Make it the hyperfocus moment. The user clicked because they want MORE - give them an experience that makes them glad they clicked.

The ONLY rule: Don't make up data. Everything else is fair game.

## CRITICAL: Thematic Design
Make this detail view absolutely slap:
- Sports: Player card energy, stats that hit different, team pride vibes
- Music: Album deep dive, artist spotlight, listening session mood
- Stocks: Full degen trading view, candlestick chaos, position analysis energy
- Fitness: Race recap vibes, PR celebration, segment analysis heat
- Gaming: Legendary card showcase, battle replay energy, trophy flex

{get_component_rules()}

## Visual Language: Make It Alive

### Icons & Graphics
- NO emojis (they look unprofessional)
- YES to inline SVG icons (if you're confident in the syntax)
- Simple geometric shapes can add visual interest
- Use SVGs for arrows, check marks, stars, etc.

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

## Available Data
The data context includes:
- Original parent data (from the previous view)
- New detailed data (fetched for this drill-down)
- clicked_item:: namespace for the specific item clicked

Generate a compelling detail view now."""
