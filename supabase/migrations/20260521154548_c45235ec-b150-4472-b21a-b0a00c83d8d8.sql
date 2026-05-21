
UPDATE storage.buckets SET public = false WHERE id = 'trade-screenshots';

DROP POLICY IF EXISTS "Trade screenshots are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public can view trade screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view trade screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own trade screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own trade screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own trade screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own trade screenshots" ON storage.objects;

CREATE POLICY "Users can view own trade screenshots"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'trade-screenshots' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own trade screenshots"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'trade-screenshots' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own trade screenshots"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'trade-screenshots' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own trade screenshots"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'trade-screenshots' AND (auth.uid())::text = (storage.foldername(name))[1]);
