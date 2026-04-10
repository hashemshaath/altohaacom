
-- Organizer can view their own sessions
CREATE POLICY "Organizer can view own sessions"
ON public.chefs_table_sessions FOR SELECT TO authenticated
USING (organizer_id = auth.uid() OR is_admin(auth.uid()));
