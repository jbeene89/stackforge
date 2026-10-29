import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TRAINING_MODELS } from "@/lib/localModels";

/* ── Shared base model catalog ───────────────────────────────────── */
export interface BaseModelEntry {
  id: string;       // HuggingFace ID or local path
  label: string;    // Display name
  params: string;   // e.g. "1.1B"
  family: string;   // e.g. "llama", "qwen", "gemma"
}

export const BASE_MODEL_CATALOG: BaseModelEntry[] = TRAINING_MODELS;

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
  const userId = user?.id ?? null;
  const [selectedDataset, setSelectedDataset] = useState<{ id: string; name: string; userId: string } | null>(null);
  // The owner check also applies during the render before identity-change effects run.
  const ownedDataset = userId && selectedDataset?.userId === userId ? selectedDataset : null;

  useEffect(() => {
    setSelectedDataset(current => current?.userId === userId ? current : null);
  }, [userId]);

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
    queryKey: ["pipeline-progress", userId, ownedDataset?.id],
    enabled: !!ownedDataset,
    queryFn: async () => {
      if (!ownedDataset || !userId) return [];
      const datasetId = ownedDataset.id;

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
    if (userId) setSelectedDataset({ id, name, userId });
  }, [userId]);

  const clearActiveModel = useCallback(() => {
    setSelectedDataset(null);
  }, []);

  const activeModel: ModelContext | null =
    ownedDataset && stages
      ? { datasetId: ownedDataset.id, datasetName: ownedDataset.name, stages }
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
