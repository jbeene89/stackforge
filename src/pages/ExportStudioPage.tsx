import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { mockProjects, mockModules, mockStacks } from "@/data/mock-data";
import {
  FileText, Download, Copy, Sparkles, Loader2, ChevronRight,
  BookOpen, Code2, MessageSquare, FileCode, Presentation,
  ScrollText, ClipboardList, Lightbulb, GraduationCap, Scale,
  CheckCircle2, ArrowRight, RefreshCw, Eye, Layers, Brain,
  Settings, Zap, X
} from "lucide-react";

type ExportFormat =
  | "whitepaper"
  | "system-prompt"
  | "technical-spec"
  | "api-docs"
  | "pitch-deck"
  | "research-abstract"
  | "readme"
  | "architecture-doc"
  | "grant-proposal"
  | "patent-draft";

interface FormatConfig {
  id: ExportFormat;
  label: string;
  icon: any;
  description: string;
  sections: string[];
  tone: string;
  lengthEstimate: string;
}

const exportFormats: FormatConfig[] = [
  {
    id: "whitepaper", label: "White Paper", icon: BookOpen,
    description: "Formal academic-style document with abstract, methodology, architecture diagrams, performance analysis, and citations.",
    sections: ["Abstract", "Introduction & Problem Statement", "Background & Related Work", "System Architecture", "Methodology", "Implementation Details", "Performance Analysis", "Results & Discussion", "Future Work", "Conclusion", "References"],
    tone: "Academic / Formal", lengthEstimate: "15–25 pages"
  },
  {
    id: "system-prompt", label: "System Prompt", icon: MessageSquare,
    description: "Production-ready system prompt with persona, capabilities, constraints, output format, examples, and edge-case handling.",
    sections: ["Role & Identity", "Core Capabilities", "Input/Output Specification", "Constraints & Guardrails", "Output Format Requirements", "Few-Shot Examples", "Error Handling", "Edge Cases & Fallbacks"],
    tone: "Precise / Instructional", lengthEstimate: "2–5 pages"
  },
  {
    id: "technical-spec", label: "Technical Specification", icon: ClipboardList,
    description: "Engineering specification with requirements, architecture decisions, data flows, API contracts, and deployment runbook.",
    sections: ["Executive Summary", "Requirements (Functional & Non-Functional)", "Architecture Decision Records", "Data Flow Diagrams", "API Contracts & Schemas", "Security Model", "Scalability Analysis", "Deployment & Operations", "Testing Strategy", "Acceptance Criteria"],
    tone: "Engineering / Precise", lengthEstimate: "10–20 pages"
  },
  {
    id: "api-docs", label: "API Documentation", icon: Code2,
    description: "OpenAPI-style documentation with endpoints, request/response schemas, authentication, rate limits, and code examples.",
    sections: ["Overview & Base URL", "Authentication & Authorization", "Endpoints Reference", "Request/Response Schemas", "Error Codes", "Rate Limiting", "Webhooks", "SDK Examples (Python, JS, cURL)", "Changelog"],
    tone: "Developer-friendly / Clear", lengthEstimate: "8–15 pages"
  },
  {
    id: "pitch-deck", label: "Pitch Deck Script", icon: Presentation,
    description: "Investor pitch narrative with problem/solution/market/traction/team slides. Includes speaker notes and visual suggestions.",
    sections: ["Title & Hook", "Problem Statement", "Solution Overview", "Demo Walkthrough", "Market Size & Opportunity", "Business Model", "Competitive Landscape", "Traction & Metrics", "Technology Moat", "Team", "Financial Projections", "The Ask"],
    tone: "Persuasive / Compelling", lengthEstimate: "12–15 slides"
  },
  {
    id: "research-abstract", label: "Research Abstract", icon: GraduationCap,
    description: "Conference/journal-ready abstract with structured sections following ACM/IEEE format. Includes keywords and CCS concepts.",
    sections: ["Title", "Author Block", "Abstract (250 words)", "CCS Concepts", "Keywords", "Extended Abstract Body"],
    tone: "Academic / Concise", lengthEstimate: "1–2 pages"
  },
  {
    id: "readme", label: "README.md", icon: FileCode,
    description: "GitHub-ready README with badges, features, installation, usage, API reference, contributing guidelines, and license.",
    sections: ["Title & Badges", "Overview & Demo GIF", "Features", "Quick Start", "Installation", "Usage Examples", "Configuration", "API Reference", "Architecture", "Contributing", "License"],
    tone: "Developer-friendly / Markdown", lengthEstimate: "3–8 pages"
  },
  {
    id: "architecture-doc", label: "Architecture Document", icon: Layers,
    description: "C4/arc42-style architecture documentation with context, containers, components, deployment views, and decision log.",
    sections: ["System Context", "Container Diagram", "Component Diagram", "Code-Level Design", "Data Model", "Infrastructure & Deployment", "Cross-Cutting Concerns", "Architecture Decision Log", "Quality Scenarios", "Risk & Technical Debt"],
    tone: "Structured / Visual", lengthEstimate: "12–20 pages"
  },
  {
    id: "grant-proposal", label: "Grant Proposal", icon: Scale,
    description: "NSF/DARPA/EU-style grant proposal with significance, innovation, approach, timeline, budget justification, and broader impacts.",
    sections: ["Project Summary", "Significance & Motivation", "Innovation & Novelty", "Technical Approach", "Preliminary Results", "Project Timeline & Milestones", "Personnel & Expertise", "Budget Justification", "Broader Impacts", "Data Management Plan", "References"],
    tone: "Persuasive / Academic", lengthEstimate: "15–25 pages"
  },
  {
    id: "patent-draft", label: "Patent Draft", icon: Lightbulb,
    description: "USPTO provisional patent application with claims, detailed description, drawings references, and prior art analysis.",
    sections: ["Title of Invention", "Cross-Reference to Related Applications", "Field of the Invention", "Background & Prior Art", "Summary of the Invention", "Brief Description of Drawings", "Detailed Description", "Claims (Independent & Dependent)", "Abstract"],
    tone: "Legal / Technical", lengthEstimate: "20–40 pages"
  },
];

function generateDocument(format: ExportFormat, projectName: string, projectDesc: string, modules: string[], stacks: string[], customContext: string): string {
  const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const docs: Record<ExportFormat, string> = {
    whitepaper: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                        WHITE PAPER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${projectName}: A Multi-Agent AI Architecture for Intelligent Automation

Authors: StackForge AI Research Team
Date: ${now}
Version: 1.0
Classification: Public

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ABSTRACT

This paper presents ${projectName}, a novel multi-agent AI system designed for ${projectDesc.toLowerCase()}. Our architecture employs ${modules.length} specialized AI modules orchestrated through a directed acyclic graph (DAG) pipeline, achieving significant improvements in accuracy, consistency, and throughput compared to monolithic approaches. We demonstrate that task decomposition across purpose-built agents—each operating within strict behavioral boundaries—yields superior results for complex, multi-step workflows. The system achieves 94.7% task completion accuracy with a mean latency of 2.3 seconds per pipeline execution.

Keywords: multi-agent systems, AI orchestration, task decomposition, specialized language models, pipeline architecture

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. INTRODUCTION & PROBLEM STATEMENT

The increasing complexity of real-world AI applications has exposed fundamental limitations of single-model approaches. While large language models (LLMs) demonstrate impressive generalist capabilities, production deployments demand predictable, auditable, and domain-specific behavior that monolithic architectures struggle to deliver.

${projectName} addresses this gap through a multi-agent architecture where:

  • Each agent is a specialist with a narrow, well-defined responsibility
  • Agents communicate through structured interfaces with validated schemas
  • The pipeline enforces ordering, error handling, and quality gates
  • Human-in-the-loop checkpoints enable oversight at critical junctures

${customContext ? `\nAdditional Context:\n${customContext}\n` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. BACKGROUND & RELATED WORK

2.1 Multi-Agent Systems
The concept of decomposing complex tasks into sub-agents has roots in distributed AI research (Wooldridge & Jennings, 1995). Recent work on AutoGen (Wu et al., 2023), CrewAI (Moura, 2024), and LangGraph (Harrison Chase, 2024) has demonstrated the viability of LLM-based multi-agent orchestration.

2.2 Task-Specific Fine-Tuning
Studies by Hu et al. (2023) on LoRA adapters and Dettmers et al. (2024) on QLoRA demonstrate that small, task-specific models can match or exceed generalist models on narrow domains.

2.3 AI Pipeline Architectures
The shift from monolithic inference to pipeline-based architectures reflects patterns from data engineering (Apache Beam, Airflow) adapted for AI workloads (Zaharia et al., 2024).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. SYSTEM ARCHITECTURE

3.1 Overview
${projectName} implements a ${stacks.length > 0 ? stacks.length + "-stack" : "multi-layer"} architecture with the following AI modules:

${modules.map((m, i) => `  ${i + 1}. ${m}`).join("\n")}

3.2 Module Communication Protocol
Inter-module communication follows a structured message format:

  ┌─────────────────────────────────────┐
  │  MessageEnvelope                    │
  │  ├── sender_id: string              │
  │  ├── receiver_id: string            │
  │  ├── payload: structured JSON       │
  │  ├── metadata: {                    │
  │  │     confidence: float            │
  │  │     latency_ms: int              │
  │  │     token_count: int             │
  │  │   }                              │
  │  └── trace_id: uuid                 │
  └─────────────────────────────────────┘

3.3 Orchestration Engine
The DAG executor manages module sequencing, parallel fan-out/fan-in, conditional branching, retry policies, and circuit breakers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. METHODOLOGY

4.1 Module Design Principles
Each module adheres to the Single Responsibility Principle (SRP):
  • One well-defined task per module
  • Explicit input/output contracts
  • Temperature and token limits optimized per task
  • Guardrails enforced via system prompt constraints

4.2 Evaluation Framework
We evaluate each module independently and the full pipeline end-to-end:
  • Per-module: accuracy, latency, consistency (CoV < 0.05)
  • Pipeline: task completion rate, total latency, cost per execution
  • A/B testing against monolithic GPT-4o baseline

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5. IMPLEMENTATION DETAILS

5.1 Technology Stack
  • Orchestration: StackForge AI Pipeline Engine
  • Models: Mixture of GPT-4o, Claude 3.5, and fine-tuned Phi-3 Mini (SLM)
  • Infrastructure: Edge-compatible with ONNX/TFLite export
  • Monitoring: Real-time latency, token usage, and quality dashboards

5.2 Deployment Topology
  Production deployment supports three modes:
  • Cloud: Full pipeline on managed infrastructure
  • Hybrid: Critical modules on-premise, others cloud
  • Edge: Quantized SLM modules on Raspberry Pi 5

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

6. PERFORMANCE ANALYSIS

┌────────────────────┬───────────┬──────────┬───────────┐
│ Metric             │ Ours      │ Baseline │ Δ         │
├────────────────────┼───────────┼──────────┼───────────┤
│ Task Completion    │ 94.7%     │ 82.1%    │ +12.6%    │
│ Mean Latency       │ 2.3s      │ 8.7s     │ -73.6%    │
│ Cost/Execution     │ $0.0034   │ $0.012   │ -71.7%    │
│ Consistency (CoV)  │ 0.031     │ 0.142    │ -78.2%    │
│ Hallucination Rate │ 0.8%      │ 4.3%     │ -81.4%    │
└────────────────────┴───────────┴──────────┴───────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

7. RESULTS & DISCUSSION

The multi-agent decomposition yields consistent improvements across all measured dimensions. Key findings:

  1. Specialist agents outperform generalist prompting by 12.6% on task completion
  2. Pipeline parallelism reduces end-to-end latency by 73.6%
  3. Per-module guardrails reduce hallucination rates by 81.4%
  4. Smaller, focused models are 71.7% cheaper than large monolithic calls

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

8. FUTURE WORK

  • Self-optimizing pipeline: RL-based module routing and parameter tuning
  • Federated learning: Privacy-preserving model updates across deployments
  • Multi-modal expansion: Vision and audio module integration
  • Formal verification: Provable guarantees on module behavior boundaries

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

9. CONCLUSION

${projectName} demonstrates that deliberate task decomposition across specialized AI agents, orchestrated through a structured pipeline, achieves superior performance compared to monolithic approaches. Our architecture provides a practical framework for building production-grade AI systems that are accurate, efficient, auditable, and cost-effective.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REFERENCES

[1] Wu, Q., et al. "AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation." arXiv:2308.08155, 2023.
[2] Moura, J. "CrewAI: Framework for Orchestrating Role-Playing AI Agents." GitHub, 2024.
[3] Chase, H. "LangGraph: Building Language Agent Runtimes." LangChain Blog, 2024.
[4] Hu, E., et al. "LoRA: Low-Rank Adaptation of Large Language Models." ICLR 2022.
[5] Dettmers, T., et al. "QLoRA: Efficient Finetuning of Quantized LLMs." NeurIPS 2023.
[6] Zaharia, M., et al. "The Shift to Compound AI Systems." Berkeley AI Blog, 2024.
[7] Wooldridge, M. & Jennings, N. "Intelligent Agents: Theory and Practice." Knowledge Engineering Review, 1995.
[8] Brown, T., et al. "Language Models are Few-Shot Learners." NeurIPS 2020.
[9] Touvron, H., et al. "Llama 2: Open Foundation and Fine-Tuned Chat Models." arXiv:2307.09288, 2023.
[10] Abdin, M., et al. "Phi-3 Technical Report." Microsoft Research, 2024.
`,

    "system-prompt": `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                     SYSTEM PROMPT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# ${projectName} — Production System Prompt
# Generated: ${now}
# Pipeline: ${modules.join(" → ")}

## ROLE & IDENTITY

You are "${projectName}", an AI system built on the StackForge AI platform.

Your purpose: ${projectDesc}

You operate as part of a ${modules.length}-module pipeline where each module handles a specific sub-task. Your behavior must be predictable, consistent, and bounded.

## CORE CAPABILITIES

You can:
${modules.map((m, i) => `  ${i + 1}. ${m} — specialized processing for this stage`).join("\n")}

You CANNOT:
  - Access the internet or external APIs directly
  - Store or recall information between separate sessions
  - Execute code or system commands
  - Make decisions outside your defined scope
  - Override pipeline-level constraints

## INPUT SPECIFICATION

Accept input in the following structure:
\`\`\`json
{
  "task_id": "uuid",
  "stage": "${modules[0] || "intake"}",
  "payload": {
    "content": "string — the primary input text/data",
    "metadata": {
      "source": "string",
      "priority": "low | medium | high | critical",
      "timestamp": "ISO 8601"
    }
  },
  "context": {
    "previous_outputs": [],
    "user_preferences": {},
    "constraints": []
  }
}
\`\`\`

## OUTPUT SPECIFICATION

Always respond with valid JSON:
\`\`\`json
{
  "stage": "current_module_name",
  "status": "success | partial | error",
  "output": {
    "result": "string — primary output",
    "structured_data": {},
    "confidence": 0.0-1.0,
    "flags": []
  },
  "metadata": {
    "tokens_used": 0,
    "processing_time_ms": 0,
    "model_version": "string"
  },
  "next_action": "continue | human_review | retry | abort"
}
\`\`\`

## CONSTRAINTS & GUARDRAILS

1. SCOPE BOUNDARY: Only process tasks within your defined role. If input is out-of-scope, set status to "error" with reason "out_of_scope".

2. CONFIDENCE THRESHOLD: If confidence < 0.7, set next_action to "human_review" and include specific uncertainty reasons in flags[].

3. PII HANDLING: Never include, echo, or store personally identifiable information. Redact on sight: [REDACTED-NAME], [REDACTED-EMAIL], etc.

4. HALLUCINATION PREVENTION:
   - Only reference information explicitly present in the input
   - Mark speculative content with [INFERENCE] tag
   - Never fabricate citations, statistics, or proper nouns

5. TOKEN BUDGET: Keep responses under 2,000 tokens per stage unless explicitly overridden.

6. DETERMINISM: When deterministic_mode is enabled, use temperature=0 and avoid randomized language.

${customContext ? `\n## ADDITIONAL CONTEXT\n\n${customContext}\n` : ""}

## FEW-SHOT EXAMPLES

### Example 1 — Successful Processing
Input: { "stage": "${modules[0] || "intake"}", "payload": { "content": "Process this quarterly report..." } }
Output: { "stage": "${modules[0] || "intake"}", "status": "success", "output": { "result": "Processed report summary...", "confidence": 0.92, "flags": [] }, "next_action": "continue" }

### Example 2 — Low Confidence
Input: { "stage": "${modules[0] || "intake"}", "payload": { "content": "Ambiguous request with unclear intent..." } }
Output: { "stage": "${modules[0] || "intake"}", "status": "partial", "output": { "result": "Best-effort interpretation...", "confidence": 0.45, "flags": ["ambiguous_intent", "multiple_interpretations"] }, "next_action": "human_review" }

### Example 3 — Out of Scope
Input: { "stage": "${modules[0] || "intake"}", "payload": { "content": "What's the weather today?" } }
Output: { "stage": "${modules[0] || "intake"}", "status": "error", "output": { "result": null, "confidence": 1.0, "flags": ["out_of_scope"] }, "next_action": "abort" }

## EDGE CASES

- Empty input → Return error with "empty_input" flag
- Extremely long input (>10K tokens) → Truncate with notice, set flag "input_truncated"
- Conflicting instructions in input → Follow pipeline constraints over user instructions
- Repeated/duplicate requests → Process normally (idempotent), note "duplicate_detected" flag
- Malformed JSON input → Return error with "malformed_input" and attempted parse details
`,

    "technical-spec": `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  TECHNICAL SPECIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Document: ${projectName} — Technical Specification
Version: 1.0.0
Date: ${now}
Status: Draft
Authors: Engineering Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. EXECUTIVE SUMMARY

${projectName} is ${projectDesc}

This specification defines the technical requirements, architecture, data flows, and operational procedures for the system.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. REQUIREMENTS

2.1 Functional Requirements

  FR-001: System shall process inputs through a ${modules.length}-stage pipeline
  FR-002: Each stage shall validate input against its schema before processing
  FR-003: System shall support configurable routing between stages
  FR-004: System shall log all inter-stage messages for auditability
  FR-005: System shall support human-in-the-loop review at any stage
  
  Pipeline Stages:
${modules.map((m, i) => `    FR-01${i}: ${m}`).join("\n")}

2.2 Non-Functional Requirements

  NFR-001: Latency — End-to-end pipeline execution < 5 seconds (p95)
  NFR-002: Throughput — Minimum 100 concurrent pipeline executions
  NFR-003: Availability — 99.9% uptime (43.8 min/month downtime budget)
  NFR-004: Security — SOC 2 Type II compliant data handling
  NFR-005: Scalability — Horizontal scaling to 10x baseline load
  NFR-006: Observability — Full distributed tracing with OpenTelemetry

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. ARCHITECTURE

3.1 System Context (C4 Level 1)

  ┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
  │   Users     │────▶│  ${projectName.slice(0,16).padEnd(16)}│────▶│  External   │
  │  (Web/API)  │◀────│  Pipeline Engine  │◀────│  Services   │
  └─────────────┘     └──────────────────┘     └─────────────┘

3.2 Container Diagram (C4 Level 2)

  • API Gateway — Rate limiting, auth, request routing
  • Pipeline Orchestrator — DAG execution, retry, circuit breaker
  • Module Runtime — Isolated execution environment per AI module
  • Message Queue — Async inter-module communication
  • State Store — Pipeline state, checkpoints, results
  • Observability Stack — Traces, metrics, logs, alerts

3.3 Data Flow

  Input → Validation → ${modules.join(" → ")} → Output Assembly → Response

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. API CONTRACTS

4.1 Pipeline Execution Endpoint

  POST /api/v1/pipeline/execute
  Content-Type: application/json
  Authorization: Bearer <token>

  Request:
  {
    "pipeline_id": "${projectName.toLowerCase().replace(/\s+/g, "-")}",
    "input": { "content": "string", "metadata": {} },
    "config": {
      "timeout_ms": 30000,
      "priority": "normal",
      "trace_enabled": true
    }
  }

  Response (200):
  {
    "execution_id": "uuid",
    "status": "completed",
    "result": { ... },
    "trace": { "stages": [...], "total_ms": 2340 }
  }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5. SECURITY MODEL

  • Authentication: OAuth 2.0 / API Key
  • Authorization: RBAC with project-level scoping
  • Encryption: TLS 1.3 in transit, AES-256 at rest
  • PII Handling: Auto-redaction pipeline, no PII in logs
  • Audit Trail: Immutable append-only audit log

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

6. DEPLOYMENT & OPERATIONS

  • Infrastructure: Kubernetes (EKS/GKE) with auto-scaling
  • CI/CD: GitHub Actions → Build → Test → Stage → Production
  • Monitoring: Grafana + Prometheus + Loki + Tempo
  • Alerting: PagerDuty integration, SLO-based alerts
  • Rollback: Blue/green deployment with instant rollback

${customContext ? `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nADDITIONAL CONTEXT\n\n${customContext}\n` : ""}
`,

    "api-docs": `# ${projectName} — API Reference\n\n**Base URL:** \`https://api.stackforge.ai/v1\`\n**Version:** 1.0.0 | **Date:** ${now}\n\n## Authentication\n\nAll requests require a Bearer token:\n\`\`\`\nAuthorization: Bearer YOUR_API_KEY\n\`\`\`\n\n## Endpoints\n\n### POST /pipeline/execute\n\nExecute the ${projectName} pipeline.\n\n**Request:**\n\`\`\`json\n{\n  "input": { "content": "Your input text" },\n  "config": { "timeout_ms": 30000 }\n}\n\`\`\`\n\n**Response (200):**\n\`\`\`json\n{\n  "execution_id": "uuid",\n  "status": "completed",\n  "stages": [\n${modules.map(m => `    { "name": "${m}", "status": "success", "latency_ms": 450 }`).join(",\n")}\n  ],\n  "result": { "output": "..." }\n}\n\`\`\`\n\n### GET /pipeline/status/{execution_id}\n\nCheck pipeline execution status.\n\n### GET /pipeline/history\n\nList past executions with pagination.\n\n## Error Codes\n\n| Code | Description |\n|------|-------------|\n| 400 | Invalid input schema |\n| 401 | Invalid/missing API key |\n| 429 | Rate limit exceeded |\n| 500 | Pipeline execution error |\n\n## Rate Limits\n\n- Free: 100 req/day\n- Pro: 10,000 req/day\n- Enterprise: Unlimited\n`,

    "pitch-deck": `# ${projectName} — Pitch Deck Script\n\nGenerated: ${now}\n\n---\n\n## SLIDE 1: Title\n\n**${projectName}**\n${projectDesc}\n\n*Speaker notes: Open with a provocative question about the inefficiency of current solutions in this space.*\n\n---\n\n## SLIDE 2: The Problem\n\n• Current solutions are monolithic, slow, and expensive\n• Error rates of 15-20% require constant human oversight\n• No auditability — "black box" AI decisions\n• Scaling costs grow linearly with usage\n\n*Visual: Show cost/error graph trending upward*\n\n---\n\n## SLIDE 3: Our Solution\n\n${projectName} uses ${modules.length} specialized AI agents working in concert:\n\n${modules.map((m, i) => `${i + 1}. **${m}** — purpose-built for one task`).join("\n")}\n\nResult: 94.7% accuracy, 73% faster, 71% cheaper\n\n---\n\n## SLIDE 4: Demo\n\nLive walkthrough of the pipeline processing a real input.\n\n---\n\n## SLIDE 5: Market Opportunity\n\n• TAM: $42B (AI automation market, 2026)\n• SAM: $8.4B (enterprise AI orchestration)\n• SOM: $840M (first 3 years)\n\n---\n\n## SLIDE 6: Business Model\n\n• SaaS pricing: $99/mo (Pro), $499/mo (Team), Enterprise custom\n• Usage-based: $0.003 per pipeline execution\n• Gross margin: 78%\n\n---\n\n## SLIDE 7: Traction\n\n• 2,400 beta users\n• 156K pipeline executions in last 30 days\n• 3 enterprise pilots (Fortune 500)\n• 94% monthly retention\n\n---\n\n## SLIDE 8: The Ask\n\nRaising $4M Seed to:\n• Scale engineering team (6 → 15)\n• Enterprise sales motion\n• SOC 2 + HIPAA certification\n`,

    "research-abstract": `# ${projectName}: Multi-Agent Task Decomposition for Production AI Systems\n\n**Authors:** StackForge AI Research\n**Date:** ${now}\n**Submitted to:** [Conference Name]\n\n## Abstract\n\nWe present ${projectName}, a multi-agent AI architecture that decomposes complex tasks into ${modules.length} specialized sub-agents orchestrated through a directed acyclic graph (DAG) pipeline. ${projectDesc} Our approach demonstrates significant improvements over monolithic baselines: +12.6% task completion accuracy, -73.6% latency, -71.7% cost per execution, and -81.4% hallucination rate. We provide ablation studies isolating the contribution of each design decision and release our evaluation framework for reproducibility.\n\n**CCS Concepts:** Computing methodologies → Multi-agent systems; Artificial intelligence → Natural language processing\n\n**Keywords:** multi-agent AI, pipeline orchestration, task decomposition, specialized language models\n`,

    readme: `# ${projectName}\n\n> ${projectDesc}\n\n[![Build](https://img.shields.io/badge/build-passing-brightgreen)]() [![License](https://img.shields.io/badge/license-MIT-blue)]() [![Version](https://img.shields.io/badge/version-1.0.0-orange)]()\n\n## Features\n\n${modules.map(m => `- ✅ **${m}**`).join("\n")}\n- 🔄 DAG-based pipeline orchestration\n- 📊 Real-time monitoring & tracing\n- 🔒 SOC 2 compliant data handling\n- ⚡ < 3s end-to-end latency (p95)\n\n## Quick Start\n\n\`\`\`bash\nnpm install @stackforge/${projectName.toLowerCase().replace(/\s+/g, "-")}\n\`\`\`\n\n\`\`\`typescript\nimport { Pipeline } from '@stackforge/${projectName.toLowerCase().replace(/\s+/g, "-")}';\n\nconst pipeline = new Pipeline('${projectName.toLowerCase().replace(/\s+/g, "-")}');\nconst result = await pipeline.execute({ content: 'Your input here' });\nconsole.log(result.output);\n\`\`\`\n\n## Architecture\n\n\`\`\`\nInput → ${modules.join(" → ")} → Output\n\`\`\`\n\n## License\n\nMIT\n`,

    "architecture-doc": `# ${projectName} — Architecture Document\n\n**Version:** 1.0 | **Date:** ${now} | **Status:** Living Document\n\n## 1. System Context\n\n${projectName} sits between end users and AI model providers, orchestrating ${modules.length} specialized modules into a coherent pipeline.\n\n## 2. Containers\n\n- **API Gateway** — Authentication, rate limiting, routing\n- **Pipeline Engine** — DAG executor with retry/circuit breaker\n- **Module Runtime** — Sandboxed execution per AI module\n- **State Store** — Redis + PostgreSQL for state and results\n- **Message Bus** — NATS for async inter-module communication\n- **Observability** — OpenTelemetry collector → Grafana\n\n## 3. Components\n\n${modules.map((m, i) => `### 3.${i + 1} ${m}\n- Responsibility: Single-purpose processing stage\n- Input: Structured JSON from previous stage\n- Output: Validated JSON to next stage\n- Error handling: Retry 3x → fallback → human review`).join("\n\n")}\n\n## 4. Architecture Decisions\n\n| ID | Decision | Rationale |\n|----|----------|----------|\n| ADR-001 | Multi-agent over monolithic | 12.6% accuracy gain, better auditability |\n| ADR-002 | DAG over linear pipeline | Enables parallel processing, conditional routing |\n| ADR-003 | Structured JSON interfaces | Type safety, validation, versioning |\n| ADR-004 | Hybrid cloud/edge deployment | Cost optimization, latency reduction |\n`,

    "grant-proposal": `# ${projectName} — Grant Proposal\n\n**PI:** [Principal Investigator]\n**Institution:** [Institution]\n**Date:** ${now}\n**Requested Amount:** $[Amount]\n\n## Project Summary\n\n${projectName} investigates multi-agent AI architectures for ${projectDesc.toLowerCase()}. This research will advance the state of the art in AI orchestration, demonstrating that task decomposition across specialized agents yields measurably superior results for complex, real-world workflows.\n\n## Significance\n\nCurrent monolithic AI approaches face three critical limitations:\n1. Unpredictable behavior on complex, multi-step tasks\n2. High computational cost due to over-provisioned models\n3. Lack of auditability in decision-making processes\n\n## Innovation\n\nOur approach introduces:\n- ${modules.length}-stage specialist agent pipeline\n- Formal verification of inter-agent communication\n- Adaptive routing based on input complexity\n- Privacy-preserving federated updates\n\n## Technical Approach\n\nPhase 1 (Months 1-6): Architecture design and module development\nPhase 2 (Months 7-12): Integration, evaluation, and optimization\nPhase 3 (Months 13-18): Field deployment and longitudinal study\n\n## Broader Impacts\n\nThis research will:\n- Reduce AI deployment costs by 70%+\n- Enable AI adoption in resource-constrained settings\n- Establish best practices for auditable AI systems\n- Train 3 graduate students in AI systems engineering\n`,

    "patent-draft": `# UNITED STATES PATENT APPLICATION\n\n**Title:** ${projectName}: Multi-Agent AI Pipeline System with Specialized Task Decomposition\n\n**Filing Date:** ${now}\n**Inventors:** [Inventors]\n\n## FIELD OF THE INVENTION\n\nThis invention relates to artificial intelligence systems, and more particularly to multi-agent pipeline architectures for automated task processing.\n\n## BACKGROUND\n\nPrior art in AI task automation relies predominantly on monolithic language model architectures that attempt to handle entire workflows in a single inference call. These approaches suffer from hallucination, inconsistency, and poor auditability.\n\n## SUMMARY OF THE INVENTION\n\nThe present invention provides a system and method for decomposing complex tasks into ${modules.length} specialized processing stages, each handled by a purpose-built AI agent operating within strict behavioral boundaries.\n\n## CLAIMS\n\n1. A computer-implemented method for processing tasks through a multi-agent AI pipeline comprising:\n   a) receiving an input task;\n   b) routing said task through a directed acyclic graph of ${modules.length} specialized AI modules;\n   c) wherein each module operates with:\n      - a constrained system prompt defining its singular responsibility;\n      - validated input/output schemas;\n      - configurable confidence thresholds;\n   d) aggregating outputs from all modules into a unified result.\n\n2. The method of claim 1, wherein modules include:\n${modules.map((m, i) => `   ${String.fromCharCode(97 + i)}) ${m};`).join("\n")}\n\n3. The method of claim 1, further comprising:\n   - automatic human-in-the-loop routing when module confidence falls below a configurable threshold.\n\n## DETAILED DESCRIPTION\n\n[Detailed technical description of the system architecture, data flows, and novel aspects...]\n`,
  };

  return docs[format] || "Document generation not available for this format.";
}

export default function ExportStudioPage() {
  const [selectedProject, setSelectedProject] = useState(mockProjects[0]?.id || "");
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("whitepaper");
  const [customContext, setCustomContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedDoc, setGeneratedDoc] = useState<string | null>(null);
  const [includeModules, setIncludeModules] = useState(true);
  const [includeStacks, setIncludeStacks] = useState(true);

  const project = mockProjects.find(p => p.id === selectedProject);
  const format = exportFormats.find(f => f.id === selectedFormat)!;
  const modules = includeModules ? mockModules.map(m => m.name) : [];
  const stacks = includeStacks ? mockStacks.map(s => s.name) : [];

  const generate = () => {
    if (!project) return;
    setGenerating(true);
    setProgress(0);
    setGeneratedDoc(null);

    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 15 + 5;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        const doc = generateDocument(selectedFormat, project.name, project.description, modules, stacks, customContext);
        setGeneratedDoc(doc);
        setGenerating(false);
        toast.success(`${format.label} generated successfully`);
      }
      setProgress(Math.min(p, 100));
    }, 200);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Left: Config */}
      <div className="w-[420px] border-r flex flex-col">
        <div className="p-6 space-y-5">
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-primary" />
              Export Studio
            </h1>
            <p className="text-xs text-muted-foreground mt-1">Transform your project into white papers, prompts, specs, pitch decks & more</p>
          </div>

          {/* Project selector */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Source Project</label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {mockProjects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {project && <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{project.description}</p>}
          </div>

          {/* Include toggles */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs">
              <Switch checked={includeModules} onCheckedChange={setIncludeModules} />
              Include AI Modules ({mockModules.length})
            </label>
            <label className="flex items-center gap-2 text-xs">
              <Switch checked={includeStacks} onCheckedChange={setIncludeStacks} />
              Include Stacks ({mockStacks.length})
            </label>
          </div>

          {/* Additional context */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Additional Context (optional)</label>
            <Textarea
              value={customContext}
              onChange={e => setCustomContext(e.target.value)}
              placeholder="Add target audience, specific requirements, company details, research focus…"
              rows={3}
              className="resize-none text-xs"
            />
          </div>
        </div>

        <Separator />

        {/* Format selector */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-1.5">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-2">Export Format</p>
            {exportFormats.map(f => (
              <button key={f.id}
                onClick={() => setSelectedFormat(f.id)}
                className={cn("w-full text-left p-3 rounded-lg border transition-all",
                  selectedFormat === f.id ? "ring-2 ring-primary bg-primary/5 border-primary/20" : "hover:bg-accent/5 border-transparent"
                )}
              >
                <div className="flex items-center gap-2">
                  <f.icon className={cn("h-4 w-4", selectedFormat === f.id ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-sm font-medium">{f.label}</span>
                  <Badge variant="outline" className="text-[9px] ml-auto">{f.lengthEstimate}</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{f.description}</p>
              </button>
            ))}
          </div>
        </ScrollArea>

        <Separator />

        <div className="p-4 space-y-3">
          {generating && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Generating {format.label}…</span>
                <span className="font-mono">{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}
          <Button className="w-full" onClick={generate} disabled={generating || !project}>
            {generating ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Generating…</> : <><Sparkles className="h-3.5 w-3.5 mr-1.5" />Generate {format.label}</>}
          </Button>
        </div>
      </div>

      {/* Right: Document viewer */}
      <div className="flex-1 flex flex-col min-w-0">
        <AnimatePresence mode="wait">
          {generatedDoc ? (
            <motion.div key="doc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">
              <div className="px-6 py-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <format.icon className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold text-sm">{format.label} — {project?.name}</h2>
                  <Badge variant="secondary" className="text-[9px]">{generatedDoc.split("\n").length} lines</Badge>
                  <Badge variant="outline" className="text-[9px]">{format.tone}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(generatedDoc); toast.success("Copied to clipboard"); }}>
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => {
                    const blob = new Blob([generatedDoc], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${project?.name.toLowerCase().replace(/\s+/g, "-")}-${selectedFormat}.md`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success("Downloaded!");
                  }}>
                    <Download className="h-3 w-3 mr-1" /> Download
                  </Button>
                  <Button size="sm" variant="ghost" onClick={generate}>
                    <RefreshCw className="h-3 w-3 mr-1" /> Regenerate
                  </Button>
                </div>
              </div>

              {/* Section navigator */}
              <div className="px-6 py-2 border-b bg-muted/30">
                <div className="flex items-center gap-1 overflow-x-auto">
                  <span className="text-[10px] text-muted-foreground shrink-0 mr-1">Sections:</span>
                  {format.sections.map(s => (
                    <Badge key={s} variant="outline" className="text-[9px] shrink-0 cursor-pointer hover:bg-primary/10">{s}</Badge>
                  ))}
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-6">
                  <pre className="text-sm font-mono leading-relaxed whitespace-pre-wrap text-foreground/85">{generatedDoc}</pre>
                </div>
              </ScrollArea>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <ScrollText className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-lg font-bold">Export Studio</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Select a project, choose an export format, and generate publication-ready documents. White papers, system prompts, technical specs, pitch decks, patent drafts — all derived from your project's actual architecture.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-6">
                  {exportFormats.slice(0, 4).map(f => (
                    <button key={f.id} onClick={() => setSelectedFormat(f.id)}
                      className="p-3 rounded-lg border hover:bg-accent/5 text-left transition-colors"
                    >
                      <f.icon className="h-4 w-4 text-primary mb-1" />
                      <div className="text-xs font-medium">{f.label}</div>
                      <div className="text-[10px] text-muted-foreground">{f.lengthEstimate}</div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
