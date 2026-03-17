
-- Mobile captures table for queued pipeline data (voice memos, photos, text notes)
CREATE TABLE public.mobile_captures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dataset_id UUID REFERENCES public.training_datasets(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'text',
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  file_path TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.mobile_captures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own captures" ON public.mobile_captures FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own captures" ON public.mobile_captures FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own captures" ON public.mobile_captures FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own captures" ON public.mobile_captures FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Storage bucket for mobile capture files (voice memos, photos)
INSERT INTO storage.buckets (id, name, public) VALUES ('mobile-captures', 'mobile-captures', false);

-- Storage RLS: users can upload to their own folder
CREATE POLICY "Users can upload own captures" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'mobile-captures' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view own captures" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'mobile-captures' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own captures" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'mobile-captures' AND (storage.foldername(name))[1] = auth.uid()::text);
