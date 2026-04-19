-- Add INSERT/UPDATE/DELETE policies for the quick-artifacts bucket scoped to user folder
CREATE POLICY "Users upload to own quick-artifacts folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'quick-artifacts' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own quick-artifacts"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'quick-artifacts' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'quick-artifacts' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own quick-artifacts"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'quick-artifacts' AND (auth.uid())::text = (storage.foldername(name))[1]);