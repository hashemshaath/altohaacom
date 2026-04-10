-- Enable RLS on password_recovery_tokens (if not already)
ALTER TABLE public.password_recovery_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only view their own recovery tokens
CREATE POLICY "Users can view own recovery tokens"
  ON public.password_recovery_tokens
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can create recovery tokens for themselves
CREATE POLICY "Users can create own recovery tokens"
  ON public.password_recovery_tokens
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can mark their own tokens as used
CREATE POLICY "Users can update own recovery tokens"
  ON public.password_recovery_tokens
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Admins can manage all tokens
CREATE POLICY "Admins can manage recovery tokens"
  ON public.password_recovery_tokens
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));