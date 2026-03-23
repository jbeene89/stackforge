import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// Types matching our database
export interface DbProject {
  id: string;
  user_id: string;
  name: string;
  description: string;
  type: "web" | "android" | "module" | "stack" | "hybrid";
  status: "draft" | "building" | "testing" | "deployed" | "archived";
  tags: string[];
  version_count: number;
  created_at: string;
  updated_at: string;
}

export interface DbModule {
  id: string;
  user_id: string;
  name: string;
  role: string;
  type: string;
  system_prompt: string;
  goal: string;
  task_boundaries: string;
  allowed_inputs: string[];
  expected_outputs: string[];
  output_format: string;
  tone: string;
  temperature: number;
  max_tokens: number;
  constraints: string[];
  guardrails: string[];
  memory_enabled: boolean;
  tool_access_enabled: boolean;
  slm_mode: boolean;
  deterministic_mode: boolean;
  tags: string[];
  provider: string;
  model: string;
  version_count: number;
  created_at: string;
  updated_at: string;
}

export interface DbStack {
  id: string;
  user_id: string;
  name: string;
  description: string;
  nodes: any[];
  edges: any[];
  tags: string[];
  version_count: number;
  created_at: string;
  updated_at: string;
}

export interface DbRun {
  id: string;
  user_id: string;
  target_type: string;
  target_id: string;
  target_name: string;
  status: string;
  steps: any[];
  version: number;
  total_duration_ms: number;
  started_at: string;
  completed_at: string | null;
}

// Projects
export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as DbProject[];
    },
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as DbProject;
    },
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (project: { name: string; description?: string; type?: DbProject["type"]; status?: DbProject["status"]; tags?: string[] }) => {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          name: project.name,
          description: project.description || "",
          type: project.type || "web",
          status: project.status || "draft",
          tags: project.tags || [],
          user_id: user!.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string; type?: DbProject["type"]; status?: DbProject["status"]; tags?: string[] }) => {
      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as DbProject;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["projects", data.id] });
      toast.success("Project updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// Modules
export function useModule(id: string) {
  return useQuery({
    queryKey: ["modules", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as DbModule;
    },
    enabled: !!id,
  });
}

export function useModules() {
  return useQuery({
    queryKey: ["modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as DbModule[];
    },
  });
}

export function useCreateModule() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (mod: { name: string; type?: "specialist" | "slm" | "router" | "evaluator" | "critic" | "comparator" | "formatter" | "extractor" | "classifier" | "memory-filter" | "human-gate" | "synthesizer"; role?: string; system_prompt?: string; goal?: string }) => {
      const { data, error } = await supabase
        .from("modules")
        .insert({
          name: mod.name,
          type: mod.type || "specialist",
          role: mod.role || "",
          system_prompt: mod.system_prompt || "",
          goal: mod.goal || "",
          user_id: user!.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["modules"] });
      toast.success("Module created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; role?: string; system_prompt?: string; goal?: string; type?: "specialist" | "slm" | "router" | "evaluator" | "critic" | "comparator" | "formatter" | "extractor" | "classifier" | "memory-filter" | "human-gate" | "synthesizer" }) => {
      const { data, error } = await supabase
        .from("modules")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["modules"] });
      toast.success("Module updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("modules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["modules"] });
      toast.success("Module deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// Stacks
export function useStack(id: string) {
  return useQuery({
    queryKey: ["stacks", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stacks")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as DbStack;
    },
    enabled: !!id,
  });
}

export function useStacks() {
  return useQuery({
    queryKey: ["stacks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stacks")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as DbStack[];
    },
  });
}

export function useCreateStack() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (stack: { name: string; description?: string; nodes?: any[]; edges?: any[]; tags?: string[] }) => {
      const { data, error } = await supabase
        .from("stacks")
        .insert({
          name: stack.name,
          description: stack.description || "",
          nodes: stack.nodes || [],
          edges: stack.edges || [],
          tags: stack.tags || [],
          user_id: user!.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stacks"] });
      toast.success("Stack created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateStack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbStack> & { id: string }) => {
      const { data, error } = await supabase
        .from("stacks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stacks"] });
      toast.success("Stack updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteStack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stacks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stacks"] });
      toast.success("Stack deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// Runs

export function useRuns() {
  return useQuery({
    queryKey: ["runs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as DbRun[];
    },
  });
}

export function useCreateRun() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (run: { target_type: string; target_id: string; target_name: string; status?: "pending" | "running" | "success" | "failed" | "paused"; steps?: any[] }) => {
      const { data, error } = await supabase
        .from("runs")
        .insert({
          target_type: run.target_type,
          target_id: run.target_id,
          target_name: run.target_name,
          status: run.status || "pending",
          steps: run.steps || [],
          user_id: user!.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["runs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// Profile
export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (updates: { display_name?: string; bio?: string; avatar_url?: string }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user!.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// AI Streaming helper
export async function streamAI({
  messages,
  mode = "general",
  onDelta,
  onDone,
}: {
  messages: { role: string; content: string }[];
  mode?: string;
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) throw new Error("Not authenticated — please log in first.");

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-generate`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages, mode }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "AI request failed" }));
    throw new Error(err.error || `AI error ${resp.status}`);
  }

  if (!resp.body) throw new Error("No response stream");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { streamDone = true; break; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
  onDone();
}

// Project Messages (Chat History)
export interface DbProjectMessage {
  id: string;
  project_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export function useProjectMessages(projectId: string) {
  return useQuery({
    queryKey: ["project_messages", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_messages")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as DbProjectMessage[];
    },
    enabled: !!projectId,
  });
}

export function useAddProjectMessage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (msg: { project_id: string; role: "user" | "assistant"; content: string }) => {
      const { data, error } = await supabase
        .from("project_messages")
        .insert({
          project_id: msg.project_id,
          role: msg.role,
          content: msg.content,
          user_id: user!.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data as DbProjectMessage;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["project_messages", data.project_id] });
    },
  });
}

export function useClearProjectMessages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from("project_messages")
        .delete()
        .eq("project_id", projectId);
      if (error) throw error;
    },
    onSuccess: (_, projectId) => {
      qc.invalidateQueries({ queryKey: ["project_messages", projectId] });
      toast.success("Chat history cleared");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
