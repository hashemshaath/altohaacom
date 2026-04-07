-- Fix 1: exhibition_competitions - replace overly permissive ALL policy with scoped policies
DROP POLICY IF EXISTS "Authenticated users can manage exhibition competitions" ON public.exhibition_competitions;

CREATE POLICY "Authorized users can insert exhibition competitions"
ON public.exhibition_competitions FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  OR public.has_role(auth.uid(), 'supervisor')
);

CREATE POLICY "Authorized users can update exhibition competitions"
ON public.exhibition_competitions FOR UPDATE TO authenticated
USING (
  created_by = auth.uid()
  OR public.has_role(auth.uid(), 'supervisor')
);

CREATE POLICY "Authorized users can delete exhibition competitions"
ON public.exhibition_competitions FOR DELETE TO authenticated
USING (
  created_by = auth.uid()
  OR public.has_role(auth.uid(), 'supervisor')
);

-- Fix 2: phone_verifications - restrict INSERT to own user_id
DROP POLICY IF EXISTS "Authenticated users can create phone verification" ON public.phone_verifications;

CREATE POLICY "Users can create own phone verification"
ON public.phone_verifications FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Fix 3: email_verifications - restrict INSERT to own user_id
DROP POLICY IF EXISTS "Authenticated users can create email verification" ON public.email_verifications;

CREATE POLICY "Users can create own email verification"
ON public.email_verifications FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);