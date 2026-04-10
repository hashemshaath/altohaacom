
-- Fix 1: competition_feedback - restrict INSERT to actual assigned judges
DROP POLICY IF EXISTS "Judges create feedback" ON public.competition_feedback;
CREATE POLICY "Judges create feedback"
  ON public.competition_feedback
  FOR INSERT
  WITH CHECK (
    auth.uid() = judge_id
    AND EXISTS (
      SELECT 1 FROM public.competition_judges cj
      WHERE cj.judge_id = auth.uid()
        AND cj.competition_id = competition_feedback.competition_id
    )
    OR public.is_admin_user()
  );

-- Fix 2: email_verifications - restrict INSERT to user's own email
DROP POLICY IF EXISTS "Users can create verification records" ON public.email_verifications;
DROP POLICY IF EXISTS "Users can insert their own verifications" ON public.email_verifications;
CREATE POLICY "Users can insert their own verifications"
  ON public.email_verifications
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Fix 3: company_contacts - revoke invitation_token via column-level REVOKE
-- Since RLS can't filter columns, we revoke column access and provide RPC
REVOKE SELECT (invitation_token) ON public.company_contacts FROM authenticated;
REVOKE SELECT (invitation_token) ON public.company_contacts FROM anon;
-- Grant back to service_role for backend use
GRANT SELECT (invitation_token) ON public.company_contacts TO service_role;

-- Fix 4: Realtime - scope competition/exhibition channels to participants
DROP POLICY IF EXISTS "Allow listening to user-scoped channels" ON realtime.messages;
CREATE POLICY "Allow listening to user-scoped channels"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    -- User-specific channels
    realtime.topic() = concat('user:', auth.uid()::text)
    OR realtime.topic() = concat('notifications:', auth.uid()::text)
    OR realtime.topic() = concat('chat:', auth.uid()::text)
    -- Competition channels: scoped to participants, judges, organizers
    OR (
      realtime.topic() LIKE 'competition:%'
      AND (
        EXISTS (
          SELECT 1 FROM public.competition_registrations cr
          WHERE cr.participant_id = auth.uid()
            AND realtime.topic() = concat('competition:', cr.competition_id::text)
        )
        OR EXISTS (
          SELECT 1 FROM public.competition_judges cj
          WHERE cj.judge_id = auth.uid()
            AND realtime.topic() = concat('competition:', cj.competition_id::text)
        )
        OR EXISTS (
          SELECT 1 FROM public.competitions c
          WHERE c.organizer_id = auth.uid()
            AND realtime.topic() = concat('competition:', c.id::text)
        )
        OR public.is_admin_user()
      )
    )
    -- Exhibition channels: scoped to organizers
    OR (
      realtime.topic() LIKE 'exhibition:%'
      AND (
        EXISTS (
          SELECT 1 FROM public.exhibitions e
          WHERE e.organizer_id = auth.uid()
            AND realtime.topic() = concat('exhibition:', e.id::text)
        )
        OR public.is_admin_user()
      )
    )
    -- Posts: public broadcast
    OR realtime.topic() LIKE 'posts:%'
    -- Order channels: scoped to company members
    OR (
      realtime.topic() LIKE 'order:%'
      AND EXISTS (
        SELECT 1 FROM public.company_contacts cc
        WHERE cc.user_id = auth.uid()
          AND realtime.topic() = concat('order:', cc.company_id::text)
      )
    )
  );
