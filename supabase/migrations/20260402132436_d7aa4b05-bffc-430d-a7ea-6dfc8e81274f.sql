-- FIX 1: PII EXPOSURE
DROP POLICY IF EXISTS "Anon can view non-private profiles" ON profiles;

CREATE POLICY "Authenticated can view non-private profiles"
  ON profiles FOR SELECT TO authenticated
  USING (profile_visibility IS DISTINCT FROM 'private');

-- FIX 2: MESSAGE ATTACHMENTS
DROP POLICY IF EXISTS "Authenticated users can view message attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view message attachments in their conversations" ON storage.objects;

CREATE POLICY "Users can view own message attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'message-attachments'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- FIX 3: REALTIME - Remove sensitive tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'messages', 'notifications', 'profiles', 'certificates',
    'exhibition_tickets', 'chat_group_messages'
  ]) LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE public.%I', t);
    EXCEPTION WHEN undefined_object THEN
      NULL; -- table not in publication, skip
    END;
  END LOOP;
END;
$$;