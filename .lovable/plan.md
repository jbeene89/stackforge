

# Comparative Probe — Side-by-Side Model Knowledge Comparison

## Summary

Add a "Comparative Probe" mode to the Knowledge Probe section in SLM Lab Step 4 that lets users run the same diagnostic prompts against two models simultaneously (e.g., their fine-tuned model vs. the original base model) and see a side-by-side diff of responses, behavioral changes, and a delta knowledge map showing what shifted after training/unlearning.

## Why This Matters

Users currently can only probe one model at a time. After fine-tuning or unlearning, they have no way to see *what actually changed*. Comparative Probe answers: "What did my training actually do to this model?" and "What would happen if I unlearned X?" — before committing to destructive operations.

## Architecture

New file to keep SLMLabPage from growing further:

```text
src/components/slm-lab/ComparativeProbe.tsx   ← Self-contained comparison UI
```

## What Gets Built

### 1. ComparativeProbe Component

**Model Selection Panel**
- Two model selector dropdowns side by side: "Model A (Base)" and "Model B (Modified)"
- Auto-populates with `baseModel` as Model A default
- Model list fetched from Ollama `/api/tags` endpoint (same pattern as existing probe)
- User can type a custom model name if it's not in the list (for fine-tuned models with custom names)

**Probe Execution**
- Same 6 DIAGNOSTIC_PROMPTS as existing probe, plus custom prompt input
- "Compare All 6" button runs all diagnostics against BOTH models in parallel (Model A prompt 1 + Model B prompt 1 simultaneously, then prompt 2, etc.)
- Individual diagnostic buttons also available
- Progress bar shows `Comparing 3/6...` with both models' status

**Side-by-Side Results View**
- Each probe result renders as a two-column card:
  - Left column: Model A's response (with blue accent border)
  - Right column: Model B's response (with purple accent border)
  - Header shows the prompt, label, and model names
- Response differences highlighted:
  - Text length delta shown (e.g., "+142 chars" or "-89 chars")
  - Key behavioral indicators auto-detected (corporate language, hedging, hallucination markers) with colored badges per side
- Collapsible full response text (first 200 chars visible by default, expand to see full)
- Mobile: stacks vertically instead of side-by-side

**Delta Knowledge Map Card**
- Appears after all 6 probes complete on both models
- Shows the same 6 categories (Tone, Citations, Corporate, Reasoning, Domain, Hallucination) but now with TWO verdicts per row:
  - Model A verdict → arrow → Model B verdict
  - Color-coded: Green arrow = improved, Red arrow = regressed, Gray = unchanged
- Summary stats: "3 improved, 1 regressed, 2 unchanged"
- "Changes to watch" section highlights regressions with explanations
- "Improvements" section highlights positive shifts

**Unlearn Simulation Preview**
- For each probe where Model B differs from Model A, shows a badge: "This would change if unlearned"
- Users can flag specific behavioral differences as unlearn targets directly from the comparison view
- Clicking "Flag for Unlearn" adds to the existing `unlearnTargets` state via callback prop

### 2. Integration into SLMLabPage Step 4

- New tab/toggle in the Knowledge Probe section header: "Single Probe" | "Compare Models"
- Toggling to "Compare Models" renders the ComparativeProbe component
- Shares the same `unlearnTargets` setter and `baseModel` value
- Single Probe remains the default — Compare is the advanced option
- Badge: "DIFF" next to the Compare toggle

### 3. Ollama Model Discovery

- On mount, ComparativeProbe fetches `GET {ollamaHost}/api/tags` to list all locally available models
- Populates both dropdowns with discovered models
- Shows model size/parameter count next to each name if available from the tags response
- Graceful fallback: if Ollama unreachable, shows text inputs instead of dropdowns

## Technical Details

- Parallel fetching: Both models probed simultaneously using `Promise.all` for each prompt pair
- All state local to ComparativeProbe (no new state in parent except the toggle)
- Props from parent: `baseModel`, `domain`, `onFlagForUnlearn(target: string)`, `ollamaHost`
- Responsive: 2-column on desktop, stacked on mobile via `grid-cols-1 md:grid-cols-2`
- Lazy-loaded via `React.lazy()` since most users will use single probe first
- Same verdict heuristics as existing Knowledge Map (regex-based tone/citation/corporate detection)
- No new dependencies — uses existing UI components (Card, Badge, Button, Select, Progress)

## Build Error

The current build "errors" are chunk size warnings only — the build succeeds. No fix needed.

## Files Changed

| File | Change |
|------|--------|
| `src/components/slm-lab/ComparativeProbe.tsx` | **New** — Full comparative probe component |
| `src/pages/SLMLabPage.tsx` | Add "Single / Compare" toggle in Knowledge Probe section, lazy-import ComparativeProbe, pass props |

