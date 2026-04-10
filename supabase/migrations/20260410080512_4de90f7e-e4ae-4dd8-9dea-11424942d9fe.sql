
-- Fix 1: Realtime scoped channels
DROP POLICY IF EXISTS "Allow listening to scoped channels" ON realtime.messages;
DROP POLICY IF EXISTS "Allow listening to user-scoped channels" ON realtime.messages;

CREATE POLICY "Allow listening to user-scoped channels"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    realtime.topic() LIKE 'competition:%'
    OR realtime.topic() LIKE 'exhibition:%'
    OR realtime.topic() LIKE 'posts:%'
    OR realtime.topic() = concat('user:', auth.uid()::text)
    OR realtime.topic() = concat('notifications:', auth.uid()::text)
    OR realtime.topic() = concat('chat:', auth.uid()::text)
    OR (
      realtime.topic() LIKE 'order:%'
      AND EXISTS (
        SELECT 1 FROM public.company_contacts cc
        WHERE cc.user_id = auth.uid()
          AND realtime.topic() = concat('order:', cc.company_id::text)
      )
    )
  );

-- Fix 2: integration_settings - restrict to admins via is_admin_user()
DROP POLICY IF EXISTS "Authenticated can read active integration settings" ON public.integration_settings;
CREATE POLICY "Only admins can read integration settings"
  ON public.integration_settings
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

-- Fix 3: Fix membership_gifts self-referential WITH CHECK bug
DROP POLICY IF EXISTS "Senders can update their gifts" ON public.membership_gifts;
CREATE POLICY "Senders can cancel their pending gifts"
  ON public.membership_gifts
  FOR UPDATE
  USING (auth.uid() = sender_id AND status = 'pending')
  WITH CHECK (auth.uid() = sender_id AND status = 'cancelled');
