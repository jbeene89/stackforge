
CREATE POLICY "Users can update own captures"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'mobile-captures' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'mobile-captures' AND (storage.foldername(name))[1] = auth.uid()::text);
