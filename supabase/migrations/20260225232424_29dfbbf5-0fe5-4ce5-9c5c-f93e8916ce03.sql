
-- Fix permissive INSERT policies on security-sensitive tables
-- These should only be insertable by authenticated users (for their own data) or admin

-- 1. security_events: only admins should insert
DROP POLICY IF EXISTS "Service can insert security events" ON public.security_events;
CREATE POLICY "Admins can insert security events"
ON public.security_events
FOR INSERT
WITH CHECK (public.is_admin_user());

-- 2. user_sessions: only the session owner or admin
DROP POLICY IF EXISTS "System can insert sessions" ON public.user_sessions;
CREATE POLICY "Users can insert own sessions"
ON public.user_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id OR public.is_admin_user());

-- 3. notification_rule_logs: only admins
DROP POLICY IF EXISTS "System can insert rule logs" ON public.notification_rule_logs;
CREATE POLICY "Admins can insert rule logs"
ON public.notification_rule_logs
FOR INSERT
WITH CHECK (public.is_admin_user());
