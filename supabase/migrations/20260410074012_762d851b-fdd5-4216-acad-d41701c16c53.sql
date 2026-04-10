
-- Fix 1: Prevent participants from self-approving registrations
DROP POLICY IF EXISTS "Participants can update their registrations" ON public.competition_registrations;
CREATE POLICY "Participants can update their registrations"
  ON public.competition_registrations
  FOR UPDATE
  USING (participant_id = auth.uid() AND status = ANY(ARRAY['pending', 'approved']))
  WITH CHECK (participant_id = auth.uid() AND status = 'pending');

-- Fix 2: Restrict INSERT on profiles to prevent privilege escalation
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (membership_tier IS NULL OR membership_tier = 'basic')
    AND (is_verified IS NULL OR is_verified = false)
    AND (account_status IS NULL OR account_status = 'active')
    AND (wallet_balance IS NULL OR wallet_balance = 0)
    AND (loyalty_points IS NULL OR loyalty_points = 0)
    AND (verification_level IS NULL OR verification_level = 'none')
    AND (verification_badge IS NULL OR verification_badge IS NULL)
    AND (verified_at IS NULL)
  );

-- Fix 3: Restrict gift senders to only cancel (not modify tier/status/recipient)
DROP POLICY IF EXISTS "Senders can update their gifts" ON public.membership_gifts;
CREATE POLICY "Senders can update their gifts"
  ON public.membership_gifts
  FOR UPDATE
  USING (auth.uid() = sender_id)
  WITH CHECK (
    auth.uid() = sender_id
    AND status IS NOT DISTINCT FROM (SELECT status FROM public.membership_gifts WHERE id = membership_gifts.id)
    AND tier IS NOT DISTINCT FROM (SELECT tier FROM public.membership_gifts WHERE id = membership_gifts.id)
    AND recipient_id IS NOT DISTINCT FROM (SELECT recipient_id FROM public.membership_gifts WHERE id = membership_gifts.id)
    AND recipient_email IS NOT DISTINCT FROM (SELECT recipient_email FROM public.membership_gifts WHERE id = membership_gifts.id)
  );

-- Fix 4: Restrict realtime to scoped topics instead of blanket 'public'
DROP POLICY IF EXISTS "Allow listening to public channel" ON realtime.messages;
CREATE POLICY "Allow listening to scoped channels"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    realtime.topic() LIKE 'competition:%'
    OR realtime.topic() LIKE 'exhibition:%'
    OR realtime.topic() LIKE 'posts:%'
    OR realtime.topic() LIKE 'notifications:%'
    OR realtime.topic() LIKE 'chat:%'
    OR realtime.topic() LIKE 'order:%'
  );
