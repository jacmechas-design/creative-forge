CREATE POLICY "Users can upload own design files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'design-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own design files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'design-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own design files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'design-files' AND (storage.foldername(name))[1] = auth.uid()::text);