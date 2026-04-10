
-- 1. competition_roles: drop blanket policy
DROP POLICY IF EXISTS "Authenticated users can view competition roles" ON public.competition_roles;
DROP POLICY IF EXISTS "Authenticated can view competition roles" ON public.competition_roles;

-- 2. competition_judges: restrict SELECT
DROP POLICY IF EXISTS "Authenticated can view competition judges" ON public.competition_judges;
DROP POLICY IF EXISTS "Anyone can view competition judges" ON public.competition_judges;

CREATE POLICY "Scoped view competition judges"
ON public.competition_judges FOR SELECT TO authenticated
USING (
  judge_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.competitions c
    WHERE c.id = competition_judges.competition_id
    AND c.organizer_id = auth.uid()
  )
  OR public.is_admin(auth.uid())
);

-- 3. exhibition_schedule_registrations: drop blanket policy
DROP POLICY IF EXISTS "Authenticated can view schedule registrations" ON public.exhibition_schedule_registrations;

-- 4. live_session_attendees: restrict SELECT
DROP POLICY IF EXISTS "Authenticated can view live session attendees" ON public.live_session_attendees;

CREATE POLICY "Scoped view live session attendees"
ON public.live_session_attendees FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.live_sessions ls
    WHERE ls.id = live_session_attendees.session_id
    AND ls.host_id = auth.uid()
  )
  OR public.is_admin(auth.uid())
);

-- 5. entity_followers: restrict SELECT
DROP POLICY IF EXISTS "Authenticated can view entity followers" ON public.entity_followers;
DROP POLICY IF EXISTS "Anyone can view entity followers" ON public.entity_followers;
DROP POLICY IF EXISTS "Authenticated users can view followers" ON public.entity_followers;

CREATE POLICY "Scoped view entity followers"
ON public.entity_followers FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_admin(auth.uid())
);

-- 6. exhibition_followers: restrict SELECT
DROP POLICY IF EXISTS "Authenticated can view exhibition followers" ON public.exhibition_followers;
DROP POLICY IF EXISTS "Anyone can view exhibition followers" ON public.exhibition_followers;
DROP POLICY IF EXISTS "Authenticated users can view exhibition followers" ON public.exhibition_followers;

CREATE POLICY "Scoped view exhibition followers"
ON public.exhibition_followers FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_admin(auth.uid())
);
