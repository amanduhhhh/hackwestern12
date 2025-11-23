# AI Generation Flow

## Architecture

Two main endpoints:
- **`/api/generate`** - Main UI generation (uses mock data for now)
- **`/api/query`** - Agent with tool calling for dynamic data fetching

The goal is to merge these: `/api/generate` will use the agent approach internally.

---

## Pipeline Stages

```
User Query → Planning → Agent Data Fetch → Description → UI Generation → Streaming → Hydration
```

---

### Stage 1: Planning

**Input**: User query string
```
"Show me my music listening stats"
```

**Output**: JSON with sources, intent, approach
```json
{
  "sources": ["music::top_songs", "music::total_minutes", "music::top_genres"],
  "intent": "User wants to see their music listening patterns and favorites",
  "approach": "Hero stat for total time, list of top songs, genre breakdown"
}
```

**What happens**: Small LLM call (~300 tokens) that classifies what data is needed and how to present it.

---

### Stage 2: Agent Data Fetch

**Current (Mock)**:
```python
data_context = get_data(plan["sources"], MOCK_DATA)
```

**Future (Agent with Tools)**:

The `/api/query` endpoint demonstrates how this will work:

```python
# LLM decides which tools to call based on user query
response = completion(
    model="gpt-4.1-mini",
    messages=[...],
    tools=tools,  # Generated from fetchers via @tool_function decorators
    tool_choice="auto"  # LLM decides, can call multiple in parallel
)

# Execute tool calls
for tool_call in response.tool_calls:
    function_name = tool_call.function.name  # e.g., "spotify_fetch_user_data"
    function_args = json.loads(tool_call.function.arguments)
    result = available_functions[function_name](**function_args)
    data[function_name] = result
```

**Available Tools** (generated from fetchers):
- `spotify_fetch_user_data` - Top songs, artists, genres, listening time
- `stocks_fetch_stock_info` - Stock price and company info
- `stocks_fetch_portfolio_data` - Multiple stock performance
- `strava_fetch_user_summary` - Workout stats
- `strava_get_activities` - Recent activities
- `sports_fetch_user_sports_summary` - Team stats
- `clash_fetch_user_summary` - Game stats

**Tool Definition** (with `@tool_function` decorator):
```python
@tool_function(
    description="Get real-time stock price, volume, and company info for a ticker symbol",
    params={
        "symbol": {
            "type": "string",
            "description": "Stock ticker symbol (e.g., AAPL, TSLA, GOOGL)"
        }
    }
)
def fetch_stock_info(self, symbol: str):
    ...
```

---

### Stage 3: Data Description

**Input**: Data context object

**Output**: Natural language schema for LLM
```
music:
  music::top_songs (array of 2) - {title: str, artist: str, plays: int}
    [0]: {title='Blinding Lights', artist='The Weeknd', plays=342}
  music::total_minutes (int) = 87234
  music::top_genres (array of 3 strs)
    [0]: 'Pop'
```

**What happens**: `describe_data()` converts JSON to readable format showing exact data-source strings, field types, and examples.

#### Example Mappings for `describe_data()`

**Example 1: Music data**
```python
# Input
{
    "music": {
        "top_songs": [
            {"title": "Blinding Lights", "artist": "The Weeknd", "plays": 342}
        ],
        "total_minutes": 87234,
        "top_genres": ["Pop", "Electronic"]
    }
}

# Output
music:
  music::top_songs (array of 1) - {title: str, artist: str, plays: int}
    [0]: {title='Blinding Lights', artist='The Weeknd', plays=342}
  music::total_minutes (int) = 87234
  music::top_genres (array of 2 strs)
    [0]: 'Pop'
```

**Example 2: Fitness data**
```python
# Input
{
    "fitness": {
        "workouts": 127,
        "by_type": [
            {"type": "Running", "count": 45, "calories": 12300}
        ]
    }
}

# Output
fitness:
  fitness::workouts (int) = 127
  fitness::by_type (array of 1) - {type: str, count: int, calories: int}
    [0]: {type='Running', count=45, calories=12300}
```

**Example 3: User profile object**
```python
# Input
{
    "user": {
        "profile": {"name": "John Doe", "bio": "Music lover"}
    }
}

# Output
user:
  user::profile (object) - {name: str, bio: str}
    example: {name='John Doe', bio='Music lover'}
```

---

### Stage 4: UI Generation

**Input**: System prompt + user prompt with data description

System prompt contains:
- How data binding works (data-value, component-slot syntax)
- Component registry (List, Chart, Grid, Timeline, Card)
- Template mapping examples
- Visual language rules
- Golden rule: no synthetic data

User prompt contains:
- Original query
- Data description from Stage 3

**Output**: Raw HTML with data bindings
```html
<div class="min-h-screen bg-zinc-950 p-6">
  <div class="mb-10">
    <p class="text-xs text-zinc-600">This Year</p>
    <p class="text-8xl font-black text-white">
      <data-value data-source="music::total_minutes"></data-value>
    </p>
    <p class="text-zinc-500">minutes listening</p>
  </div>

  <div class="bg-zinc-900 border border-zinc-800 p-4">
    <component-slot
      type="List"
      data-source="music::top_songs"
      config='{"template":{"primary":"title","secondary":"artist"}}'
      interaction="smart"
    ></component-slot>
  </div>
</div>
```

**What happens**: LLM generates ~2000 tokens of HTML, streaming. It places containers (data-value, component-slot) but never writes actual data values.

---

### Stage 5: SSE Streaming

**Events sent to frontend**:

1. `data` event (once, first):
```
event: data
data: {"music": {"top_songs": [...], "total_minutes": 87234}}
```

2. `status` events (optional, for progress):
```
event: status
data: {"message": "Planning UI..."}

event: status
data: {"message": "Fetching Spotify data..."}
```

3. `ui` events (many, streaming):
```
event: ui
data: {"content": "<div class=\"min-h-screen"}

event: ui
data: {"content": " bg-zinc-950 p-6\">"}
```

4. `error` event (on failure):
```
event: error
data: {"message": "Failed to fetch data"}
```

5. `done` event (once, last):
```
event: done
data: {}
```

**What happens**: Backend streams as LLM generates. Frontend accumulates HTML chunks and shows status as toasts.

---

### Stage 6: Frontend Hydration

**Input**:
- Data context (from `data` event)
- Accumulated HTML (from `ui` events)

**What happens**:

1. **Sanitize**: DOMPurify allows `<component-slot>` and `<data-value>` tags
2. **Diff**: morphdom patches DOM, preserving existing React roots
3. **Resolve data-values**:
   ```javascript
   // Find: <data-value data-source="music::total_minutes"></data-value>
   // Look up: dataContext["music"]["total_minutes"] = 87234
   // Set: element.textContent = "87234"
   ```
4. **Mount components**:
   ```javascript
   // Find: <component-slot type="List" data-source="music::top_songs" ...>
   // Look up: COMPONENT_REGISTRY["List"] → ListComponent
   // Resolve: dataContext["music"]["top_songs"] → array
   // Mount: createRoot(wrapper).render(<ListComponent data={array} config={...} />)
   ```

**Component Registry** (`frontend/components/registry.ts`):
```typescript
export const COMPONENT_REGISTRY = {
  List: ListPlaceholder,
  Card: CardPlaceholder,
  Chart: ChartPlaceholder,
  Grid: GridPlaceholder,
  Timeline: TimelinePlaceholder,
  Table: TablePlaceholder,
};
```

Each component receives:
- `data`: Resolved from dataContext via namespace::key
- `config`: Parsed from config attribute (includes template mapping)
- `clickPrompt`: Optional prompt describing what clicking does
- `slotId`: Unique identifier for the slot
- `onInteraction`: Callback when user clicks (if clickPrompt exists)

---

## Interaction System

Components can be interactive via `click-prompt`:

```html
<component-slot
  type="List"
  data-source="music::top_songs"
  config='{"template":{"primary":"title","secondary":"artist"}}'
  click-prompt="Dive into this track - show play history and similar songs"
></component-slot>
```

**Flow**:
1. User clicks item in component
2. Component calls `onInteraction({ clickedData: item })`
3. HybridRenderer packages: `{ slotId, clickPrompt, clickedData, componentType }`
4. Toast shows "Interaction captured"
5. Future: POST `/api/interact` → regenerate page with expanded data context

**History Stack** (planned):
- Each interaction pushes current state to history
- User can navigate back to previous states

---

## Toast Notifications

Status updates via toast system (`/frontend/stores/toast.ts`):

**Types**:
- `thinking` - Pulsing dot, persists until removed (for ongoing operations)
- `status` - Green dot, auto-dismiss 3s (for progress updates)
- `error` - Red dot, auto-dismiss 3s

**SSE Integration**:
```python
# Backend can send status events
yield f"event: status\ndata: {json.dumps({'message': 'Planning UI...'})}\n\n"
```

Frontend shows these as toasts automatically.

---

## Optimizations

### Current
- **Streaming**: User sees content as it generates
- **morphdom**: Only updates changed DOM, preserves React roots
- **Slot tracking**: Prevents remounting existing components

### Potential
1. **Parallel planning + prefetch**: Start fetching common data while planning
2. **Speculative generation**: Begin HTML generation with partial data, patch later
3. **Cached schemas**: Pre-compute describe_data for common sources
4. **Component preloading**: Lazy-load component code while streaming
5. **Incremental hydration**: Mount components as their slots appear, not at end

## Token Budget

| Stage | Model | Tokens | Latency |
|-------|-------|--------|---------|
| Planning | Claude Sonnet | ~300 | ~500ms |
| Generation | Claude Sonnet | ~2000 | ~3-5s streaming |

Total first-token: ~800ms
Total complete: ~4-6s

## Endpoint Consolidation

Current state has many direct API routes (`/api/spotify/data`, `/api/stocks/{symbol}`, etc.) that duplicate agent capabilities. These exist for:
- OAuth flows (Spotify requires `/callback`)
- Direct testing during development
- Fallback if agent approach fails

**Target architecture**: Two main endpoints
- `/api/generate` - Full pipeline with agent data fetch
- `/api/query` - Direct agent access for testing

All data fetching should go through the agent, which uses tool calling to dynamically fetch what's needed.

---

## Agent Integration (In Progress)

The `/api/query` endpoint demonstrates tool-calling. Next step: merge into `/api/generate`:

```python
@app.post("/api/generate")
async def generate_ui(request: GenerateRequest):
    async def event_stream():
        # Stage 1: Planning
        plan = await plan_and_classify(request.query)

        # Stage 2: Agent data fetch (NEW)
        yield f"event: status\ndata: {json.dumps({'message': 'Fetching data...'})}\\n\\n"

        response = completion(
            model="gpt-5-mini",
            messages=[...],
            tools=tools,
            tool_choice="auto"
        )

        data_context = {}
        for tool_call in response.tool_calls:
            result = available_functions[tool_call.function.name](**args)
            # Map tool results to namespaced data context
            data_context[namespace] = result

        # Stage 3-6: Continue with UI generation...
```

**Benefits over static `get_data()`**:
- Dynamic data based on user query
- Cross-source correlations ("compare my running to my music tempo")
- Parallel tool execution where possible
- Graceful fallbacks when APIs fail

**Remaining work**:
1. Add `@tool_function` decorators to all fetcher methods
2. Map tool results to proper namespaces (spotify → music, etc.)
3. Handle partial failures gracefully
4. Remove mock data fallback in production

## Error Handling

| Error | Handling |
|-------|----------|
| Planning fails | Return error event, show fallback UI |
| Data fetch fails | Partial data context, LLM adapts |
| Generation fails | Stream error event |
| Hydration fails | Per-component error boundaries |

## Edit Flow

Same pipeline but Stage 4 receives:
- Current HTML (to modify)
- Edit instruction (what to change)
- Same data context (bindings preserved)

morphdom then diffs old → new, preserving mounted components where slot IDs match.
