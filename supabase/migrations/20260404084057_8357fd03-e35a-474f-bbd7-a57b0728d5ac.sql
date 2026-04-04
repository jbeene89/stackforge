
CREATE TABLE public.custom_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'huggingface',
  source_url TEXT DEFAULT '',
  model_family TEXT DEFAULT 'custom',
  parameter_count TEXT DEFAULT '',
  format TEXT DEFAULT 'safetensors',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own models" ON public.custom_models FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own models" ON public.custom_models FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own models" ON public.custom_models FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own models" ON public.custom_models FOR DELETE TO authenticated USING (auth.uid() = user_id);
