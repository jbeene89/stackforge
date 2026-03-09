

# StackForge AI — Implementation Plan

## Constraints & Adaptations
- **React/Vite** (not Next.js) — file-based routing via react-router-dom
- **No real AI backend** — simulated with mock services and placeholder integration points
- **No native mobile compilation** — Android apps previewed via device-frame simulator
- **No real-time collaboration** — UI placeholders only for MVP

## Phase 1: Foundation & Shell (First Build)

### 1. Design System & Theme
- Dark/light mode via `next-themes` (already installed)
- Glassmorphism utility classes, gradient accents, futuristic color palette
- Update CSS variables: deep navy/slate dark mode, clean light mode
- Add custom keyframe animations (fade-in, slide-up, glow pulse)

### 2. Layout & Routing
Create all routes in `App.tsx` with a shared layout shell:

```text
/                 → Landing page
/pricing          → Pricing page  
/login            → Auth (login)
/signup           → Auth (signup)
/onboarding       → Post-signup wizard
/dashboard        → Main dashboard
/projects/:id     → Project workspace (tabs: Preview/Code/Components/DB/Settings/Runs)
/modules          → AI modules list
/modules/:id      → Module builder
/stacks           → Stacks list
/stacks/:id       → Stack orchestration canvas
/templates        → Templates gallery
/lab              → Testing lab
/runs             → Execution log viewer
/admin            → Admin panel
/account          → Account/billing/settings
```

Shared components: `AppSidebar`, `TopNav`, `CommandPalette`

### 3. Core Data Layer
- `src/types/` — TypeScript interfaces for all 25+ data models (Project, Module, Stack, StackNode, StackEdge, TestRun, etc.)
- `src/data/` — Mock data files with 5 demo projects (Marine Estimator Stack, Inventor Think Tank, Medical QA, Field Inspection App, Contractor Dashboard)
- `src/services/` — Mock service layer with clear integration points for real LLM providers
- `src/hooks/` — Custom hooks for data access (`useProjects`, `useModules`, `useStacks`)

## Phase 2: Landing, Auth & Dashboard

### 4. Landing Page
- Hero with animated gradient + tagline
- Feature grid (4 pillars: Web Apps, Android Apps, AI Modules, AI Stacks)
- Demo showcase carousel with screenshots
- Templates preview section
- Pricing preview cards
- Testimonials placeholders
- CTA buttons

### 5. Auth Pages
- Login/Signup forms (UI only, no Supabase yet)
- Forgot password page
- Social login button placeholders (Google, GitHub)
- Mock auth context for navigation

### 6. Onboarding Wizard
- Multi-step: "What do you want to build?" selector
- Options: Web App, Android App, AI Module, AI Stack, Internal Tool, Research Workflow
- Recommended starter templates based on selection

### 7. Dashboard
- Project cards with thumbnails, status badges, type icons, version counts
- Filter tabs: All / Web / Android / AI Module / Stack / Hybrid
- Quick actions: Create, Duplicate, Rename, Archive, Delete
- Recent modules, stacks, templates, test runs sections

## Phase 3: Builders

### 8. Web App Builder (`/projects/:id`)
- Tabbed workspace: Preview / Code / Components / Database / Settings / Runs
- Prompt input bar for describing desired app
- Mock generation that loads pre-built demo app templates
- File tree + code editor panel with syntax highlighting (using a `<pre>` based viewer)
- Live preview iframe placeholder
- Schema builder for entities (users, leads, tasks, etc.)
- Mock CRUD generation

### 9. Android App Builder
- Same workspace layout with device-frame preview (simulated phone bezel)
- Screen navigator for multi-screen apps
- Component palette (mobile-specific: lists, cards, FABs, bottom nav)
- Export as ZIP placeholder
- Architecture selector: Flutter / React Native / Kotlin (labels, not real compilation)

### 10. AI Module Builder (`/modules/:id`)
- Full config form: name, role, system prompt, goal, task boundaries, inputs/outputs, output format, tone, temperature, creativity slider, constraints, guardrails
- SLM-mode toggle (deterministic, low-context, concise, domain-limited)
- Memory toggle, tool access toggle
- Provider/model selector placeholder
- Live test panel (mock responses)
- Version history sidebar

### 11. Stack Orchestration Canvas (`/stacks/:id`)
- Visual node-based canvas (custom implementation with drag/drop/zoom)
- Node types: Specialist, Router, Evaluator, Critic, Comparator, Formatter, Extractor, Classifier, Human Gate, Synthesizer
- Edge connections showing data flow
- Node inspector panel (click to view config, input/output)
- Support for sequential, branching, parallel, conditional, retry/loop flows
- Toolbar: add node, connect, zoom, save, run, export

## Phase 4: Testing, Tracing & Versioning

### 12. Testing Lab (`/lab`)
- Test single module or full stack
- Input panel + output panel + intermediate steps
- Benchmark scenario save/load
- Side-by-side version comparison
- Pass/fail labeling
- Re-run from specific node

### 13. Execution Tracing (`/runs`)
- Run log table with status, timing, version
- Click into run → step-by-step trace view
- Each step shows: input received, output produced, settings used, timing
- Failure/hallucination indicators
- Audit log of human interventions

### 14. Versioning
- Version list per project/module/stack
- Diff viewer (text-based)
- Restore / Fork actions
- Version quality tracking (linked to test results)

## Phase 5: Templates, Export & Admin

### 15. Templates Gallery (`/templates`)
- Categories: Web Apps, Android Apps, AI Modules, Stacks
- Pre-seeded templates (CRM, Estimator, Dashboard, Field Inspection, etc.)
- One-click "Use Template" → creates new project

### 16. Exports
- Export buttons on projects, modules, stacks
- Mock download: ZIP, JSON, prompt pack, architecture diagram
- "Deploy" mock flow with status indicators

### 17. Pricing Page
- Three tiers: Free, Pro, Team
- Feature comparison table
- Stripe-ready CTA buttons

### 18. Admin Panel (`/admin`)
- User management table
- Usage metrics cards
- Module/stack run logs
- Feature flags toggles
- System health placeholders

### 19. Account/Settings (`/account`)
- Profile editor
- Billing section (Stripe placeholder)
- Workspace management
- Collaboration: invite members, roles (owner/editor/reviewer/viewer)

## File Organization

```text
src/
├── components/
│   ├── layout/          (AppSidebar, TopNav, AppLayout)
│   ├── landing/         (Hero, Features, Pricing, Testimonials)
│   ├── dashboard/       (ProjectCard, FilterTabs, QuickActions)
│   ├── builder/         (PromptBar, FileTree, CodeViewer, PreviewFrame)
│   ├── modules/         (ModuleForm, ModuleCard, SLMToggle)
│   ├── stacks/          (Canvas, StackNode, StackEdge, NodeInspector)
│   ├── mobile/          (DeviceFrame, ScreenNavigator)
│   ├── lab/             (TestRunner, BenchmarkPanel, CompareView)
│   ├── templates/       (TemplateCard, TemplateGallery)
│   ├── admin/           (UserTable, MetricsCards, FeatureFlags)
│   └── ui/              (existing shadcn components)
├── pages/               (all route pages)
├── types/               (all TypeScript interfaces)
├── data/                (mock data, demo projects, seed content)
├── services/            (mock AI service, mock generation engine)
├── hooks/               (custom data hooks)
├── lib/                 (utils, constants)
└── providers/           (ThemeProvider, AuthProvider, MockDataProvider)
```

## Implementation Order
1. Theme, layout shell, routing, types, mock data
2. Landing page, auth pages, onboarding
3. Dashboard with filtering and CRUD actions
4. AI Module builder with full config form
5. Stack orchestration canvas
6. Web app builder workspace
7. Android app builder with device preview
8. Testing lab and execution tracing
9. Templates gallery, exports, versioning
10. Pricing, admin, account/settings pages

This will be built incrementally across multiple messages given the scope. Each step produces working, navigable UI with demo data.

