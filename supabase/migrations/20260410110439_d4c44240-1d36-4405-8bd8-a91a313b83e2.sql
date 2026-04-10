
-- ═══════════════════════════════════════════════════════
-- PART 1: Restrict sensitive SELECT policies to authenticated
-- ═══════════════════════════════════════════════════════

-- admin_actions
DROP POLICY IF EXISTS "Admins can view admin actions" ON public.admin_actions;
CREATE POLICY "Admins can view admin actions"
ON public.admin_actions FOR SELECT TO authenticated
USING (is_admin(auth.uid()));

-- security_events
DROP POLICY IF EXISTS "Admins can view security events" ON public.security_events;
CREATE POLICY "Admins can view security events"
ON public.security_events FOR SELECT TO authenticated
USING (is_admin_user());

-- chat_sessions
DROP POLICY IF EXISTS "Users can view their chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can view their chat sessions"
ON public.chat_sessions FOR SELECT TO authenticated
USING ((auth.uid() = user_id) OR (auth.uid() = agent_id) OR is_admin(auth.uid()));

-- messages
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
CREATE POLICY "Users can view their own messages"
ON public.messages FOR SELECT TO authenticated
USING ((auth.uid() = sender_id) OR (auth.uid() = receiver_id));

-- support_tickets
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.support_tickets;
CREATE POLICY "Users can view their own tickets"
ON public.support_tickets FOR SELECT TO authenticated
USING ((auth.uid() = user_id) OR is_admin(auth.uid()));

-- user_wallets
DROP POLICY IF EXISTS "Users can view their own wallet" ON public.user_wallets;
CREATE POLICY "Users can view their own wallet"
ON public.user_wallets FOR SELECT TO authenticated
USING ((auth.uid() = user_id) OR is_admin_user());

-- ═══════════════════════════════════════════════════════
-- PART 2: Add WITH CHECK to critical UPDATE policies
-- ═══════════════════════════════════════════════════════

-- profiles: admin update must not change protected fields
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE TO authenticated
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- competitions: organizer update
DROP POLICY IF EXISTS "Organizers can update their competitions" ON public.competitions;
CREATE POLICY "Organizers can update their competitions"
ON public.competitions FOR UPDATE TO authenticated
USING (auth.uid() = organizer_id)
WITH CHECK (auth.uid() = organizer_id);

-- user_roles: supervisor only
DROP POLICY IF EXISTS "Only supervisors can update roles" ON public.user_roles;
CREATE POLICY "Only supervisors can update roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'supervisor'::app_role))
WITH CHECK (has_role(auth.uid(), 'supervisor'::app_role));

-- site_settings: super admin only
DROP POLICY IF EXISTS "Super admin can update settings" ON public.site_settings;
CREATE POLICY "Super admin can update settings"
ON public.site_settings FOR UPDATE TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- articles: author/admin
DROP POLICY IF EXISTS "Authors can update own articles" ON public.articles;
CREATE POLICY "Authors can update own articles"
ON public.articles FOR UPDATE TO authenticated
USING ((author_id = auth.uid()) OR is_admin(auth.uid()))
WITH CHECK ((author_id = auth.uid()) OR is_admin(auth.uid()));

-- notifications: user only
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- posts: author only
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
CREATE POLICY "Users can update own posts"
ON public.posts FOR UPDATE TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- bookings: user or admin
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
CREATE POLICY "Users can update own bookings"
ON public.bookings FOR UPDATE TO authenticated
USING ((auth.uid() = user_id) OR is_admin_user())
WITH CHECK ((auth.uid() = user_id) OR is_admin_user());

-- recipes: author only
DROP POLICY IF EXISTS "Users can update own recipes" ON public.recipes;
CREATE POLICY "Users can update own recipes"
ON public.recipes FOR UPDATE TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- establishments: creator only
DROP POLICY IF EXISTS "Creators can update their establishments" ON public.establishments;
CREATE POLICY "Creators can update their establishments"
ON public.establishments FOR UPDATE TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);
