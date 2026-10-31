# Welcome and first dataset
- [x] Update welcome links and retry handling; deploy sender. Actual new-account inbox delivery remains unverified.
- [x] Add a one-click starter dataset with 10 curated training pairs.
- [x] Verify 13 tests, saved pairs after reload, and deployed rejection of existing-account welcome sends.
- [ ] Existing-user launch email: blocked; requires a dedicated marketing service, not app emails.

# Model and interface refresh
- [x] Refresh shared training, model library, GPU setup, and self-host model choices; retain old job aliases.
- [x] Update WebLLM to 0.2.86, validate GPU adapters, and improve loading, stop handling, and Ollama streaming.
- [x] Simplify mode selection and local AI page; replace pretend model deployment controls with real selection and source links.
- [x] Pass 12 focused tests and check signed-in selection persistence, vision filtering, and all browser model IDs.
- [ ] Actual on-device generation and training: blocked; sandbox has no compatible GPU or local Ollama service.
# What's New and own inference
- [x] Add 8 recent updates to the What's New panel; hide the expired Easter sale entry.
- [x] Smart Switch engine (home computer > device chip > own file > cloud) with offline lock and mid-answer fallback on Local AI.
- [x] Run your own model file in the browser, keep it saved on the device, label card + Modelfile + auto-split in training kits.
- [x] Lab model-comparison tools left on home computer on purpose (they test one specific model).
- [ ] Real-speed test of own model files and Ollama: needs the user's RX 580 at home.
