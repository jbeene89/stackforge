import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
}

const Ctx = createContext<ModelContextValue>({
  activeModel: null,
  setActiveDataset: () => {},
  clearActiveModel: () => {},
});

export const useModelContext = () => useContext(Ctx);

/* ── Provider ────────────────────────────────────────────────────── */
export function ModelContextProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selectedDataset, setSelectedDataset] = useState<{ id: string; name: string } | null>(null);

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
    <Ctx.Provider value={{ activeModel, setActiveDataset, clearActiveModel }}>
      {children}
    </Ctx.Provider>
  );
}
