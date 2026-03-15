
-- Add perspective columns to dataset_samples
ALTER TABLE public.dataset_samples 
  ADD COLUMN IF NOT EXISTS builder text DEFAULT '',
  ADD COLUMN IF NOT EXISTS red_team text DEFAULT '',
  ADD COLUMN IF NOT EXISTS systems text DEFAULT '',
  ADD COLUMN IF NOT EXISTS frame_breaker text DEFAULT '',
  ADD COLUMN IF NOT EXISTS empath text DEFAULT '',
  ADD COLUMN IF NOT EXISTS synthesis text DEFAULT '';

-- Create founder_interviews table
CREATE TABLE public.founder_interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  dataset_id uuid NOT NULL REFERENCES public.training_datasets(id) ON DELETE CASCADE,
  transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
  pairs_extracted integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.founder_interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interviews" ON public.founder_interviews FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own interviews" ON public.founder_interviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own interviews" ON public.founder_interviews FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own interviews" ON public.founder_interviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_founder_interviews_updated_at BEFORE UPDATE ON public.founder_interviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
