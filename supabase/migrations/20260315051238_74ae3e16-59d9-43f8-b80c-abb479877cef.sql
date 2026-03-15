
CREATE TABLE public.perspective_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES public.training_datasets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  perspective TEXT NOT NULL CHECK (perspective IN ('builder', 'red_team', 'systems', 'frame_breaker', 'empath')),
  input_content TEXT NOT NULL,
  domain_hint TEXT DEFAULT 'general',
  result TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  source_url TEXT,
  batch_id UUID NOT NULL DEFAULT gen_random_uuid(),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.perspective_jobs ENABLE ROW LEVEL SECURITY;

-- Anyone can poll/submit (tablet has no auth) - but only pending jobs are visible
CREATE POLICY "Anyone can read pending jobs" ON public.perspective_jobs
  FOR SELECT USING (status IN ('pending', 'processing'));

CREATE POLICY "Anyone can update processing jobs" ON public.perspective_jobs
  FOR UPDATE USING (status IN ('pending', 'processing'));

-- Authenticated users can insert and read their own
CREATE POLICY "Users can insert own jobs" ON public.perspective_jobs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own jobs" ON public.perspective_jobs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_perspective_jobs_updated_at
  BEFORE UPDATE ON public.perspective_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for polling
CREATE INDEX idx_perspective_jobs_status ON public.perspective_jobs(status, created_at);
