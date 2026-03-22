# Soupy Lab

**Design AI agents. Wire them into pipelines. Ship to any device.**

Soupy Lab is a visual, full-stack AI platform for building, testing, and deploying AI-powered applications — all from your browser. No ML expertise required.

🌐 **Live** → [soupylab.com](https://soupylab.com)

---

## Why Soupy Lab?

Most AI tools are wrappers around a single model. Soupy Lab is different — you design the **reasoning chain**:

1. **Pick your models** — GPT-5, Gemini Pro, open-source SLMs
2. **Set guardrails** — tone, task boundaries, output format, constraints
3. **Wire nodes into stacks** — multi-agent pipelines with routing, evaluation, and memory
4. **Deploy anywhere** — web, Android, edge devices, or self-hosted

---

## Core Features

### 🧠 AI Module Builder
Create configurable AI agents with system prompts, guardrails, task boundaries, and model selection. 12 module types: specialist · SLM · router · evaluator · critic · comparator · formatter · extractor · classifier · memory-filter · human-gate · synthesizer.

### 🔗 Stack Canvas
Visual multi-agent pipeline editor. Connect modules with conditional edges, parallel branches, and data routing.

### 🎨 Image Forge
Multi-perspective creative studio applying Cognitive Dense Perspective Training (CDPT) to image generation. Council Mode for AI-enriched prompts, Free Mode for interactive visual chatrooms.

### 🚀 Projects & Deploy
Full project lifecycle — web apps, Android apps, AI modules, stacks, and hybrids. AI-powered prompt interface with streaming progress and persistent chat history. One-click Android deployment pipeline.

### 🧪 Lab & Slicer Lab
Interactive testing environment. Run test cases, inspect step-by-step execution, compare outputs across module configurations.

### 🏪 Marketplace
Publish and discover community-built templates. Buy and sell modules, stacks, and project templates using credits.

### 📦 Export Studio
Export to Unity, Unreal Engine, ROS 2, Arduino, and Python with auto-generated, domain-specific code.

### 📡 Edge & On-Device
SLM mode for local model execution. On-device templates, edge training, and inference playground for running models directly on phones.

### 📄 White Paper Engine
Live-streaming academic documentation engine for "Curiosity-Driven Perspective Training" — the methodology behind StackForge's multi-perspective AI approach.

---

## Additional Tools

| Tool | Description |
|------|-------------|
| **Forge AI** | Context-aware AI assistant for code gen, config, and architecture |
| **Model Zoo** | Browse and compare AI models by capability and cost |
| **Signal Lab** | Signal processing workspace |
| **Robotics** | Robotics controller integration (Pro tier) |
| **Data Pipelines** | Visual data flow management |
| **Solver Library** | Pre-built optimization solvers |
| **Inference Playground** | Test models with live parameter tuning |
| **Device Console** | Real-time device monitoring and logs |
| **Runs** | Full execution audit trail with step-by-step replay |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS |
| UI | shadcn/ui · Radix Primitives · Framer Motion |
| Backend | Lovable Cloud · Edge Functions |
| Auth | Email/password with verification |
| AI | GPT-5 · Gemini 2.5/3 · Lovable AI Gateway |
| Payments | Stripe (Free / Builder $29 / Pro $79) + credit top-ups |
| Mobile | Capacitor (Android/iOS) · PWA |
| Fonts | Cinzel · Rajdhani · JetBrains Mono |

---

## Architecture

```
src/
├── components/         # Shared UI + layout (sidebar, command palette, terminal)
│   ├── layout/         # AppLayout, AppSidebar, CommandPalette
│   ├── terminal/       # Terminal panel with themed command system
│   ├── ui/             # shadcn/ui primitives
│   └── visual-chatroom/# Image Forge chatroom components
├── hooks/              # Auth, credits, feature gates, offline sync, data hooks
├── pages/              # All route pages (~45 pages)
├── providers/          # Theme + sprite settings
├── types/              # Core TypeScript models
├── integrations/       # Supabase client & auto-generated types
├── lib/                # Utilities, export parsers, offline cache
└── data/               # Mock data, SLM templates

supabase/
└── functions/          # 18 edge functions
    ├── ai-generate     # AI completions via gateway
    ├── deduct-credits  # Server-side credit deduction
    ├── purchase-credits# One-time credit top-up checkout
    ├── create-checkout # Subscription checkout sessions
    ├── stripe-webhook  # Subscription + top-up fulfillment
    ├── check-subscription / check-tier
    ├── process-referral / process-chat-export
    ├── founder-interview / cognitive-fingerprint
    ├── perspective-worker / perspective-image
    ├── visual-chatroom / scrape-for-training
    ├── fetch-hf-dataset / manage-api-keys
    ├── pipeline-modes / analyze-video-frames
    └── customer-portal
```

### Database (20 tables, all RLS-protected)

`projects` · `modules` · `stacks` · `runs` · `profiles` · `user_credits` · `credit_transactions` · `marketplace_templates` · `template_purchases` · `discussions` · `project_messages` · `training_datasets` · `dataset_samples` · `training_jobs` · `founder_interviews` · `cognitive_fingerprints` · `perspective_jobs` · `deploy_pipeline_status` · `mobile_captures` · `referrals` · `referral_earnings` · `user_api_keys`

---

## Credit Economy

| Tier | Monthly Credits | Price |
|------|----------------|-------|
| Free | 50 | $0 |
| Builder | 500 | $29/mo |
| Pro | 2,000 | $79/mo |

**Top-up packs**: 100 credits ($4.99) · 500 credits ($19.99) · 1,500 credits ($59.99)

Credits are consumed per AI run — costs vary by model from 1 credit (Gemini Flash Lite) to 10 credits (GPT-5.2).

---

## Security

- **Row Level Security** on every table — users only see their own data
- **Server-side credit mutations** — no client-side balance writes
- **Stripe webhook verification** for all payment fulfillment
- **SECURITY DEFINER** functions for safe cross-table operations
- **Tier-protected routes** enforced both client-side and server-side

---

## Local Development

```bash
npm install
npm run dev
```

See [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) for native mobile builds (Capacitor), desktop builds (Electron), and PWA installation.

---

## License

Proprietary — All rights reserved.
