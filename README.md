# SoupyForge

**AI-Powered Development Platform** — Build, test, and deploy AI modules, multi-agent stacks, web apps, and Android apps from a single workspace.

🌐 **Live**: [stackforge.lovable.app](https://stackforge.lovable.app)

---

## What is SoupyForge?

SoupyForge is a full-stack AI development platform that lets you design AI agents, chain them into multi-agent pipelines, and ship production-ready applications — all from your browser.

## Key Features

### 🧠 AI Module Builder
Create configurable AI agents with system prompts, guardrails, task boundaries, temperature controls, and model selection. Supports 12 module types: specialist, SLM, router, evaluator, critic, comparator, formatter, extractor, classifier, memory-filter, human-gate, and synthesizer.

### 🔗 Stack Canvas
Design multi-agent pipelines visually. Connect modules with conditional edges, parallel branches, and data routing to build complex AI workflows.

### 🚀 Projects
Full project lifecycle management — create web apps, Android apps, AI modules, stacks, and hybrid projects. Each project includes an AI-powered prompt interface with real-time streaming progress and persistent chat history.

### 🧪 Lab & Slicer Lab
Experiment with AI modules and stacks in an interactive testing environment. Run test cases, inspect step-by-step execution, and compare outputs.

### 🏪 Marketplace
Publish and discover community-built templates. Buy and sell modules, stacks, and project templates using the built-in credit system.

### 📦 Export Studio
Export your work to external platforms including Unity, Unreal Engine, ROS 2, Arduino, and Python with auto-generated, domain-specific code.

### 🤖 Forge AI Assistant
Context-aware AI chat for code generation, module configuration, stack architecture, and general development assistance.

### 📊 Additional Tools
- **Model Zoo** — Browse and compare AI models
- **Data Pipelines** — Visual data flow management
- **Signal Lab** — Signal processing workspace
- **Robotics** — Robotics integration tools
- **Edge Training** — On-device model training
- **Solver Library** — Pre-built optimization solvers
- **Game Engine** — Game development workspace
- **Runs** — Execution history and audit logs

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS |
| UI | shadcn/ui · Radix Primitives · Framer Motion |
| Backend | Lovable Cloud (Supabase) · Edge Functions |
| Auth | Email/password with email verification · Google OAuth |
| AI | Gemini Flash via Lovable AI Gateway |
| Payments | Stripe (3-tier: Free / Builder $29 / Pro $79) |
| Mobile | Capacitor (Android/iOS) · PWA |
| Fonts | Space Grotesk · JetBrains Mono |

---

## Architecture

```
src/
├── components/       # Shared UI components + layout
├── hooks/            # Auth, credits, feature gates, data hooks
├── pages/            # All route pages
├── providers/        # Theme provider
├── types/            # Core TypeScript models
├── integrations/     # Supabase client & types
└── data/             # Mock data for development

supabase/
└── functions/        # Edge functions (ai-generate, deduct-credits, stripe-webhook, etc.)
```

### Database Tables
`projects` · `modules` · `stacks` · `runs` · `profiles` · `user_credits` · `credit_transactions` · `marketplace_templates` · `template_purchases` · `discussions` · `project_messages` · `referrals` · `referral_earnings` · `user_api_keys`

All tables use Row Level Security (RLS) for data isolation.

---

## Credit System

| Tier | Monthly Credits | Price |
|------|----------------|-------|
| Free | 50 | $0 |
| Builder | 500 | $29/mo |
| Pro | 2,000 | $79/mo |

Credits are consumed per AI generation, with costs varying by model (1–10 credits per call).

---

## Local Development

```bash
npm install
npm run dev
```

See [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) for native mobile builds (Capacitor), desktop builds (Electron), and PWA installation instructions.

---

## License

Proprietary — All rights reserved.
