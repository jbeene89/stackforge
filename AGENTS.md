# Project rules
- Send new-account welcome emails from the first confirmed session; validate recipient ownership on the server and use account-derived idempotency keys to prevent duplicates.
- Keep starter training pairs in a shared local catalog and save them through an authenticated, offline-aware mutation so loading examples does not require paid AI generation.