
-- 1) certificate_signatures: authenticated only
DROP POLICY IF EXISTS "Anyone can view active signatures" ON public.certificate_signatures;
CREATE POLICY "Authenticated can view active signatures"
ON public.certificate_signatures FOR SELECT TO authenticated
USING (is_active = true);

-- 2) user_follows: scope to own relationships
DROP POLICY IF EXISTS "Authenticated users can view follows" ON public.user_follows;
CREATE POLICY "Users can view own follows"
ON public.user_follows FOR SELECT TO authenticated
USING (follower_id = auth.uid() OR following_id = auth.uid() OR is_admin(auth.uid()));

-- 3) Attendance tables: restrict to authenticated
DROP POLICY IF EXISTS "Anyone can view live session attendees" ON public.live_session_attendees;
CREATE POLICY "Authenticated can view live session attendees"
ON public.live_session_attendees FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Anyone can view event attendees" ON public.event_attendees;
CREATE POLICY "Authenticated can view event attendees"
ON public.event_attendees FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Anyone can view session registrations" ON public.exhibition_session_registrations;
CREATE POLICY "Authenticated can view session registrations"
ON public.exhibition_session_registrations FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Public can view participations" ON public.entity_competition_participations;
CREATE POLICY "Authenticated can view participations"
ON public.entity_competition_participations FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Anyone can view round participants" ON public.round_participants;
CREATE POLICY "Authenticated can view round participants"
ON public.round_participants FOR SELECT TO authenticated
USING (true);

-- 4) Post engagement: restrict to authenticated
DROP POLICY IF EXISTS "Anyone can view post likes" ON public.post_likes;
CREATE POLICY "Authenticated can view post likes"
ON public.post_likes FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Anyone can view reactions" ON public.post_reactions;
CREATE POLICY "Authenticated can view reactions"
ON public.post_reactions FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Anyone can view reposts" ON public.post_reposts;
CREATE POLICY "Authenticated can view reposts"
ON public.post_reposts FOR SELECT TO authenticated
USING (true);
