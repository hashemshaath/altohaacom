-- 1. FIX: post_edits - remove the old USING(true) policy
DROP POLICY IF EXISTS "Anyone can view post edits" ON public.post_edits;

-- 2. FIX: email_verifications - consolidate 3 INSERT policies into 1 strict one
DROP POLICY IF EXISTS "Users can create own email verification" ON public.email_verifications;
DROP POLICY IF EXISTS "Users can create own verifications" ON public.email_verifications;
DROP POLICY IF EXISTS "Users can insert their own verifications" ON public.email_verifications;

CREATE POLICY "Users can insert own email verifications"
  ON public.email_verifications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
