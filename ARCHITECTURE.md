# Architecture Overview

## System Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend
    participant Agent as GPT-5-mini
    participant APIs as External APIs
    participant LLM as Claude Sonnet

    U->>FE: Enter query
    FE->>BE: POST /api/generate
    BE->>LLM: Plan query
    LLM-->>BE: {sources, intent, approach}
    BE->>Agent: Fetch data (tool calling)
    Agent->>APIs: Call tools in parallel
    APIs-->>Agent: Data responses
    Agent-->>BE: Tool results
    BE-->>FE: SSE: data event
    BE->>LLM: Generate UI
    LLM-->>BE: Stream HTML chunks
    BE-->>FE: SSE: ui events
    FE->>FE: Hydrate components
    FE-->>U: Rendered UI
```

## Pipeline Stages

```mermaid
flowchart LR
    A[Query] --> B[Planning]
    B --> C[Agent Fetch]
    C --> D[UI Generation]
    D --> E[Streaming]
    E --> F[Hydration]

    B -->|~500ms| B
    C -->|~1-2s| C
    D -->|~3-5s| D
```

| Stage | Model | Purpose |
|-------|-------|---------|
| Planning | Claude Sonnet | Classify intent, determine sources |
| Agent Fetch | GPT-5-mini | Tool calling to fetch real data |
| UI Generation | Claude Sonnet | Stream HTML with data bindings |

## Data Flow

```mermaid
flowchart TD
    subgraph Backend
        A[/api/generate] --> B[plan_and_classify]
        B --> C[Agent with Tools]
        C --> D[build_ui_prompt]
        D --> E[Stream Response]
    end

    subgraph Tools
        C --> T1[spotify_fetch_user_data]
        C --> T2[stocks_fetch_stock_info]
        C --> T3[sports_fetch_nba_summary]
        C --> T4[strava_get_activities]
        C --> T5[clash_get_player]
    end

    subgraph Frontend
        E --> F[SSE Parser]
        F --> G[data event → dataContext]
        F --> H[ui events → htmlContent]
        G --> I[HybridRenderer]
        H --> I
        I --> J[morphdom diff]
        J --> K[Mount React components]
    end
```

## Component Hydration

```mermaid
flowchart LR
    A[Raw HTML] --> B[DOMPurify]
    B --> C[morphdom]
    C --> D{Element Type}
    D -->|data-value| E[Resolve from dataContext]
    D -->|component-slot| F[Lookup Registry]
    F --> G[Mount React Component]
    E --> H[Set textContent]
    G --> I[Pass data + config]
```

## SSE Event Types

```mermaid
stateDiagram-v2
    [*] --> status: Planning...
    status --> status: Fetching data...
    status --> data: Send dataContext
    data --> status: Generating UI...
    status --> ui: Stream chunks
    ui --> ui: More chunks
    ui --> done: Complete
    done --> [*]

    status --> error: On failure
    error --> [*]
```

## Tool Calling

```mermaid
flowchart TD
    A[Agent Prompt] --> B[GPT-5-mini]
    B --> C{tool_choice=auto}
    C --> D[Select tools]
    D --> E[Execute in parallel]
    E --> F[Map to namespaces]

    subgraph Namespace Mapping
        F --> G[spotify → music]
        F --> H[stocks → stocks]
        F --> I[sports → sports]
        F --> J[strava → fitness]
        F --> K[clash → gaming]
    end
```

## Key Files

| File | Purpose |
|------|---------|
| `backend/main.py` | API endpoints, agent orchestration |
| `backend/prompts.py` | LLM system prompts |
| `backend/data.py` | Component schemas, mock data |
| `backend/tool_generator.py` | @tool_function decorator |
| `backend/integrations/*.py` | Data fetchers with tool metadata |
| `frontend/stores/stream.ts` | SSE handling, state management |
| `frontend/components/HybridRenderer.tsx` | DOM diffing, component mounting |
| `frontend/components/registry.ts` | Component type → React component |

## Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/generate` | POST | Main UI generation with agent |
| `/api/generate-legacy` | POST | Legacy mock data version |
| `/api/query` | POST | Direct agent testing |
| `/api/refine` | POST | Edit existing UI |
| `/health` | GET | Health check |
