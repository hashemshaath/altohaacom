
-- 1. tasting_entries: secure view hiding chef identity during blind tasting
DROP VIEW IF EXISTS public.tasting_entries_public;
CREATE VIEW public.tasting_entries_public WITH (security_invoker = on) AS
SELECT
  te.id, te.session_id, te.dish_name, te.dish_name_ar,
  te.description, te.description_ar, te.category,
  te.entry_number, te.photo_url, te.images,
  te.is_active, te.sort_order, te.stage, te.created_at,
  CASE WHEN ts.is_blind_tasting = true THEN NULL ELSE te.chef_id END AS chef_id,
  CASE WHEN ts.is_blind_tasting = true THEN NULL ELSE te.chef_name END AS chef_name,
  CASE WHEN ts.is_blind_tasting = true THEN NULL ELSE te.chef_name_ar END AS chef_name_ar
FROM public.tasting_entries te
JOIN public.tasting_sessions ts ON ts.id = te.session_id;

GRANT SELECT ON public.tasting_entries_public TO anon, authenticated;

-- 2. event_attendees: restrict SELECT
DROP POLICY IF EXISTS "Authenticated can view event attendees" ON public.event_attendees;
DROP POLICY IF EXISTS "Anyone can view event attendees" ON public.event_attendees;

CREATE POLICY "Scoped view event attendees"
ON public.event_attendees FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_admin(auth.uid())
);

-- 3. post_likes: restrict to authenticated only, drop duplicates
DROP POLICY IF EXISTS "Anyone can view likes" ON public.post_likes;
DROP POLICY IF EXISTS "Authenticated can view likes" ON public.post_likes;
DROP POLICY IF EXISTS "Authenticated can view post likes" ON public.post_likes;
DROP POLICY IF EXISTS "Anyone can view post likes" ON public.post_likes;

CREATE POLICY "Authenticated can view post likes"
ON public.post_likes FOR SELECT TO authenticated
USING (true);

-- 4. article_reactions: restrict to authenticated only
DROP POLICY IF EXISTS "Anyone can read article reactions" ON public.article_reactions;
DROP POLICY IF EXISTS "Anyone can view article reactions" ON public.article_reactions;

CREATE POLICY "Authenticated can view article reactions"
ON public.article_reactions FOR SELECT TO authenticated
USING (true);
