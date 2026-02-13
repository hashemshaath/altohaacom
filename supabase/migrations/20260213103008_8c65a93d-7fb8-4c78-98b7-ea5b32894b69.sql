-- ========================================
-- SECURITY HARDENING MIGRATION
-- ========================================

-- 1. Create a public-safe view for profiles (hide PII from non-owners)
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
  SELECT 
    id, user_id, full_name, full_name_ar, username,
    display_name, display_name_ar,
    avatar_url, cover_image_url, bio, bio_ar,
    specialization, specialization_ar,
    country_code, city, nationality,
    account_number, account_status,
    years_of_experience, experience_level,
    is_verified, verification_level, verification_badge,
    membership_tier, membership_status,
    website, instagram, twitter, facebook, linkedin, youtube,
    offers_services, services_description, services_description_ar,
    global_awards, created_at
    -- Excludes: email, phone, date_of_birth, gender, location, company_id
  FROM public.profiles;

-- 2. Restrict user_roles: only authenticated users can view
DROP POLICY IF EXISTS "Anyone can view roles" ON public.user_roles;

CREATE POLICY "Authenticated users can view roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

-- 3. Prevent users from self-updating privileged roles
DROP POLICY IF EXISTS "Users can insert own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update own roles" ON public.user_roles;

CREATE POLICY "Users or admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Only admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- 4. Fix ad tracking: require session_id to prevent empty spam inserts
DROP POLICY IF EXISTS "Anyone can insert clicks" ON public.ad_clicks;
CREATE POLICY "Anyone can insert clicks with session"
  ON public.ad_clicks FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND creative_id IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can insert impressions" ON public.ad_impressions;
CREATE POLICY "Anyone can insert impressions with session"
  ON public.ad_impressions FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND creative_id IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can insert behavior events" ON public.ad_user_behaviors;
CREATE POLICY "Authenticated or session behavior tracking"
  ON public.ad_user_behaviors FOR INSERT
  WITH CHECK (session_id IS NOT NULL OR user_id IS NOT NULL);

-- 5. Restrict verification audit log to authenticated users
DROP POLICY IF EXISTS "Insert audit" ON public.verification_audit_log;
CREATE POLICY "Authenticated users can insert audit"
  ON public.verification_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 6. Create a safe public view for entity_memberships (hide student_id)
CREATE OR REPLACE VIEW public.entity_memberships_public
WITH (security_invoker = on) AS
  SELECT
    id, user_id, entity_id, membership_type,
    title, title_ar, department, department_ar,
    enrollment_date, graduation_date,
    status, is_public, notes,
    created_at, updated_at
    -- Excludes: student_id
  FROM public.entity_memberships
  WHERE is_public = true;