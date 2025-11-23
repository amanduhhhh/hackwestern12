# Frontend Behavior Nuances

## Streaming & Hydration

### Content Persistence During Interactions
**Behavior:** When user clicks an interactive component, the current UI remains visible (at 50% opacity) until the new UI starts streaming.

**Why:** Prevents jarring blank screen flash. Users see what they clicked on while waiting for the drill-down view.

**Implementation:** `stream.ts` doesn't clear `htmlContent` until the first `ui` event arrives.

---

## Component Mounting & Preservation

### morphdom Strategy
**Behavior:** During streaming, existing React components are preserved and only new/changed HTML is updated.

**Why:** Prevents unnecessary unmounting/remounting which would cause flickering and lost state.

**Implementation:** 
- Generate slot IDs (`type::dataSource`)
- Replace mounted slots with placeholders before morphdom diff
- morphdom skips elements with `data-slot-id` attribute

### Fresh Render Detection
**Behavior:** Detects if content is streaming (append) vs completely replaced (fresh render).

**Implementation:**
```typescript
const isStreaming = htmlContent.startsWith(prevHtmlRef.current) && 
                    htmlContent.length > prevHtmlRef.current.length;

if (prevHtmlRef.current && !isStreaming) {
  cleanupRoots(); // Complete replacement - clear everything
}
```

---

## Interaction Handling

### Disabled During Processing
**Behavior:** All interactions are disabled (pointer-events: none, 50% opacity) while waiting for drill-down response.

**Why:** 
- Prevents double-clicks causing race conditions
- Visual feedback that system is processing
- Maintains context of what was clicked

**Implementation:** `isInteracting` flag passed to HybridRenderer, checks on click handlers.

### View Stack Navigation
**Behavior:** Each interaction pushes current state to stack. Back button pops and restores previous view.

**Why:** Enables natural drill-down/drill-up navigation without page reloads.

**Implementation:** Zustand store maintains `viewStack: ViewState[]` with full state snapshots.

---

## Data Binding

### Array Length Fallback
**Behavior:** If `data-value` accidentally references an array, displays array length instead of crashing.

**Why:** Graceful degradation. LLM might make mistakes, but UI shouldn't break.

**Implementation:** `resolveDataValue()` checks `Array.isArray(value)` and returns `value.length`.

### Path Resolution
**Behavior:** Supports nested data access: `sports::teams[0].wins`

**Why:** Enables granular data binding without backend creating flat structures.

**Implementation:** `resolvePath()` with regex parsing for bracket notation and dot notation.

---

## Animation & Polish

### Component Entry Animations
**Behavior:** Components fade/slide in on first mount, but not on re-renders during same session.

**Why:** Smooth initial experience without annoying repeated animations.

**Implementation:** Each component has `hasAnimated` ref that persists across re-renders.

### Renderer Fade
**Behavior:** Entire renderer fades to 50% opacity when interacting, fades to full when ready.

**Why:** Clear visual feedback of loading states without blocking view of content.

**Implementation:** Framer Motion `animate` prop tied to `isReady` and `isInteracting` states.

---

## Key Design Decisions

1. **No clearing before data arrives** - Always keep something on screen
2. **Components are preserved** - morphdom diffs around React roots
3. **Interactions disabled during processing** - Prevent race conditions
4. **Graceful fallbacks** - Array length for data-value, error boundaries per component
5. **View stack for navigation** - Full state snapshots enable instant back navigation
6. **First-render-only animations** - Polished without being annoying

