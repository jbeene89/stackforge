
CREATE TABLE public.deploy_pipeline_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  dataset_id uuid NOT NULL,
  step_key text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, dataset_id, step_key)
);

ALTER TABLE public.deploy_pipeline_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deploy status"
  ON public.deploy_pipeline_status FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deploy status"
  ON public.deploy_pipeline_status FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deploy status"
  ON public.deploy_pipeline_status FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own deploy status"
  ON public.deploy_pipeline_status FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_deploy_pipeline_status_updated_at
  BEFORE UPDATE ON public.deploy_pipeline_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
