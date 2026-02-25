-- Allow admins to manage social_link_pages for any user
DROP POLICY IF EXISTS "Users manage own page" ON public.social_link_pages;

CREATE POLICY "Users manage own page" 
ON public.social_link_pages 
FOR ALL 
USING (auth.uid() = user_id OR public.is_admin_user())
WITH CHECK (auth.uid() = user_id OR public.is_admin_user());
