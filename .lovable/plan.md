## What we're shipping

Two parallel tracks, both visible to users on day one.

### Track A — New AI brain trust + reasoning dial

The model catalog hasn't been touched in a while. The newest reasoning models (Gemini 3.1 Pro preview, GPT-5.4, GPT-5.5, plus the lite preview) are not exposed anywhere, and none of your heavy-thinking flows pass a `reasoning.effort` parameter — so even when you call a reasoning model, it's running on default effort.

**1. Centralize the model registry.** Create `src/lib/aiModels.ts` as the single source of truth. Each entry has: id, label, provider, tier (free/builder/pro/admin), credit cost, reasoning-capable flag, and a one-line strength tag ("hardest reasoning", "fastest, cheapest", etc). Edge functions read costs from a tiny mirrored map; the UI reads everything else.

**2. Add a Reasoning Effort selector** (minimal / low / medium / high / xhigh) on the flows that benefit:
   - Council Mode synthesis (knowledge-extract)
   - Code generation in AI Hub
   - Founder Interview & Cognitive Fingerprint
   - DPO pair generation (mcp soupylab_generate_dpo_pairs)
   
   Default = `medium`. Free tier capped at `low`. Pro/Admin unlocks `xhigh`. Effort gets piped into the Lovable AI Gateway request body as `reasoning: { effort }`.

**3. Wire the new models into the existing pickers** (ImageForgePage already has image models — add text-model picker for Council Mode and Chatroom moderator). Visually badge reasoning-capable models with a small "thinks" pulse indicator (matches your sci-fi aesthetic).

**4. Update model defaults** where it matters:
   - Knowledge extraction default → `openai/gpt-5.4` at `high`
   - Council synthesis default → `google/gemini-3.1-pro-preview` at `high`
   - Cheap/batch defaults stay on `gemini-3-flash-preview`

### Track B — Conversion polish (landing + pricing)

Analytics signal: **72% mobile, 71% bounce, syndicatedsearch + reddit are top non-direct sources**. The current hero loads heavy (video + multiple landing demo components) before showing a clear value prop on a small screen.

**1. Mobile-first hero rewrite.** Above-the-fold on mobile = one headline, one sub, one primary CTA ("Start free — 50 credits"), one secondary ("Try the 60-second demo"). Defer HeroVideo + InteractiveDemo + OfflineDemo below the fold with lazy intersection-observer mounting. Keep desktop layout largely intact.

**2. Trust strip directly under hero**: live count of models trained, credits used today, country flags from your analytics top 10. Pulls from a tiny `public_stats` view (read-only, no auth).

**3. New-models marquee** in the "What's New" panel — calls out Gemini 3.1 Pro and GPT-5.4/5.5 with the reasoning dial. Ties Track A directly to the conversion story ("Now with deep-thinking models").

**4. Pricing page** — single-column on mobile, sticky "Most Popular" indicator on the Builder tier card, ROI calculator (already exists per memory) gets bumped above the fold on mobile. Pull the Easter sale banner if expired (it ended April 6 — currently dead code rendering nothing but worth removing).

**5. Sticky mobile CTA bar** on landing — appears after scrolling past hero, fixed bottom, "Start free" + tier badge. This is your single biggest mobile conversion lever.

## Technical notes

- New file: `src/lib/aiModels.ts` (model registry + types)
- New file: `src/components/ReasoningEffortSelector.tsx` (UI dial)
- New migration: `public_stats` view (`security_invoker = true`, `models_trained_count`, `credits_used_today`, top countries) — counts only, no PII
- Edge function updates: `knowledge-extract`, `ai-generate`, `visual-chatroom`, `founder-interview`, `cognitive-fingerprint`, `pipeline-modes` — accept optional `model` + `reasoningEffort` from client, validate against tier
- `LandingPage.tsx` — extract hero into `HeroMobileFirst.tsx`, lazy-mount the heavy demo components
- `PricingPage.tsx` — mobile layout pass + remove dead sale banner
- New: `src/components/landing/StickyMobileCTA.tsx`
- New: `src/components/landing/TrustStrip.tsx`
- All new colors/animations go through the existing design tokens — no raw Tailwind colors

## What's NOT in scope

- No new pages, no auth changes, no new tables (just a view)
- No Stripe price changes
- No SLM Lab or Image Forge surgery beyond exposing the new models in their pickers
- BYOK encryption, RLS, JWT gating — all unchanged

## Order of operations

1. Migration: `public_stats` view
2. `aiModels.ts` registry + `ReasoningEffortSelector` component
3. Edge function updates (reasoning effort plumbing)
4. Wire new picker into Council Mode + Knowledge flows
5. Landing mobile hero refactor + sticky CTA + trust strip
6. Pricing mobile polish + dead-code cleanup
7. Final QA on mobile viewport
