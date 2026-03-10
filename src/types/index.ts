// SoupyForge — Core Data Models

export type ProjectType = "web" | "android" | "module" | "stack" | "hybrid";
export type ProjectStatus = "draft" | "building" | "testing" | "deployed" | "archived";
export type ModuleType =
  | "specialist"
  | "slm"
  | "router"
  | "evaluator"
  | "critic"
  | "comparator"
  | "formatter"
  | "extractor"
  | "classifier"
  | "memory-filter"
  | "human-gate"
  | "synthesizer";

export type RunStatus = "pending" | "running" | "success" | "failed" | "paused";

export interface Project {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
  versionCount: number;
  tags: string[];
}

export interface AIModule {
  id: string;
  name: string;
  role: string;
  type: ModuleType;
  systemPrompt: string;
  goal: string;
  taskBoundaries: string;
  allowedInputs: string[];
  expectedOutputs: string[];
  outputFormat: string;
  tone: string;
  temperature: number;
  maxTokens: number;
  constraints: string[];
  guardrails: string[];
  memoryEnabled: boolean;
  toolAccessEnabled: boolean;
  slmMode: boolean;
  deterministicMode: boolean;
  lowContextWindow: boolean;
  conciseOutput: boolean;
  tags: string[];
  provider: string;
  model: string;
  createdAt: string;
  updatedAt: string;
  versionCount: number;
}

export interface StackNode {
  id: string;
  moduleId?: string;
  type: ModuleType;
  label: string;
  x: number;
  y: number;
  config: Record<string, unknown>;
}

export interface StackEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
}

export interface Stack {
  id: string;
  name: string;
  description: string;
  nodes: StackNode[];
  edges: StackEdge[];
  createdAt: string;
  updatedAt: string;
  versionCount: number;
  tags: string[];
}

export interface TestCase {
  id: string;
  name: string;
  input: string;
  expectedOutput?: string;
  tags: string[];
}

export interface RunStep {
  id: string;
  nodeId: string;
  nodeLabel: string;
  input: string;
  output: string;
  status: RunStatus;
  durationMs: number;
  settings: Record<string, unknown>;
}

export interface TestRun {
  id: string;
  targetType: "module" | "stack";
  targetId: string;
  targetName: string;
  status: RunStatus;
  steps: RunStep[];
  startedAt: string;
  completedAt?: string;
  totalDurationMs: number;
  version: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: "web" | "android" | "module" | "stack";
  thumbnail?: string;
  tags: string[];
  popularity: number;
}

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
  isGenerated: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  targetId: string;
  content: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "owner" | "editor" | "reviewer" | "viewer";
}

export interface Workspace {
  id: string;
  name: string;
  members: User[];
  plan: "free" | "pro" | "team";
}
