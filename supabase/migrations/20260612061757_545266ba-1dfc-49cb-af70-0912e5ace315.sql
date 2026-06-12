ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

DROP POLICY IF EXISTS "Users can update own feedback" ON public.feedback;
CREATE POLICY "Users can update own feedback"
ON public.feedback
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update all feedback" ON public.feedback;
CREATE POLICY "Admins can update all feedback"
ON public.feedback
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

UPDATE public.feedback AS f
SET image_url = o.name
FROM storage.objects AS o
WHERE o.bucket_id = 'feedback-images'
  AND f.image_url IS NULL
  AND split_part(o.name, '/', 1) = f.user_id::text
  AND split_part(split_part(o.name, '/', 2), '.', 1) = f.id::text;