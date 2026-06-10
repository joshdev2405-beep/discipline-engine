
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS image_url text;

CREATE POLICY "Users can upload own feedback images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'feedback-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read own feedback images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'feedback-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own feedback images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'feedback-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can read all feedback images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'feedback-images' AND public.has_role(auth.uid(), 'admin'::app_role));
