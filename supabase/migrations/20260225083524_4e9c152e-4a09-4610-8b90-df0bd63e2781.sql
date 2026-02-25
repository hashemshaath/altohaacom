-- Allow admins to manage social_link_items for any user
DROP POLICY IF EXISTS "Users manage own items" ON public.social_link_items;

CREATE POLICY "Users manage own items" 
ON public.social_link_items 
FOR ALL 
USING (auth.uid() = user_id OR public.is_admin_user())
WITH CHECK (auth.uid() = user_id OR public.is_admin_user());
