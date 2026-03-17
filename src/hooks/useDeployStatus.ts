import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const DEPLOY_STEPS = [
  "export",
  "train",
  "convert",
  "deploy",
  "run",
] as const;

export type DeployStepKey = (typeof DEPLOY_STEPS)[number];

export interface DeployStepStatus {
  step_key: DeployStepKey;
  completed: boolean;
  completed_at: string | null;
  metadata: Record<string, unknown>;
}

export function useDeployStatus(datasetId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["deploy-status", datasetId];

  const { data: stepStatuses, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!datasetId || !user) return [];
      const { data, error } = await supabase
        .from("deploy_pipeline_status")
        .select("step_key, completed, completed_at, metadata")
        .eq("dataset_id", datasetId)
        .eq("user_id", user.id);
      if (error) throw error;
      return (data ?? []) as DeployStepStatus[];
    },
    enabled: !!datasetId && !!user,
  });

  const statusMap = new Map<string, DeployStepStatus>();
  stepStatuses?.forEach((s) => statusMap.set(s.step_key, s));

  const isStepCompleted = (key: DeployStepKey) =>
    statusMap.get(key)?.completed ?? false;

  const completedCount = DEPLOY_STEPS.filter((k) => isStepCompleted(k)).length;

  const toggleStep = useMutation({
    mutationFn: async ({
      stepKey,
      completed,
      metadata,
    }: {
      stepKey: DeployStepKey;
      completed: boolean;
      metadata?: Record<string, unknown>;
    }) => {
      if (!datasetId || !user) throw new Error("Missing context");

      const row = {
        user_id: user.id,
        dataset_id: datasetId,
        step_key: stepKey,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        metadata: (metadata ?? {}) as any,
      };

      const { error } = await supabase
        .from("deploy_pipeline_status")
        .upsert(row as any, { onConflict: "user_id,dataset_id,step_key" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    isLoading,
    isStepCompleted,
    completedCount,
    totalSteps: DEPLOY_STEPS.length,
    toggleStep,
    stepStatuses: stepStatuses ?? [],
  };
}
