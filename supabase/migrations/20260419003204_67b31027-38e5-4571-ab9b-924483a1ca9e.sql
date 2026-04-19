-- Table to track one-shot quick purchases (SLM and training pairs)
CREATE TABLE public.paid_quick_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  flow TEXT NOT NULL CHECK (flow IN ('slm', 'pairs')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  price_cents INTEGER NOT NULL DEFAULT 0,
  price_credits INTEGER NOT NULL DEFAULT 0,
  payment_method TEXT,
  stripe_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','generating','ready','failed')),
  artifact_path TEXT,
  artifact_filename TEXT,
  preview_summary JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ
);

ALTER TABLE public.paid_quick_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own quick jobs"
  ON public.paid_quick_jobs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own quick jobs"
  ON public.paid_quick_jobs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update preview on own pending jobs"
  ON public.paid_quick_jobs FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE TRIGGER update_paid_quick_jobs_updated_at
  BEFORE UPDATE ON public.paid_quick_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_paid_quick_jobs_user ON public.paid_quick_jobs(user_id, created_at DESC);
CREATE INDEX idx_paid_quick_jobs_session ON public.paid_quick_jobs(stripe_session_id);

-- Private storage bucket for generated artifacts
INSERT INTO storage.buckets (id, name, public)
VALUES ('quick-artifacts', 'quick-artifacts', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users read own quick artifacts"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'quick-artifacts' AND auth.uid()::text = (storage.foldername(name))[1]);