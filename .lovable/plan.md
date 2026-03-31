

# ImageAnimator: New Effects and Action Overlays

## What We're Building

Two major additions to the ImageAnimator:

1. **3 new motion presets** (Rain, Fire, Glitch) that use canvas overlay rendering instead of pixel displacement
2. **Action Effects system** — dramatic overlay animations (Fire Laser, Throw Money, Explosion, Lightning) triggered from the focal point, with an optional AI-generated custom action via text prompt

## Architecture

The current system works by displacing pixels in a region around a focal point. The new effects will work differently:

- **Rain**: Draw animated semi-transparent streaks falling downward within the focal radius
- **Fire**: Draw flickering orange/yellow particles rising upward from the focal point
- **Glitch**: Randomly slice and offset horizontal bands within the focal region, with RGB channel splitting

For **Actions**, these are one-shot animated overlays (not looping motion styles). They render on top of the image using canvas drawing:

- **Fire Laser**: A beam shoots outward from the focal point with glow
- **Throw Money**: Animated dollar/coin sprites scatter outward from focal point
- **Explosion**: Expanding ring + particle burst from focal point
- **Lightning**: Jagged branching lines emanating from focal point
- **AI Custom**: User types a prompt (e.g., "shoot rainbow beams"), we send it to Lovable AI to get a description of the visual effect parameters (color, particle shape, direction, count), then render a procedural effect matching that description

## UI Changes

**Motion Style picker** — add Rain, Fire, Glitch buttons to the existing row (they'll wrap naturally with `flex-wrap`).

**New "Actions" section** below Motion Style:
- A row of action buttons (Fire Laser, Throw Money, Explosion, Lightning)
- An input field + "AI Action" button for custom prompt
- Clicking an action triggers a one-shot 2-second animation overlay, auto-plays, and can be recorded

## Technical Details

### File: `src/components/ImageAnimator.tsx`

1. Expand `AnimationStyle` type to include `"rain" | "fire" | "glitch"`
2. Add entries to `ANIMATION_STYLES` array with appropriate icons (`CloudRain`, `Flame`, `Zap` from lucide)
3. Add new switch cases in the animation loop:
   - **rain**: Skip pixel displacement; instead draw translucent diagonal lines (streaks) that fall at varying speeds, seeded by position within focal radius
   - **fire**: Draw particles (small circles with orange→yellow gradient) that rise and fade, spawning from the bottom of the focal region
   - **glitch**: Slice the focal region into horizontal bands, offset them randomly each frame, add occasional RGB channel split

4. Add new state: `activeAction`, `actionStartTime`, `customActionPrompt`, `isGeneratingAction`
5. Add an `ActionEffect` type and a set of predefined action configs
6. In the animation loop, after the motion style rendering, check if `activeAction` is set and render the action overlay:
   - Actions have a fixed duration (2s), after which they auto-clear
   - Each action is a particle/line system drawn on top of the canvas
7. For AI custom actions: call the existing `ai-generate` edge function with a structured prompt asking for effect parameters (color hex, particle count, direction, shape), parse the JSON response, and create a procedural effect from it

### New icons needed
`CloudRain`, `Flame`, `Zap`, `Crosshair`, `DollarSign`, `Bomb`, `Wand2` from lucide-react

## Implementation Steps

1. Add rain, fire, glitch presets to the motion style system (type + configs + render logic)
2. Build the Actions system — state, UI section with action buttons, one-shot overlay renderer in the animation loop
3. Add AI custom action — input field, edge function call to generate effect params, render the result
4. Wire everything together and ensure recording captures action overlays

