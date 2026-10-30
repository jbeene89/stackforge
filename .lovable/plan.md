# SoupyLab Engine: Smart Switch + Your Model, Anywhere

## Goal
One "Run" button that always works, and one model file that runs the same everywhere. Users never pick an engine, port, or format.

## What the user sees

**1. Smart Switch (one Run button)**
- On open, SoupyLab quietly checks three places, in this order:
  1. Home computer (Ollama running on this machine)
  2. This device's graphics chip (browser GPU)
  3. This device's processor (slower, but works on almost anything)
  4. Cloud (uses credits; only if the user allows it)
- A small status chip shows where it is running now: "Home GPU", "This device", or "Cloud - 1 credit".
- If one spot fails mid-answer (Ollama closes, GPU runs out of memory), it switches to the next one and says so. No dead screens.
- A "Stay offline" switch blocks cloud fallback completely.

**2. Your Model, Anywhere (one portable file)**
- After training, the Export step offers one main download: a single SoupyLab model file (the standard GGUF format, small Q4 size).
- That same file can:
  - Be dropped into the Local AI page and run right in the browser, no install
  - Be loaded into Ollama with one copy-paste command card
  - Be opened in phone apps that read this format
- The Local AI page gets a "Load my model file" button. Picked files are saved on the device so they don't need re-loading.
- The model file carries a small label card (name, base model, your system prompt) so it behaves the same in every place.

## Build order
1. Smart Switch engine + status chip on the Local AI page (uses the three engines we already have plus the cloud).
2. In-browser runner for the user's own model file + "Load my model file" button + on-device saving.
3. Export step: single portable file download, label card, and Ollama command card.
4. Use the Smart Switch in the other places that run a model (Lab test chat, Knowledge Refinery).

## Honest limits
- Running your own file in the browser uses the processor, not the graphics chip, so 0.6B-1.7B models are comfortable; 4B is slow. Bigger models are routed to Ollama.
- Browsers limit single files to about 2 GB; larger files get split automatically.
- I can't test real speed here (no GPU or Ollama in my sandbox). You'd test on your RX 580 at home.

## Technical details
- New `src/lib/engine/` module: a router with a common `generate(prompt, opts, signal)` interface and adapters for Ollama (existing NDJSON parser), WebLLM (existing), wllama (llama.cpp compiled to WebAssembly, runs GGUF in-browser), and the cloud `ai-generate` function (existing credit checks).
- Detection order is cached per session; failures mid-stream trigger fallback with the partial text preserved.
- GGUF files stored in OPFS/IndexedDB; metadata sidecar JSON (name, base model, system prompt, chat template) bundled alongside.
- Export: reuse existing GGUF conversion scripts in DeployPipelinePage; add sidecar + Modelfile generation.
- Tests: router fallback order, offline-only blocks cloud, model size routing threshold.
- Record the engine module rule in AGENTS.md.
