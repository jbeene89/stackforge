# SoupyLab tester feedback implementation

Target: SoupyLab `com.soupylab.app`, Google Play app `4976390622296848277`. The supplied PDF contains a link to `com.soupytag.app`; the user explicitly corrected this. SoupyTag and Image Explorer are separate apps.

Candidate: 1.1.0 (10002), updating the existing Closed testing – Alpha release 10001. Production is unavailable: Play currently reports only one opted-in tester, while its dashboard requires at least 12 for 14 days.

## Report response

- Store discovery: expanded accurate short/full descriptions, natural feature terms, account/connection/credit requirements, and a clear offline notebook explanation. Keep the existing SoupyLab name.
- Image upload movement: a fixed viewport background independent of document height; bounded photo preview with equal camera/image dimensions; scrollable bounded batch previews.
- Import performance/recovery: sequential decoding, 8 MB per file / 40 MB per batch / 30 files, 40-megapixel guard, 2048-pixel preparation, timeout, URL cleanup, real loading and disabled controls. An invalid replacement retains previous images. Failed capture upload preserves photo and notes.
- Rating: public App settings opens the exact SoupyLab Play listing, with closed-test availability explained and no forced prompts or review incentives.
- Sharing: native Android sharing for the app link and generated Image Forge files; visible touch controls instead of hover-only controls; existing JSONL export remains available.
- Onboarding: dismissible first-visit guide card and replayable three-step guide with Skip, Back, Next, and Done.
- Feedback: labelled in-app draft that opens the verified Play support email address; copy fallback; no automatic message sending.
- Accessibility: named controls, 48-pixel new actions and modal close control, scrollable dialogs, safe-area padding, live status text, and reduced-motion handling.
- Screenshots: fresh actual Android captures of the corrected app, avoiding invented AI results and unrelated app assets.

## Validation

56 Vitest tests passed across 12 files. Regression coverage includes invalid/corrupt/stalled image imports, aspect preservation and sequential processing, keeping captures after failed uploads, guide replay, correct package rating link, encoded email draft, and native image-share file handling.

TypeScript, production web build, Android debug APK, release AAB, Android lint, unit-test task and instrumentation APK build passed. Native testing caught a circular vendor-chunk startup failure in an intermediate candidate; React/UI libraries were grouped together, rebuilt and successful launch confirmed. Intermediate bundles must not be uploaded.

Native UI and release submission results will be recorded in the final release receipt. Live signed-in cloud model generation, paid plans and real-device performance require their own validation; unit tests do not prove those services.