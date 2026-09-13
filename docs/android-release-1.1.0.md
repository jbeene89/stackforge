# SoupyLab 1.1.0 Android release candidate

Status: release candidate built; automated and native upgrade checks passed. Existing upload-key password is required for signing. No Play upload has been performed.

| Item | Candidate value |
| --- | --- |
| Version name | `1.1.0` |
| Version code | `10002` |
| Release application ID | `com.soupylab.app` |
| Separate debug preview application ID | `com.soupylab.app.preview` |
| Play Console latest version code | Not yet checked; verify `10002` is available before upload |

## Play release notes

The following copy is under 500 characters:

> Meet your new SoupyLab workspace: find tools faster with search, subject filters, favorites, and recently opened tools. Prepare prompt-and-response training examples in the offline notebook, then import or export JSONL. Try useful demo presets for field notes, email sorting, and rewriting. Enjoy clearer mobile navigation and sign-in that returns you to your selected tool.

## Implemented changes

- Public `/launchpad` with a responsive graphite and orange interface, connection indicator, account access, and direct entry to SLM Lab, the offline workbench, and the module builder demo.
- Search across 22 existing tools, filter by subject, explicitly favorite tools, and reopen up to four recent tools. Favorites and recent navigation paths persist on the device.
- Real demo links select `scope-summarizer`, `tone-rewriter`, or `email-classifier` in `/demo/module-builder`.
- `/offline-workbench` includes a training notebook for writing, editing, searching, and explicitly saving prompt-and-response pairs. JSONL imports are reviewed before saving; exports support native sharing and a copyable text fallback.
- Notebook validation covers duplicate pairs, malformed imports, storage failures, and conflicting stored changes. Limits are 100 saved examples, 4,000 characters per prompt or response, and 6 MB per import file.
- Mobile navigation provides consistent access to the app's public starting points. `/launchpad?view=tools` opens the catalog and focuses its search field.
- Sign-in accepts a validated app-relative destination and returns to the selected tool. Protected routes and plan gates continue to control access.
- Selected dataset context follows its signed-in owner; sign-out and account changes immediately stop a previous account's dataset from entering model context.
- Analytics and Google Ads initialize only after consent. Decline and unavailable preference storage keep them disabled; consent controls have 44-pixel touch targets.
- Android system-bar icons, inset fallbacks, and a fixed status-area backdrop keep controls and scrolling text clear of system bars.
- A native upgrade guard unregisters stale same-origin service workers and reloads once, without clearing notebook, IndexedDB, localStorage, or CacheStorage.

## Native, offline, and security behavior

The notebook prepares examples; it does not train or run a model offline. Notebook text is saved locally only when the user chooses to save. Its import/export workflow does not submit examples to a model or a cloud backend. Sharing happens only after the user selects export and uses the device's share options.

Cloud tools, account operations, and AI demo requests require connectivity. Some tools also require an account or a qualifying plan; the launchpad labels these requirements. The new launchpad itself does not invoke model services.

Workspace preferences use a versioned schema and retain only allowlisted tool paths. They do not contain prompts, project contents, arbitrary URLs, or authentication credentials. Corrupt or unavailable preference storage is handled without preventing the page from opening.

Native navigation uses app hash routes; regular website navigation retains its existing route format. Auth redirect validation rejects external URLs and authentication-page loops. The separate preview package can be installed without replacing the release package or sharing its private app data.

Release validation must confirm that the generated native package uses the intended application ID and version, packaged web assets, and the production transport/debug settings. The source Capacitor configuration and generated Android project must be checked as part of this gate; this document does not attest to an unvalidated binary.

## Relevant source

- `src/pages/NativeLaunchpadPage.tsx`
- `src/components/native/NativeLaunchpad.css`
- `src/lib/workspace-catalog.ts`
- `src/lib/workspace-preferences.ts`
- `src/lib/workspace-preferences.test.ts`
- `src/pages/OfflineWorkbenchPage.tsx`
- `src/pages/OfflineWorkbenchPage.test.tsx`
- `src/components/native/LocalTrainingNotebook.tsx`
- `src/lib/training-notebook.ts`
- `src/lib/export-training-data.ts`
- `src/components/native/MobileNavigation.tsx`
- `src/components/native/mobile-navigation.css`
- `src/components/native/AppLoadingScreen.tsx`
- `src/lib/native-navigation.ts`
- `src/lib/native-navigation.test.ts`
- `src/pages/LoginPage.tsx`
- `src/pages/DemoModuleBuilderPage.tsx`
- `src/App.tsx`

## Reproduce and validate

From the prepared PC release workspace containing the build scripts:

```powershell
npm test
npx tsc --noEmit -p tsconfig.app.json
python build_android.py
```

After source checks, the Android build, and preview verification pass, provide the existing release keystore password through the approved secure local mechanism and run:

```powershell
python sign_android_release.py
```

Do not place passwords in these commands, this document, repository files, or build logs. A secure local keystore password is currently missing, so release signing remains blocked. Preserve the existing release signing identity for an update to `com.soupylab.app`.

The build and sign commands create reviewable artifacts; they do not authorize or perform a Play upload.

## Validation record

- 45 Vitest tests passed across 8 files. TypeScript checking and the production web build passed.
- Android `:app:assembleDebug`, `:app:bundleRelease`, `:app:lintDebug`, `:app:testDebugUnitTest`, and `:app:assembleDebugAndroidTest` passed with Java 21, Gradle 8.14.3, AGP 8.13.0, min SDK 24, and target/compile SDK 36.
- The dedicated Android 36.1 Google Play x86_64 phone emulator used 1080x2400 pixels, density 420, and SwiftShader. No personal device or installed Play app was changed.
- Native instrumentation passed: a real stale-worker HTML page was intercepted, the packaged launchpad recovered, worker registrations and controller were removed, saved notebook bytes and an IndexedDB record survived, and the notebook screen displayed the preserved example.
- Preview UI checks passed for search, favorites, explicit notebook save, cold-restart persistence, and the Android JSONL share chooser. The chooser was canceled without choosing any recipient or destination. Emulator connectivity toggles did not establish a reliable isolated-network state, so no offline-network claim is made from that toggle test.
- Final-APK captures verified the home screen, notebook and scrolled notebook with readable system bars/gesture inset, email/password sign-in visibility, and the launchpad Field notes link selecting Scope Summarizer in the demo. Demo runs remained at 5; no model request was submitted. Captures: `native-home-final.png`, `native-notebook-final.png`, `native-notebook-final-scrolled.png`, `native-login-final.png`, `native-module-demo-final.png`, and `native-preset-route-final.png`.
- Release package metadata confirmed `com.soupylab.app` / `1.1.0` / `10002`; release debugging is off and cleartext networking is denied by the target-SDK default. Permissions are INTERNET and the app's signature-protected dynamic-receiver permission. Packaged Capacitor config contains no remote `server.url`. The debug-only worker fixture is absent from the release AAB.
- The separate `com.soupylab.app.preview` APK has a verified Android debug signature and can be installed alongside the Play app. It is not the Play upload bundle.
- Lint passed with 0 errors. Remaining warnings concern generated scaffold resources, dependency-update advice, and preserved original icon/splash assets; no lint checks were suppressed. The web build retains a large optional model-runtime chunk warning.
- Signed release AAB and upload-certificate verification remain pending the existing keystore password. The keystore companion `.txt` is a binary duplicate, not a password note. `Sign-SoupyLab-Release.cmd` opens a local secure password prompt; the helper verifies the unsigned bundle hash and requires the certificate to match the supplied release before signing.
- Tablet, XR, live account sign-in, paid-plan behavior, model output quality, and Play Console upload eligibility were not tested in this pass. No model requests or external messages were sent.
- Play Console latest version code is not yet checked. Play upload and rollout were not performed.

Exact artifact hashes, binary inspection, logs, and local capture filenames are recorded in `release-artifacts/`. Source was built from the working tree and is associated with the final reviewed commit separately in the build receipt.
