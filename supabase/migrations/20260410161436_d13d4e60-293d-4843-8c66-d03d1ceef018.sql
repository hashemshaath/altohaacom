
-- 1. Remove public policy on chefs_table_sessions (retry)
DROP POLICY IF EXISTS "Public read published sessions" ON public.chefs_table_sessions;

-- 2. Remove blanket tasting policy (retry)
DROP POLICY IF EXISTS "Authenticated can view tasting sessions" ON public.tasting_sessions;

-- 3. Safe view for judges excluding payment data
DROP VIEW IF EXISTS public.competition_registrations_judge;
CREATE VIEW public.competition_registrations_judge
WITH (security_invoker = on) AS
SELECT id, competition_id, category_id, participant_id,
  status, registration_number, dish_name, dish_description, dish_image_url,
  registered_at, entry_type, team_name, team_name_ar,
  organization_name, organization_name_ar, organization_type
FROM public.competition_registrations;
