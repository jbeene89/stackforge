
CREATE TABLE public.cognitive_fingerprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  dataset_id uuid REFERENCES public.training_datasets(id) ON DELETE CASCADE NOT NULL,
  fingerprint jsonb NOT NULL DEFAULT '{}'::jsonb,
  heuristics text[] NOT NULL DEFAULT '{}'::text[],
  reasoning_style text NOT NULL DEFAULT '',
  domain_bridges text[] NOT NULL DEFAULT '{}'::text[],
  sample_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, dataset_id)
);

ALTER TABLE public.cognitive_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fingerprints" ON public.cognitive_fingerprints
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fingerprints" ON public.cognitive_fingerprints
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fingerprints" ON public.cognitive_fingerprints
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fingerprints" ON public.cognitive_fingerprints
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
