-- Fix 1: competition_scores - Remove unrestricted judge policies
DROP POLICY IF EXISTS "Judges can update their scores" ON public.competition_scores;
DROP POLICY IF EXISTS "Judges can delete their own scores" ON public.competition_scores;

-- Fix 2: chef_evaluation_registrations - Replace ALL policy with scoped ones
DROP POLICY IF EXISTS "Chefs manage own registrations" ON public.chef_evaluation_registrations;

CREATE POLICY "Chefs can view own registrations"
ON public.chef_evaluation_registrations
FOR SELECT
TO authenticated
USING (auth.uid() = chef_id);

CREATE POLICY "Chefs can insert own registrations"
ON public.chef_evaluation_registrations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = chef_id);

CREATE POLICY "Chefs can update own registration details"
ON public.chef_evaluation_registrations
FOR UPDATE
TO authenticated
USING (auth.uid() = chef_id AND status = 'pending')
WITH CHECK (auth.uid() = chef_id AND status = 'pending');

-- Fix 3: Remove user-facing INSERT on audit/moderation log tables
DROP POLICY IF EXISTS "Users can insert own content audit logs" ON public.content_audit_log;
DROP POLICY IF EXISTS "Users can insert own verification audit" ON public.verification_audit_log;
DROP POLICY IF EXISTS "Authenticated users can insert moderation logs" ON public.content_moderation_log;

-- Create SECURITY DEFINER functions for server-side audit logging
CREATE OR REPLACE FUNCTION public.log_content_audit(
  p_user_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_action text,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.content_audit_log (user_id, entity_type, entity_id, action, details)
  VALUES (p_user_id, p_entity_type, p_entity_id, p_action, p_details);
END;
$$;

CREATE OR REPLACE FUNCTION public.log_verification_audit(
  p_request_id uuid,
  p_action_by uuid,
  p_action text,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.verification_audit_log (request_id, action_by, action, details)
  VALUES (p_request_id, p_action_by, p_action, p_details);
END;
$$;

CREATE OR REPLACE FUNCTION public.log_content_moderation(
  p_user_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_action text,
  p_ai_decision text DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.content_moderation_log (user_id, entity_type, entity_id, action, ai_decision, details)
  VALUES (p_user_id, p_entity_type, p_entity_id, p_action, p_ai_decision, p_details);
END;
$$;