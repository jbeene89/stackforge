
-- Training datasets
CREATE TABLE public.training_datasets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  domain TEXT NOT NULL DEFAULT 'general',
  format TEXT NOT NULL DEFAULT 'instruction',
  sample_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.training_datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own datasets" ON public.training_datasets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own datasets" ON public.training_datasets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own datasets" ON public.training_datasets FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own datasets" ON public.training_datasets FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Dataset samples (individual training pairs)
CREATE TABLE public.dataset_samples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dataset_id UUID NOT NULL REFERENCES public.training_datasets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  input TEXT NOT NULL,
  output TEXT NOT NULL,
  source_url TEXT,
  quality_score INTEGER NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.dataset_samples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own samples" ON public.dataset_samples FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own samples" ON public.dataset_samples FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own samples" ON public.dataset_samples FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own samples" ON public.dataset_samples FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Training jobs
CREATE TABLE public.training_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dataset_id UUID NOT NULL REFERENCES public.training_datasets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  base_model TEXT NOT NULL DEFAULT 'phi-3-mini',
  method TEXT NOT NULL DEFAULT 'lora',
  hyperparameters JSONB NOT NULL DEFAULT '{"epochs": 3, "learning_rate": 0.0002, "batch_size": 4, "lora_rank": 16}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.training_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs" ON public.training_jobs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own jobs" ON public.training_jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own jobs" ON public.training_jobs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own jobs" ON public.training_jobs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_training_datasets_updated_at BEFORE UPDATE ON public.training_datasets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_jobs_updated_at BEFORE UPDATE ON public.training_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
