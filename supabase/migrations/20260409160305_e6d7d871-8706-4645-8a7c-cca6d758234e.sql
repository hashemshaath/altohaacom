
-- Fix 1: Remove the broad policy from public.messages that overrides the per-user ownership policy
DROP POLICY IF EXISTS "Authenticated users can access realtime" ON public.messages;

-- Fix 2: Drop and recreate the realtime.messages policy with proper scoping
DROP POLICY IF EXISTS "Authenticated users can access realtime" ON realtime.messages;

CREATE POLICY "Users can access their own realtime channels"
  ON realtime.messages FOR SELECT
  TO authenticated
  USING (
    realtime.topic() = 'public'
    OR realtime.topic() LIKE 'user:%' AND realtime.topic() = concat('user:', auth.uid()::text)
  );
