import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/* ── Shared base model catalog ───────────────────────────────────── */
export interface BaseModelEntry {
  id: string;       // HuggingFace ID or local path
  label: string;    // Display name
  params: string;   // e.g. "1.1B"
  family: string;   // e.g. "llama", "qwen", "gemma"
}

export const BASE_MODEL_CATALOG: BaseModelEntry[] = [
  { id: "TinyLlama/TinyLlama-1.1B-Chat-v1.0", label: "TinyLlama 1.1B", params: "1.1B", family: "tinyllama" },
  { id: "meta-llama/Llama-3.2-1B-Instruct", label: "Llama 3.2 1B", params: "1B", family: "llama" },
  { id: "meta-llama/Llama-3.2-3B-Instruct", label: "Llama 3.2 3B", params: "3B", family: "llama" },
  { id: "google/gemma-2-2b-it", label: "Gemma 2 2B", params: "2B", family: "gemma" },
  { id: "google/gemma-2-9b-it", label: "Gemma 2 9B", params: "9B", family: "gemma" },
  { id: "google/gemma-3-1b-it", label: "Gemma 3 1B", params: "1B", family: "gemma" },
  { id: "google/gemma-3-4b-it", label: "Gemma 3 4B", params: "4B", family: "gemma" },
  { id: "Qwen/Qwen2.5-0.5B-Instruct", label: "Qwen 2.5 0.5B", params: "0.5B", family: "qwen" },
  { id: "Qwen/Qwen2.5-1.5B-Instruct", label: "Qwen 2.5 1.5B", params: "1.5B", family: "qwen" },
  { id: "Qwen/Qwen2.5-3B-Instruct", label: "Qwen 2.5 3B", params: "3B", family: "qwen" },
  { id: "Qwen/Qwen3-0.6B", label: "Qwen 3 0.6B", params: "0.6B", family: "qwen" },
  { id: "Qwen/Qwen3-1.7B", label: "Qwen 3 1.7B", params: "1.7B", family: "qwen" },
  { id: "Qwen/Qwen3-4B", label: "Qwen 3 4B", params: "4B", family: "qwen" },
  { id: "microsoft/Phi-3-mini-4k-instruct", label: "Phi-3 Mini (3.8B)", params: "3.8B", family: "phi" },
  { id: "microsoft/Phi-4-mini-instruct", label: "Phi-4 Mini (3.8B)", params: "3.8B", family: "phi" },
  { id: "mistralai/Mistral-7B-Instruct-v0.3", label: "Mistral 7B", params: "7B", family: "mistral" },
];

export const CUSTOM_MODEL_ID = "__custom__";

/* ── Pipeline stage definitions ──────────────────────────────────── */
export interface PipelineStage {
  key: string;
  label: string;
  icon: string;       // emoji
  route: string;
  complete: boolean;
  prerequisite?: string; // human-readable prereq text
}

export interface ModelContext {
  datasetId: string;
  datasetName: string;
  stages: PipelineStage[];
}

interface ModelContextValue {
  activeModel: ModelContext | null;
  setActiveDataset: (id: string, name: string) => void;
  clearActiveModel: () => void;
  /** Currently selected base model ID (persists across SLM Lab sections) */
  selectedBaseModel: string;
  setSelectedBaseModel: (id: string) => void;
  /** When selectedBaseModel === CUSTOM_MODEL_ID, this holds the custom path/ID */
  customModelPath: string;
  setCustomModelPath: (path: string) => void;
  /** Resolved model ID — returns customModelPath when custom, otherwise selectedBaseModel */
  resolvedBaseModel: string;
}

const Ctx = createContext<ModelContextValue>({
  activeModel: null,
  setActiveDataset: () => {},
  clearActiveModel: () => {},
  selectedBaseModel: "meta-llama/Llama-3.2-1B-Instruct",
  setSelectedBaseModel: () => {},
  customModelPath: "",
  setCustomModelPath: () => {},
  resolvedBaseModel: "meta-llama/Llama-3.2-1B-Instruct",
});

export const useModelContext = () => useContext(Ctx);

/* ── Provider ────────────────────────────────────────────────────── */
export function ModelContextProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selectedDataset, setSelectedDataset] = useState<{ id: string; name: string } | null>(null);

  // Persistent base model selection — survives navigation across SLM Lab sections
  const [selectedBaseModel, setSelectedBaseModelRaw] = useState(() => {
    try {
      return localStorage.getItem("soupy_base_model") || "meta-llama/Llama-3.2-1B-Instruct";
    } catch { return "meta-llama/Llama-3.2-1B-Instruct"; }
  });
  const [customModelPath, setCustomModelPathRaw] = useState(() => {
    try { return localStorage.getItem("soupy_custom_model") || ""; } catch { return ""; }
  });

  const setSelectedBaseModel = useCallback((id: string) => {
    setSelectedBaseModelRaw(id);
    try { localStorage.setItem("soupy_base_model", id); } catch {}
  }, []);

  const setCustomModelPath = useCallback((path: string) => {
    setCustomModelPathRaw(path);
    try { localStorage.setItem("soupy_custom_model", path); } catch {}
  }, []);

  const resolvedBaseModel = selectedBaseModel === CUSTOM_MODEL_ID
    ? (customModelPath || "meta-llama/Llama-3.2-1B-Instruct")
    : selectedBaseModel;

  // Query pipeline progress for the selected dataset
  const { data: stages } = useQuery({
    queryKey: ["pipeline-progress", selectedDataset?.id],
    enabled: !!selectedDataset && !!user,
    queryFn: async () => {
      const datasetId = selectedDataset!.id;
      const userId = user!.id;

      // Parallel queries
      const [samplesRes, jobsRes, deployRes] = await Promise.all([
        supabase
          .from("dataset_samples")
          .select("id", { count: "exact", head: true })
          .eq("dataset_id", datasetId)
          .eq("user_id", userId),
        supabase
          .from("training_jobs")
          .select("id, status")
          .eq("dataset_id", datasetId)
          .eq("user_id", userId),
        supabase
          .from("deploy_pipeline_status")
          .select("step_key, completed")
          .eq("dataset_id", datasetId)
          .eq("user_id", userId),
      ]);

      const sampleCount = samplesRes.count ?? 0;
      const hasData = sampleCount >= 5;

      const jobs = jobsRes.data ?? [];
      const hasTrained = jobs.some((j) => j.status === "completed" || j.status === "running");
      const hasTestedJob = jobs.some((j) => j.status === "completed");

      const deploySteps = deployRes.data ?? [];
      const hasExport = deploySteps.some((s) => s.step_key === "export" && s.completed);
      const hasDeploy = deploySteps.some((s) => s.step_key === "deploy" && s.completed);

      const pipeline: PipelineStage[] = [
        {
          key: "data",
          label: "DATA",
          icon: "📊",
          route: "/slm-lab?step=1",
          complete: hasData,
          prerequisite: hasData ? undefined : `Need at least 5 training samples (have ${sampleCount})`,
        },
        {
          key: "train",
          label: "TRAIN",
          icon: "⚒️",
          route: "/training",
          complete: hasTrained,
          prerequisite: !hasData
            ? "Complete DATA stage first"
            : hasTrained
            ? undefined
            : "Start a training job for this dataset",
        },
        {
          key: "test",
          label: "TEST",
          icon: "🧪",
          route: "/slm-lab?step=4",
          complete: hasTestedJob,
          prerequisite: !hasTrained
            ? "Complete TRAIN stage first"
            : hasTestedJob
            ? undefined
            : "Run knowledge probes on your trained model",
        },
        {
          key: "export",
          label: "EXPORT",
          icon: "📦",
          route: "/export",
          complete: hasExport,
          prerequisite: !hasTestedJob
            ? "Complete TEST stage first"
            : hasExport
            ? undefined
            : "Export your model for deployment",
        },
        {
          key: "deploy",
          label: "DEPLOY",
          icon: "🚀",
          route: "/deploy",
          complete: hasDeploy,
          prerequisite: !hasExport
            ? "Complete EXPORT stage first"
            : hasDeploy
            ? undefined
            : "Deploy to your target device",
        },
      ];

      return pipeline;
    },
  });

  const setActiveDataset = useCallback((id: string, name: string) => {
    setSelectedDataset({ id, name });
  }, []);

  const clearActiveModel = useCallback(() => {
    setSelectedDataset(null);
  }, []);

  const activeModel: ModelContext | null =
    selectedDataset && stages
      ? { datasetId: selectedDataset.id, datasetName: selectedDataset.name, stages }
      : null;

  return (
    <Ctx.Provider value={{
      activeModel,
      setActiveDataset,
      clearActiveModel,
      selectedBaseModel,
      setSelectedBaseModel,
      customModelPath,
      setCustomModelPath,
      resolvedBaseModel,
    }}>
      {children}
    </Ctx.Provider>
  );
}
