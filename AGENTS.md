# Project rules
- Send new-account welcome emails from the first confirmed session; validate recipient ownership on the server and use account-derived idempotency keys to prevent duplicates.
- Keep starter training pairs in a shared local catalog and save them through an authenticated, offline-aware mutation so loading examples does not require paid AI generation.
- Keep local model choices in a shared capability-aware catalog with distinct training repository IDs and Ollama tags; exclude vision models from text-only training scripts.
- Keep browser model IDs tied to the installed WebLLM prebuilt catalog, validate a real GPU adapter, and interrupt generation on cancellation; this prevents unsupported choices and stuck GPU work.
- Parse Ollama responses as buffered newline-delimited JSON because network chunks may split records or UTF-8 characters.