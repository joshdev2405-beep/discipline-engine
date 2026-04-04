
INSERT INTO storage.buckets (id, name, public)
VALUES ('trade-screenshots', 'trade-screenshots', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view trade screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'trade-screenshots');

CREATE POLICY "Authenticated users can upload trade screenshots"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'trade-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own trade screenshots"
ON storage.objects FOR UPDATE
USING (bucket_id = 'trade-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own trade screenshots"
ON storage.objects FOR DELETE
USING (bucket_id = 'trade-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);
