-- 1. FIX: email_verifications - drop old permissive policy with user_id IS NULL
DROP POLICY IF EXISTS "Authenticated users can insert verifications" ON public.email_verifications;
DROP POLICY IF EXISTS "Users can insert verifications" ON public.email_verifications;

-- Keep only the strict policy created earlier
-- Ensure it exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_verifications' AND policyname = 'Users can create own verifications') THEN
    EXECUTE $p$
      CREATE POLICY "Users can create own verifications"
        ON public.email_verifications FOR INSERT
        TO authenticated
        WITH CHECK (user_id = auth.uid())
    $p$;
  END IF;
END $$;

-- 2. FIX: bio_subscribers - validate page_id and page_owner_id
DROP POLICY IF EXISTS "Authenticated users can subscribe with email" ON public.bio_subscribers;

CREATE POLICY "Authenticated users can subscribe with email"
  ON public.bio_subscribers FOR INSERT
  TO authenticated
  WITH CHECK (
    email IS NOT NULL AND email <> ''
    AND EXISTS (
      SELECT 1 FROM public.social_link_pages
      WHERE id = page_id AND user_id = page_owner_id
    )
  );
