
-- Users can only SELECT their own tokens (for verification)
CREATE POLICY "Users can view own recovery tokens"
ON public.password_recovery_tokens FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Users can DELETE their own used tokens
CREATE POLICY "Users can delete own recovery tokens"
ON public.password_recovery_tokens FOR DELETE TO authenticated
USING (user_id = auth.uid());
