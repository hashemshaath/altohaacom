
-- Remove both conflicting INSERT policies
DROP POLICY IF EXISTS "Users can create own phone verification" ON public.phone_verifications;
DROP POLICY IF EXISTS "Users can insert own phone verifications" ON public.phone_verifications;

-- Single strict policy: user must own the phone number
CREATE POLICY "Users can insert own phone verifications"
ON public.phone_verifications FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND phone_number = (SELECT p.phone FROM public.profiles p WHERE p.user_id = auth.uid())
);
