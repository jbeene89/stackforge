import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { STARTER_DATASET, starterSampleRows } from "@/lib/starterDataset";
import { cachePut, cachePutAll, queueMutation } from "@/lib/offlineCache";
import type { TrainingDataset } from "./useTrainingData";
import { toast } from "sonner";

export function useStarterDataset() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to save your sample dataset.");
      const timestamp = new Date().toISOString();
      const dataset: TrainingDataset = { ...STARTER_DATASET, id: crypto.randomUUID(), user_id: user.id, sample_count: 10, status: "draft", created_at: timestamp, updated_at: timestamp };
      const samples = starterSampleRows(dataset.id, user.id).map(row => ({ ...row, id: crypto.randomUUID(), created_at: timestamp, source_url: null, builder: "", red_team: "", systems: "", frame_breaker: "", empath: "", synthesis: "" }));
      if (navigator.onLine) {
        const { error: datasetError } = await supabase.from("training_datasets").insert(dataset);
        if (datasetError) throw datasetError;
        const { error: sampleError } = await supabase.from("dataset_samples").insert(samples);
        if (sampleError) {
          await supabase.from("training_datasets").delete().eq("id", dataset.id);
          throw sampleError;
        }
      } else {
        await queueMutation({ store: "training_datasets", action: "insert", payload: dataset });
        for (const sample of samples) await queueMutation({ store: "dataset_samples", action: "insert", payload: sample });
      }
      await cachePut("training_datasets", dataset);
      await cachePutAll("dataset_samples", samples);
      return dataset;
    },
    onSuccess: dataset => {
      qc.invalidateQueries({ queryKey: ["training-datasets"] });
      qc.invalidateQueries({ queryKey: ["dataset-samples", dataset.id] });
      toast.success("10 sample pairs loaded — no credits used.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}