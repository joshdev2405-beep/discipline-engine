CREATE POLICY "Admin can view all feedback"
ON public.feedback
FOR SELECT
TO authenticated
USING ((auth.jwt() ->> 'email') = 'rojosh2405@gmail.com');