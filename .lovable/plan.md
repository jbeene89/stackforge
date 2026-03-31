

# Restore Gallery Image to Council

## What It Does

Adds a "Re-forge in Council" button to the gallery lightbox that loads a saved image's prompt back into the Council Mode input, pre-fills the image as the starting point, and lets users run another round of perspective enrichment on it.

## Changes

### 1. `src/components/ForgeGallery.tsx`
- Add a new **"Re-forge"** button (with `Users` icon) in the lightbox action bar next to "Use This"
- Only show it for items that have a prompt (council images always do)
- Wire it to a new `onReforge` callback prop

### 2. `src/pages/ImageForgePage.tsx`
- Add `onReforge` handler to `ForgeGallery`: receives the gallery item, sets `prompt` to the item's prompt, sets `result` with the existing image, switches to the Council tab, sets stage to `"done"`, and closes the gallery
- This effectively restores the full council state — user sees their old image and prompt, and can hit "Re-forge" or edit the prompt to run another council round
- Add a **"Re-forge"** button next to the existing result action buttons (Download, Copy, etc.) that resets `stage` to `"idle"` while keeping the prompt, so users can immediately re-run the council on the current prompt

### 3. `src/components/ForgeGallery.tsx` (ForgeGalleryProps)
- Add optional `onReforge?: (item: ForgeGalleryItem) => void` prop

## Flow
1. User opens Gallery → clicks an image → sees lightbox
2. Clicks "Re-forge in Council" → gallery closes, prompt is restored, image shown as previous result
3. User edits prompt or clicks generate to run another council round with 5 perspectives

