export const WORKSPACE_SUBJECTS = ["All tools", "Create", "Train", "Data", "Deploy"] as const;

export type WorkspaceSubject = (typeof WORKSPACE_SUBJECTS)[number];
export type WorkspaceIcon = "brain" | "notebook" | "blocks" | "cloud" | "layers" | "database" | "flask" | "image" | "cpu" | "phone" | "rocket" | "download" | "workflow" | "audio" | "book" | "terminal";

export interface WorkspaceTool {
  id: string;
  name: string;
  description: string;
  path: string;
  subject: Exclude<WorkspaceSubject, "All tools">;
  icon: WorkspaceIcon;
  access: "public" | "account";
  connection: "online" | "offline" | "download";
  detail?: string;
  keywords: string;
}

// Every destination is an existing app route. Access labels describe the full
// workflow; the router remains responsible for authentication and plan checks.
export const WORKSPACE_TOOLS: readonly WorkspaceTool[] = [
  { id: "slm-lab", name: "SLM Lab", description: "Turn your knowledge into a small, specialized AI model.", path: "/slm-lab", subject: "Train", icon: "brain", access: "public", connection: "online", detail: "Sign in to save", keywords: "small language model dataset fine tune training forge" },
  { id: "offline-workbench", name: "Offline workbench", description: "Write training pairs, save drafts, and import or export JSONL.", path: "/offline-workbench", subject: "Data", icon: "notebook", access: "public", connection: "offline", keywords: "local private training pairs prompt answer dataset draft jsonl import export no account" },
  { id: "demo-builder", name: "Module builder demo", description: "Try an email classifier, scope summarizer, or tone rewriter.", path: "/demo/module-builder", subject: "Create", icon: "blocks", access: "public", connection: "online", detail: "No sign-in needed", keywords: "construction writing email field notes starter prompt" },
  { id: "cloud-workspace", name: "Cloud workspace", description: "Pick up your projects, modules, and connected tools.", path: "/dashboard", subject: "Create", icon: "cloud", access: "account", connection: "online", keywords: "dashboard home projects saved" },
  { id: "ai-builder", name: "Build an AI", description: "Configure a custom AI and explore its building blocks.", path: "/build-ai", subject: "Create", icon: "cpu", access: "account", connection: "online", keywords: "build ai assistant custom agent" },
  { id: "modules", name: "Your modules", description: "Create and refine focused tools for a specific job.", path: "/modules", subject: "Create", icon: "blocks", access: "account", connection: "online", keywords: "module prompt specialist classifier" },
  { id: "stacks", name: "Stacks", description: "Connect your modules into a visual workflow.", path: "/stacks", subject: "Create", icon: "layers", access: "account", connection: "online", keywords: "pipeline canvas chain workflow automation" },
  { id: "capture", name: "Capture", description: "Collect material for your training datasets.", path: "/capture", subject: "Data", icon: "phone", access: "account", connection: "online", keywords: "camera voice text mobile collect photo" },
  { id: "review", name: "Review training data", description: "Work through examples and decide what makes the cut.", path: "/review", subject: "Data", icon: "database", access: "account", connection: "online", keywords: "swipe curate approve reject review quality pairs" },
  { id: "knowledge-refinery", name: "Knowledge refinery", description: "Organize source material for your model training workflow.", path: "/knowledge-refinery", subject: "Data", icon: "book", access: "account", connection: "online", keywords: "documents research knowledge data refine" },
  { id: "models", name: "Model zoo", description: "Browse models and compare their capabilities.", path: "/models", subject: "Train", icon: "cpu", access: "account", connection: "online", keywords: "llama phi qwen base model catalog" },
  { id: "testing-lab", name: "Testing lab", description: "Explore tests for your modules and model workflows.", path: "/lab", subject: "Train", icon: "flask", access: "account", connection: "online", keywords: "test evaluate compare evaluation performance" },
  { id: "training", name: "Training progress", description: "Check the training jobs connected to your account.", path: "/training", subject: "Train", icon: "workflow", access: "account", connection: "online", keywords: "jobs fine tune progress runs status" },
  { id: "inference", name: "Browser AI", description: "Load a model and chat on supported devices.", path: "/inference", subject: "Deploy", icon: "cpu", access: "account", connection: "download", detail: "Compatible device required", keywords: "local offline webgpu inference browser model chat" },
  { id: "on-device", name: "On-device templates", description: "Find a starting point for a model that runs on your phone.", path: "/on-device", subject: "Deploy", icon: "phone", access: "account", connection: "online", keywords: "mobile templates slm phone gguf" },
  { id: "deploy", name: "Deploy a model", description: "Prepare a trained model for its next destination.", path: "/deploy", subject: "Deploy", icon: "rocket", access: "account", connection: "online", keywords: "deployment export model mobile" },
  { id: "phone-guide", name: "Phone deployment guide", description: "Follow the steps to set up a model on your phone.", path: "/deploy/phone", subject: "Deploy", icon: "book", access: "account", connection: "online", keywords: "android ios phone tutorial guide install" },
  { id: "pipelines", name: "Data pipelines", description: "Explore processors for preparing and transforming data.", path: "/pipelines", subject: "Data", icon: "workflow", access: "account", connection: "online", keywords: "transform processor pipeline clean" },
  { id: "signals", name: "Signal lab", description: "Explore signal processing tools and experiments.", path: "/signals", subject: "Create", icon: "audio", access: "account", connection: "online", keywords: "audio signal wave filter processing" },
  { id: "image-forge", name: "Image forge", description: "Explore image creation with your connected workspace.", path: "/image-forge", subject: "Create", icon: "image", access: "account", connection: "online", keywords: "picture image art generate" },
  { id: "export", name: "Export studio", description: "Package your work for use beyond the workspace.", path: "/export", subject: "Deploy", icon: "download", access: "account", connection: "online", detail: "Builder or Pro plan", keywords: "export download package bundle" },
  { id: "self-host", name: "Self-hosting guide", description: "Explore the setup for running your own infrastructure.", path: "/self-host", subject: "Deploy", icon: "terminal", access: "account", connection: "online", keywords: "server host private docker setup infrastructure" },
];

export const WORKSPACE_PATHS = new Set(WORKSPACE_TOOLS.map(tool => tool.path));

export function searchWorkspaceTools(query: string, subject: WorkspaceSubject = "All tools"): WorkspaceTool[] {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return WORKSPACE_TOOLS.filter(tool => {
    if (subject !== "All tools" && tool.subject !== subject) return false;
    const searchable = `${tool.name} ${tool.description} ${tool.subject} ${tool.keywords}`.toLocaleLowerCase();
    return terms.every(term => searchable.includes(term));
  });
}
