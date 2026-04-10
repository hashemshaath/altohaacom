-- Fix: Posts Realtime channel - connections has no status column
DROP POLICY IF EXISTS "Allow listening to user-scoped channels" ON realtime.messages;

CREATE POLICY "Allow listening to user-scoped channels"
  ON realtime.messages FOR SELECT
  USING (
    realtime.topic() = concat('user:', auth.uid()::text)
    OR realtime.topic() = concat('notifications:', auth.uid()::text)
    OR realtime.topic() = concat('chat:', auth.uid()::text)
    OR (
      realtime.topic() ~~ 'competition:%'
      AND (
        EXISTS (SELECT 1 FROM competition_registrations cr WHERE cr.participant_id = auth.uid() AND realtime.topic() = concat('competition:', cr.competition_id::text))
        OR EXISTS (SELECT 1 FROM competition_judges cj WHERE cj.judge_id = auth.uid() AND realtime.topic() = concat('competition:', cj.competition_id::text))
        OR EXISTS (SELECT 1 FROM competitions c WHERE c.organizer_id = auth.uid() AND realtime.topic() = concat('competition:', c.id::text))
        OR is_admin_user()
      )
    )
    OR (
      realtime.topic() ~~ 'exhibition:%'
      AND (
        EXISTS (SELECT 1 FROM exhibitions e WHERE e.organizer_id = auth.uid() AND realtime.topic() = concat('exhibition:', e.id::text))
        OR is_admin_user()
      )
    )
    OR (
      realtime.topic() ~~ 'posts:%'
      AND (
        realtime.topic() = concat('posts:', auth.uid()::text)
        OR EXISTS (
          SELECT 1 FROM connections
          WHERE follower_id = auth.uid()
            AND following_id::text = substring(realtime.topic() FROM 7)
        )
        OR is_admin_user()
      )
    )
    OR (
      realtime.topic() ~~ 'order:%'
      AND EXISTS (
        SELECT 1 FROM company_contacts cc
        WHERE cc.user_id = auth.uid()
          AND realtime.topic() = concat('order:', cc.company_id::text)
      )
    )
  );
