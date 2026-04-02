-- ============================================================
-- FIX 1: competition_team_members PII
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view team members" ON competition_team_members;

CREATE POLICY "Scoped view team members"
  ON competition_team_members FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM competitions c WHERE c.id = competition_team_members.competition_id AND c.organizer_id = auth.uid()
    )
    OR public.is_admin(auth.uid())
  );

-- ============================================================
-- FIX 2: registration_team_members PII
-- ============================================================
DROP POLICY IF EXISTS "rtm_select" ON registration_team_members;

CREATE POLICY "Scoped view registration team members"
  ON registration_team_members FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM competition_registrations cr
      WHERE cr.id = registration_team_members.registration_id
        AND cr.participant_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM competition_registrations cr
      JOIN competitions c ON c.id = cr.competition_id
      WHERE cr.id = registration_team_members.registration_id
        AND c.organizer_id = auth.uid()
    )
    OR public.is_admin(auth.uid())
  );

-- ============================================================
-- FIX 3: Exhibition files storage
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can update exhibition files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete exhibition files" ON storage.objects;

CREATE POLICY "Owner or admin can update exhibition files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'exhibition-files'
    AND (
      (auth.uid())::text = (storage.foldername(name))[1]
      OR public.is_admin(auth.uid())
    )
  );

CREATE POLICY "Owner or admin can delete exhibition files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'exhibition-files'
    AND (
      (auth.uid())::text = (storage.foldername(name))[1]
      OR public.is_admin(auth.uid())
    )
  );

-- ============================================================
-- FIX 4: Order activity logs
-- ============================================================
DROP POLICY IF EXISTS "Anyone can read order activity logs" ON order_activity_log;

CREATE POLICY "Users can view own order activity"
  ON order_activity_log FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin(auth.uid())
  );

-- ============================================================
-- FIX 5: Deliberation messages
-- ============================================================
DROP POLICY IF EXISTS "View deliberation messages" ON deliberation_messages;

CREATE POLICY "Participants view deliberation messages"
  ON deliberation_messages FOR SELECT TO authenticated
  USING (
    sender_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM judge_deliberations jd
      WHERE jd.id = deliberation_messages.deliberation_id
        AND (
          EXISTS (SELECT 1 FROM competition_roles cr WHERE cr.competition_id = jd.competition_id AND cr.user_id = auth.uid() AND cr.status = 'active')
          OR EXISTS (SELECT 1 FROM competitions c WHERE c.id = jd.competition_id AND c.organizer_id = auth.uid())
        )
    )
    OR public.is_admin(auth.uid())
  );

-- ============================================================
-- FIX 6: Judge deliberations
-- ============================================================
DROP POLICY IF EXISTS "View deliberations" ON judge_deliberations;

CREATE POLICY "Scoped view deliberations"
  ON judge_deliberations FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM competition_roles cr WHERE cr.competition_id = judge_deliberations.competition_id AND cr.user_id = auth.uid() AND cr.status = 'active')
    OR EXISTS (SELECT 1 FROM competitions c WHERE c.id = judge_deliberations.competition_id AND c.organizer_id = auth.uid())
    OR public.is_admin(auth.uid())
  );

-- ============================================================
-- FIX 7: Stage scores
-- ============================================================
DROP POLICY IF EXISTS "View stage scores" ON stage_scores;

CREATE POLICY "Scoped view stage scores"
  ON stage_scores FOR SELECT TO authenticated
  USING (
    judge_id = auth.uid()
    OR public.is_admin(auth.uid())
  );

-- ============================================================
-- FIX 8: Requirement delivery logs
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view delivery logs" ON requirement_delivery_logs;

CREATE POLICY "Scoped view delivery logs"
  ON requirement_delivery_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM requirement_list_items rli
      JOIN requirement_lists rl ON rl.id = rli.list_id
      WHERE rli.id = requirement_delivery_logs.list_item_id
        AND (rl.created_by = auth.uid() OR public.is_admin(auth.uid()))
    )
    OR public.is_admin(auth.uid())
  );