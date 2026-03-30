# SoupyLab

**Design AI agents. Wire them into pipelines. Ship to any device.**

SoupyLab is a visual, full-stack AI platform for building, testing, and deploying AI-powered applications — all from your browser. No ML expertise required.

🌐 **Live** → [soupylab.com](https://soupylab.com)

---

## Table of Contents

- [Why SoupyLab?](#why-soupylab)
- [Core Features](#core-features)
- [Additional Tools](#additional-tools)
- [Pages & Routes](#pages--routes)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Edge Functions](#edge-functions)
- [Credit Economy](#credit-economy)
- [Authentication](#authentication)
- [Security](#security)
- [Design System](#design-system)
- [Local Development](#local-development)
- [License](#license)

---

## Why SoupyLab?

Most AI tools are wrappers around a single model. SoupyLab is different — you design the **reasoning chain**:

1. **Pick your models** — GPT-5, Gemini Pro, open-source SLMs
2. **Set guardrails** — tone, task boundaries, output format, constraints
3. **Wire nodes into stacks** — multi-agent pipelines with routing, evaluation, and memory
4. **Deploy anywhere** — web, Android, edge devices, or self-hosted

---

## Core Features

### 🧠 AI Module Builder
Create configurable AI agents with system prompts, guardrails, task boundaries, and model selection. 12 module types:

| Type | Description |
|------|-------------|
| `specialist` | Domain-focused expert agent |
| `slm` | Small Language Model for on-device inference |
| `router` | Routes input to the appropriate downstream module |
| `evaluator` | Scores and ranks outputs from other modules |
| `critic` | Provides constructive feedback on module outputs |
| `comparator` | Compares multiple outputs side-by-side |
| `formatter` | Transforms output into a specific format |
| `extractor` | Pulls structured data from unstructured input |
| `classifier` | Categorizes input into predefined classes |
| `memory-filter` | Manages conversational context and memory |
| `human-gate` | Pauses execution for human review/approval |
| `synthesizer` | Combines multiple inputs into a unified output |

Each module supports: system prompts, temperature/max-token tuning, tone control, deterministic mode, SLM mode, tool access, memory, guardrails, constraints, allowed inputs/outputs, and output format specification.

### 🔗 Stack Canvas
Visual multi-agent pipeline editor. Connect modules with conditional edges, parallel branches, and data routing. Drag-and-drop node placement with configurable edges and labels.

### 🎨 Image Forge
Multi-perspective creative studio applying Cognitive Dense Perspective Training (CDPT) to image generation:
- **Council Mode** — AI-enriched prompts using 5 cognitive perspectives (Builder, Empath, Systems Thinker, Red Team, Frame Breaker) with synthesis. ~45 credits per full council run.
- **Free Mode** — Interactive visual chatroom with character-based AI conversations and image generation.
- Powered by the Stability AI API (v2beta) for high-fidelity image synthesis.

### 🚀 Projects & Deploy
Full project lifecycle — web apps, Android apps, AI modules, stacks, and hybrids:
- AI-powered prompt interface with streaming progress and persistent chat history
- One-click Android deployment pipeline with step-by-step progress tracking
- Phone deploy guide for sideloading APKs
- Five project types: `web`, `android`, `module`, `stack`, `hybrid`
- Five statuses: `draft` → `building` → `testing` → `deployed` → `archived`

### 🧪 Lab & Slicer Lab
- **Lab** — Interactive testing environment. Run test cases, inspect step-by-step execution, compare outputs across module configurations.
- **Slicer Lab** — Specialized data slicing and analysis workspace for training data preparation.

### 🏪 Marketplace
Publish and discover community-built templates. Buy and sell modules, stacks, and project templates using credits. Templates include metadata (type, tier, tags, price) and download counts.

### 📦 Export Studio (Builder+ tier)
Export to multiple platforms with auto-generated, domain-specific code:
- Unity (C#)
- Unreal Engine (C++)
- ROS 2 (Python)
- Arduino (C)
- Python SDK

### 📡 Edge & On-Device
- **SLM Mode** — Local model execution configuration
- **On-Device Templates** — Pre-built templates for edge deployment
- **Edge Training** (Pro tier) — Training models directly on edge devices
- **Inference Playground** — Test models with live parameter tuning
- **Device Console** — Real-time device monitoring, logs, and diagnostics
- **Self-Host Package Generator** — Bundle entire AI infrastructure locally with Docker Compose, Ollama, and zero cloud dependencies

### 🌾 SoupyLab Harvester (Chrome Extension)
Privacy-first browser extension for collecting training data while browsing the web:
- **Right-click capture** — Save any image with alt text and page context via context menu
- **Harvest Mode** — Toggle overlay to click-capture multiple images in sequence
- **100% local** — All data stored in `chrome.storage.local`. Zero network permissions, zero tracking
- **JSON export** — One-click export of all captures as a portable JSON file
- **Harvest Inbox** (`/harvest`) — Upload the JSON export into SoupyLab, review captures, and import into datasets
- **Optional Thinktank** — Toggle 5-perspective analysis (Builder, Empath, Systems, Red Team, Frame Breaker) during import
- **Downloadable** — Extension ZIP available at `/soupylab-harvester.zip`

### 📄 White Paper Engine
Live-streaming academic documentation engine for "Curiosity-Driven Perspective Training" — the methodology behind SoupyLab's multi-perspective AI approach.

### 🖼️ Landing Page Features
- **Photo Transform** — Interactive before/after image transformation demo (1 credit per use)
- **Interactive Demo** — Try the module builder without signing up
- **Social Proof** — Community testimonials and metrics
- **Location-based Hero** — Dynamic hero images based on visitor geolocation

---

## Additional Tools

| Tool | Route | Tier | Description |
|------|-------|------|-------------|
| **Forge AI** | `/forge-ai` | Free | Context-aware AI assistant for code gen, config, and architecture |
| **Model Zoo** | `/models` | Free | Browse and compare AI models by capability and cost |
| **Signal Lab** | `/signals` | Free | Signal processing workspace |
| **Robotics** | `/robotics` | Pro | Robotics controller integration |
| **Data Pipelines** | `/pipelines` | Free | Visual data flow management |
| **Solver Library** | `/solvers` | Free | Pre-built optimization solvers |
| **Inference Playground** | `/inference` | Free | Test models with live parameter tuning |
| **Device Console** | `/console` | Free | Real-time device monitoring and logs |
| **Runs** | `/runs` | Free | Full execution audit trail with step-by-step replay |
| **SLM Lab** | `/slm-lab` | Public | Small Language Model experimentation (no auth required) |
| **Capture** | `/capture` | Free | Mobile data capture for training |
| **Harvest Inbox** | `/harvest` | Free | Import Chrome extension captures with optional perspective analysis |
| **Swipe Review** | `/review` | Free | Tinder-style data review interface |
| **Training Progress** | `/training` | Free | Monitor training job status and metrics |

---

## Pages & Routes

### Public Routes (no authentication)
| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing Page | Marketing homepage with interactive demo |
| `/pricing` | Pricing | Tier comparison and Stripe checkout |
| `/login` | Login | Email/password + Apple Sign-In |
| `/signup` | Sign Up | Email/password + Apple Sign-In |
| `/forgot-password` | Forgot Password | Password reset request |
| `/reset-password` | Reset Password | Password reset form |
| `/onboarding` | Onboarding | Post-signup guided setup |
| `/subscription-success` | Subscription Success | Post-checkout confirmation |
| `/privacy` | Privacy Policy | Legal privacy policy |
| `/terms` | Terms of Service | Legal terms |
| `/install` | Install Guide | PWA/native installation instructions |
| `/demo/module-builder` | Demo Module Builder | Try the module builder without auth |
| `/unsubscribe` | Unsubscribe | Email unsubscribe handler |
| `/slm-lab` | SLM Lab | Public SLM experimentation |

### Protected Routes (authentication required)
| Route | Page | Tier |
|-------|------|------|
| `/dashboard` | Dashboard | Free |
| `/projects` | Projects List | Free |
| `/projects/:id` | Project Detail | Free |
| `/modules` | Modules List | Free |
| `/modules/:id` | Module Builder | Free |
| `/stacks` | Stacks List | Free |
| `/stacks/:id` | Stack Canvas | Free |
| `/templates` | Templates | Free |
| `/marketplace` | Marketplace | Free |
| `/lab` | Lab | Free |
| `/lab/slicer` | Slicer Lab | Free |
| `/build-ai` | AI Builder | Free |
| `/solvers` | Solver Library | Free |
| `/engine` | Game Engine | Free |
| `/models` | Model Zoo | Free |
| `/pipelines` | Data Pipelines | Free |
| `/signals` | Signal Lab | Free |
| `/forge-ai` | Forge AI | Free |
| `/white-paper` | White Paper | Free |
| `/capture` | Capture | Free |
| `/review` | Swipe Review | Free |
| `/on-device` | On-Device Templates | Free |
| `/deploy` | Deploy Pipeline | Free |
| `/deploy/phone` | Phone Deploy Guide | Free |
| `/inference` | Inference Playground | Free |
| `/console` | Device Console | Free |
| `/self-host` | Self-Host Generator | Free |
| `/harvest` | Harvest Inbox | Free |
| `/image-forge` | Image Forge | Free |
| `/training` | Training Progress | Free |
| `/runs` | Runs | Free |
| `/admin` | Admin Panel | Admin |
| `/account` | Account Settings | Free |
| `/export` | Export Studio | Builder+ |
| `/edge-training` | Edge Training | Pro |
| `/robotics` | Robotics | Pro |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 · TypeScript · Vite · Tailwind CSS |
| **UI** | shadcn/ui · Radix Primitives · Framer Motion |
| **Backend** | Lovable Cloud · Edge Functions (Deno) |
| **Auth** | Email/password · Apple Sign-In · Email verification |
| **AI** | GPT-5 · GPT-5-mini · Gemini 2.5/3 · Lovable AI Gateway |
| **Image Gen** | Stability AI API (v2beta) |
| **Video** | Remotion (cinematic marketing videos) |
| **Payments** | Stripe (subscriptions + one-time top-ups) |
| **Mobile** | Capacitor (Android/iOS) · PWA (vite-plugin-pwa) |
| **Data** | PostgreSQL (28+ tables) · Row Level Security |
| **Fonts** | Exo 2 · Inter |
| **State** | TanStack React Query · React Context |
| **Forms** | React Hook Form · Zod validation |
| **Charts** | Recharts |
| **Export** | JSZip (self-host packages), pdfjs-dist |
| **Email** | Transactional email system with queue, templates, and suppression |

---

## Architecture

```
src/
├── components/              # Shared UI + layout
│   ├── layout/              # AppLayout, AppSidebar, CommandPalette
│   │   ├── AppLayout.tsx    # Main app shell with sidebar
│   │   ├── AppSidebar.tsx   # Navigation sidebar
│   │   └── CommandPalette.tsx # Cmd+K command palette
│   ├── terminal/            # Terminal panel with themed command system
│   │   ├── ActionCard.tsx   # Command action cards
│   │   ├── commands.ts      # Command definitions
│   │   ├── themes.ts        # Terminal color themes
│   │   └── types.ts         # Terminal type definitions
│   ├── ui/                  # shadcn/ui primitives (~50 components)
│   ├── visual-chatroom/     # Image Forge chatroom components
│   │   ├── CharacterBar.tsx # AI character selection
│   │   ├── ImageLightbox.tsx# Full-screen image viewer
│   │   ├── MessageCard.tsx  # Chat message rendering
│   │   └── types.ts         # Chatroom type definitions
│   ├── landing/             # Landing page sections
│   │   ├── ForgeDoodle.tsx  # Dynamic doodle display
│   │   ├── HowItWorksVideos.tsx
│   │   ├── InteractiveDemo.tsx
│   │   ├── PhotoTransform.tsx
│   │   └── SocialProof.tsx
│   ├── CancelFlowDialog.tsx # Subscription cancellation
│   ├── ChatHistory.tsx      # Project chat history
│   ├── CookieConsentBanner.tsx
│   ├── CreditCostEstimator.tsx
│   ├── CreditsBadge.tsx     # Credit balance display
│   ├── DiscussionThread.tsx  # Community discussions
│   ├── EasyModeWizard.tsx   # Simplified module creation
│   ├── ExportToDialog.tsx   # Export format selection
│   ├── ForgeRing.tsx        # Animated forge ring UI
│   ├── GPUSetupWizard.tsx   # GPU configuration
│   ├── IndependenceScorecard.tsx # Self-host readiness
│   ├── NavLink.tsx          # Navigation link component
│   ├── OfflineIndicator.tsx # Offline status badge
│   ├── OnboardingTour.tsx   # Guided tour overlay
│   ├── ProtectedRoute.tsx   # Auth guard wrapper
│   ├── PublishToMarketplace.tsx
│   ├── RamChecker.tsx       # RAM requirement estimator
│   ├── ReferralSection.tsx  # Referral program UI
│   ├── SEOHead.tsx          # Dynamic meta tags
│   ├── SLMModePicker.tsx    # SLM configuration
│   ├── SyncConflictDialog.tsx # Offline sync conflicts
│   ├── TerminalPanel.tsx    # Integrated terminal
│   ├── TierBadge.tsx        # Subscription tier indicator
│   ├── TierProtectedRoute.tsx # Tier-based route guard
│   ├── TourMenu.tsx         # Tour navigation menu
│   ├── TwoFactorSetup.tsx   # 2FA configuration
│   ├── UpgradePrompt.tsx    # Tier upgrade CTA
│   └── VisualChatroom.tsx   # Image Forge main chatroom
├── hooks/                   # Custom React hooks
│   ├── useAuth.tsx          # Authentication (email, Apple, OAuth)
│   ├── useCredits.ts        # Credit balance & transactions
│   ├── useCreditsGate.ts    # Credit-gated operations
│   ├── useDeployStatus.ts   # Deployment pipeline status
│   ├── useDiscussions.ts    # Discussion CRUD
│   ├── useFeatureGate.ts    # Tier-based feature gating
│   ├── useMarketplace.ts    # Marketplace operations
│   ├── useMobileCaptures.ts # Mobile capture management
│   ├── useOfflineSync.ts    # Offline data sync
│   ├── usePendingReferral.ts# Referral tracking
│   ├── useSupabaseData.ts   # Generic data fetching
│   ├── useTrainingData.ts   # Training dataset management
│   ├── use-mobile.tsx       # Mobile viewport detection
│   └── use-toast.ts         # Toast notifications
├── pages/                   # All route pages (~50 pages)
├── providers/               # Context providers
│   └── ThemeProvider.tsx    # Dark/light theme + sprite settings
├── types/                   # TypeScript type definitions
│   └── index.ts             # Core data models
├── integrations/            # External service clients
│   ├── supabase/
│   │   ├── client.ts        # Auto-generated Supabase client
│   │   └── types.ts         # Auto-generated database types
│   └── lovable/
│       └── index.ts         # Lovable Cloud auth integration
├── lib/                     # Utilities
│   ├── utils.ts             # cn() + general utilities
│   ├── chatExportParsers.ts # PDF/DOCX/PPTX parsing
│   └── offlineCache.ts      # IndexedDB offline cache
├── data/                    # Static data
│   └── on-device-slm-templates.ts
├── App.tsx                  # Root component with routing
├── App.css                  # Global styles
├── index.css                # Tailwind + design tokens
└── main.tsx                 # Entry point

remotion/                    # Cinematic video generation
├── src/
│   ├── Root.tsx             # Remotion composition root
│   ├── MainVideo.tsx        # Primary marketing video
│   ├── CascadeVideo.tsx     # Cascade animation video
│   ├── HighlightsVideo.tsx  # Feature highlights video
│   ├── constants.ts         # Video constants
│   └── scenes/              # Individual video scenes
│       ├── Scene1Awakening.tsx
│       ├── Scene2Perspectives.tsx
│       ├── Scene3Forge.tsx
│       ├── Scene4Tagline.tsx
│       ├── HighlightsIntro.tsx
│       ├── HighlightsPages.tsx
│       ├── HighlightsTraffic.tsx
│       ├── HighlightsAudience.tsx
│       └── HighlightsOutro.tsx
├── scripts/
│   └── render-remotion.mjs  # Video render script
├── package.json
└── tsconfig.json

extension/                   # SoupyLab Harvester Chrome Extension
├── manifest.json            # Manifest V3 configuration
├── background.js            # Context menu + badge management
├── content.js               # Harvest Mode overlay + capture logic
├── content.css              # Harvest Mode UI styles
├── popup.html               # Extension popup (capture list + export)
└── popup.js                 # Popup logic + JSON export

supabase/
├── config.toml              # Supabase project configuration
└── functions/               # 30+ Edge Functions (Deno)
```

---

## Database Schema

### 28+ Tables (all RLS-protected)

#### Core Application
| Table | Description |
|-------|-------------|
| `projects` | User projects (web, android, module, stack, hybrid) |
| `modules` | AI module configurations with full parameter sets |
| `stacks` | Multi-agent pipeline definitions (nodes + edges as JSON) |
| `runs` | Execution audit trail with step-by-step replay |
| `project_messages` | Persistent chat history per project |

#### User & Auth
| Table | Description |
|-------|-------------|
| `profiles` | User profiles (display name, avatar, bio, referral code) |
| `user_credits` | Credit balance, tier, monthly allowance |
| `credit_transactions` | Full credit transaction history |
| `user_api_keys` | User-managed API keys (encrypted) |

#### Training & Data
| Table | Description |
|-------|-------------|
| `training_datasets` | Dataset metadata (name, domain, format, sample count) |
| `dataset_samples` | Individual training samples with perspective columns |
| `training_jobs` | Training job status and hyperparameters |
| `cognitive_fingerprints` | AI reasoning style fingerprints |
| `founder_interviews` | Interview transcripts for data extraction |
| `perspective_jobs` | CDPT perspective processing jobs |
| `mobile_captures` | Mobile-captured training data |

#### Marketplace & Commerce
| Table | Description |
|-------|-------------|
| `marketplace_templates` | Published templates with pricing |
| `template_purchases` | Purchase records |
| `referrals` | Referral relationships |
| `referral_earnings` | Revenue share tracking |

#### Community
| Table | Description |
|-------|-------------|
| `discussions` | Threaded discussions on any target |
| `announcements` | Platform announcements |

#### Infrastructure
| Table | Description |
|-------|-------------|
| `deploy_pipeline_status` | Deployment step tracking |
| `page_views` | Analytics page view tracking |
| `forge_doodles` | Generated doodle images |
| `location_hero_images` | Geo-based hero images |

#### Email System
| Table | Description |
|-------|-------------|
| `email_send_log` | Email delivery audit log |
| `email_send_state` | Rate limiting and batch configuration |
| `email_unsubscribe_tokens` | One-click unsubscribe tokens |
| `suppressed_emails` | Suppressed/bounced email addresses |

### Views
| View | Description |
|------|-------------|
| `marketplace_templates_public` | Public-facing template listing (excludes `template_data`) |
| `profiles_public` | Public profile info (display name, avatar, bio) |

### Database Enums
- `module_type` — 12 module types (specialist, slm, router, etc.)
- `project_status` — draft, building, testing, deployed, archived
- `project_type` — web, android, module, stack, hybrid
- `run_status` — pending, running, success, failed, paused

---

## Edge Functions

| Function | Description |
|----------|-------------|
| `ai-generate` | AI completions via Lovable AI Gateway |
| `demo-ai-generate` | Public demo AI completions (no auth) |
| `stability-generate` | Image generation via Stability AI API |
| `deduct-credits` | Server-side credit deduction with balance validation |
| `purchase-credits` | One-time credit top-up Stripe checkout |
| `gift-credits` | Admin credit gifting with email notification |
| `create-checkout` | Subscription checkout session creation |
| `check-subscription` | Verify active Stripe subscription |
| `check-tier` | Server-side tier validation |
| `manage-subscription` | Subscription management operations |
| `customer-portal` | Stripe customer portal redirect |
| `stripe-webhook` | Subscription + top-up fulfillment |
| `process-referral` | Referral code processing and credit award |
| `process-chat-export` | Parse uploaded chat exports (PDF/DOCX/PPTX) |
| `founder-interview` | AI-powered founder interview for data extraction |
| `cognitive-fingerprint` | Generate reasoning style fingerprints |
| `perspective-worker` | CDPT perspective processing worker |
| `perspective-image` | Multi-perspective image generation |
| `visual-chatroom` | Image Forge chatroom AI responses |
| `scrape-for-training` | Web scraping for training data |
| `fetch-hf-dataset` | Hugging Face dataset fetching |
| `manage-api-keys` | User API key CRUD operations |
| `manage-announcements` | Admin announcement management |
| `pipeline-modes` | Pipeline execution mode configuration |
| `analyze-video-frames` | Video frame analysis for training data |
| `transform-photo` | Landing page photo transformation |
| `generate-doodle` | AI doodle generation for landing page |
| `location-hero` | Geolocation-based hero image generation |
| `send-transactional-email` | Email delivery with Resend integration |
| `process-email-queue` | Batch email queue processor |
| `preview-transactional-email` | Admin email template preview |
| `handle-email-unsubscribe` | One-click email unsubscribe |
| `handle-email-suppression` | Email bounce/complaint handler |

---

## Credit Economy

### Tier Allowances

| Tier | Monthly Credits | Price | Features |
|------|----------------|-------|----------|
| **Free** | 50 | $0 | Core features, basic AI |
| **Builder** | 500 | $29/mo | + Export Studio |
| **Pro** | 2,000 | $79/mo | + Edge Training, Robotics |

### Top-Up Packs

| Pack | Credits | Price |
|------|---------|-------|
| Starter | 100 | $4.99 |
| Builder | 500 | $19.99 |
| Pro | 1,500 | $59.99 |

### Credit Costs Per Operation

| Operation | Cost |
|-----------|------|
| Text generation (standard) | 2 credits |
| Image generation | 3 credits |
| Video analysis | 5 credits |
| Perspective image | 5 credits |
| Photo transform (landing) | 1 credit |
| Full Council Mode run | ~45 credits |
| High-density SLM sample (CDPT) | ~26–28 credits |

Credit costs vary by AI model — from 1 credit (Gemini Flash Lite) to 10 credits (GPT-5.2).

### Safety Mechanisms
- Server-side balance validation before every deduction
- `refundCredits` mechanism for failed API calls
- Full transaction audit trail in `credit_transactions`

---

## Authentication

- **Email/Password** — Standard signup with email verification
- **Apple Sign-In** — OAuth via Apple ID
- **Password Reset** — Email-based reset flow
- **Protected Routes** — `ProtectedRoute` component wraps authenticated pages
- **Tier-Protected Routes** — `TierProtectedRoute` enforces minimum subscription tier
- **Onboarding** — Guided post-signup setup flow

---

## Security

- **Row Level Security** on every table — users only see their own data
- **Server-side credit mutations** — no client-side balance writes
- **Stripe webhook verification** for all payment fulfillment
- **SECURITY DEFINER** functions for safe cross-table operations
- **Tier-protected routes** enforced both client-side and server-side
- **Encrypted API keys** — user-provided keys stored encrypted
- **Email suppression** — automatic bounce/complaint handling
- **Cookie consent** — GDPR-compliant consent banner
- **2FA support** — Two-factor authentication setup available

---

## Design System

### Theme Tokens (HSL-based)
The app uses a comprehensive semantic token system defined in `index.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 220 20% 8%;
  --primary: 185 100% 42%;        /* Teal accent */
  --accent: 25 95% 53%;           /* Orange accent */
  --muted: 220 14% 94%;
  --destructive: 0 72% 51%;
  /* ... full token set for light + dark modes */
}
```

### Fonts
- **Exo 2** — Display/heading font
- **Inter** — Body text
- Loaded via `index.html` (non-render-blocking)

### UI Components
50+ shadcn/ui primitives with custom variants. Key custom components:
- `ForgeRing` — Animated circular progress
- `FFXOrnament` — Decorative Farscape × Mass Effect themed ornaments
- `CreditsBadge` — Live credit balance indicator
- `TierBadge` — Subscription tier display
- `TerminalPanel` — Themed interactive terminal

### Aesthetic
Farscape × Mass Effect light aesthetic — futuristic but accessible, with teal primary and orange accent colors. Supports full dark mode via `ThemeProvider`.

---

## Local Development

```bash
npm install
npm run dev
```

### Remotion Videos

```bash
cd remotion
bun install
bun run build     # Render videos
```

### Mobile (Capacitor)

```bash
npx cap add android    # or ios
npm run build
npx cap sync
npx cap run android    # or ios
```

### PWA Installation
The app is a Progressive Web App. Install from:
- **Android Chrome**: Menu → "Add to Home Screen"
- **iOS Safari**: Share → "Add to Home Screen"
- **Desktop Chrome**: Click install icon in address bar

See [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) for detailed native mobile and desktop build instructions.

---

## License

Proprietary — All rights reserved.
