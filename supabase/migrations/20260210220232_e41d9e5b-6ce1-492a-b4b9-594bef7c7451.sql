
-- ============================================================
-- UNIFIED ROLE & PERMISSION SYSTEM RESTRUCTURE
-- ============================================================

-- 1. PERMISSIONS TABLE
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view permissions"
  ON public.permissions FOR SELECT USING (true);

CREATE POLICY "Admins can manage permissions"
  ON public.permissions FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

-- 2. ROLE_PERMISSIONS
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (role, permission_id)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view role permissions"
  ON public.role_permissions FOR SELECT USING (true);

CREATE POLICY "Admins can manage role permissions"
  ON public.role_permissions FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

-- 3. USER_PERMISSION_OVERRIDES
CREATE TABLE public.user_permission_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted BOOLEAN NOT NULL DEFAULT true,
  granted_by UUID REFERENCES auth.users(id),
  reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, permission_id)
);

ALTER TABLE public.user_permission_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own overrides"
  ON public.user_permission_overrides FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage overrides"
  ON public.user_permission_overrides FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

-- 4. USER_TITLES
CREATE TABLE public.user_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title_type TEXT NOT NULL CHECK (title_type IN ('professional', 'academic', 'honorary', 'certification')),
  title TEXT NOT NULL,
  title_ar TEXT,
  issuing_body TEXT,
  issuing_body_ar TEXT,
  establishment_id UUID REFERENCES public.establishments(id),
  issued_date DATE,
  expiry_date DATE,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_titles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all titles" ON public.user_titles FOR SELECT USING (true);
CREATE POLICY "Users can manage own titles" ON public.user_titles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own titles" ON public.user_titles FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Users can delete own titles" ON public.user_titles FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- 5. COMPETITION_ROLES
CREATE TABLE public.competition_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('judge', 'head_judge', 'participant', 'volunteer', 'assistant', 'observer', 'coordinator', 'mentor')),
  assigned_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'revoked')),
  notes TEXT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  UNIQUE (competition_id, user_id, role)
);

ALTER TABLE public.competition_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view competition roles" ON public.competition_roles FOR SELECT USING (true);

CREATE POLICY "Organizers and admins can manage competition roles"
  ON public.competition_roles FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_id AND c.organizer_id = auth.uid())
  );

CREATE POLICY "Organizers and admins can update competition roles"
  ON public.competition_roles FOR UPDATE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_id AND c.organizer_id = auth.uid())
  );

CREATE POLICY "Organizers and admins can delete competition roles"
  ON public.competition_roles FOR DELETE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.competitions c WHERE c.id = competition_id AND c.organizer_id = auth.uid())
  );

-- 6. USER_AFFILIATIONS
CREATE TABLE public.user_affiliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliation_type TEXT NOT NULL CHECK (affiliation_type IN ('establishment', 'company')),
  establishment_id UUID REFERENCES public.establishments(id),
  company_id UUID REFERENCES public.companies(id),
  role_in_org TEXT,
  role_in_org_ar TEXT,
  department TEXT,
  department_ar TEXT,
  is_current BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_affiliations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view affiliations" ON public.user_affiliations FOR SELECT USING (true);
CREATE POLICY "Users can manage own affiliations" ON public.user_affiliations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own affiliations" ON public.user_affiliations FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Users can delete own affiliations" ON public.user_affiliations FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- 7. Indexes
CREATE INDEX idx_role_permissions_role ON public.role_permissions(role);
CREATE INDEX idx_user_permission_overrides_user ON public.user_permission_overrides(user_id);
CREATE INDEX idx_user_titles_user ON public.user_titles(user_id);
CREATE INDEX idx_competition_roles_competition ON public.competition_roles(competition_id);
CREATE INDEX idx_competition_roles_user ON public.competition_roles(user_id);
CREATE INDEX idx_user_affiliations_user ON public.user_affiliations(user_id);
CREATE INDEX idx_user_affiliations_establishment ON public.user_affiliations(establishment_id);
CREATE INDEX idx_user_affiliations_company ON public.user_affiliations(company_id);

-- 8. Permission check function
CREATE OR REPLACE FUNCTION public.user_has_permission(p_user_id UUID, p_permission_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_override BOOLEAN;
  v_has_via_role BOOLEAN;
BEGIN
  SELECT granted INTO v_override
  FROM public.user_permission_overrides upo
  JOIN public.permissions p ON p.id = upo.permission_id
  WHERE upo.user_id = p_user_id AND p.code = p_permission_code
    AND (upo.expires_at IS NULL OR upo.expires_at > now())
  LIMIT 1;

  IF v_override IS NOT NULL THEN RETURN v_override; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = p_user_id AND p.code = p_permission_code
  ) INTO v_has_via_role;

  RETURN v_has_via_role;
END;
$$;

-- 9. Competition role helper
CREATE OR REPLACE FUNCTION public.get_user_competition_role(p_user_id UUID, p_competition_id UUID)
RETURNS TEXT[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(ARRAY_AGG(role), ARRAY[]::TEXT[])
  FROM public.competition_roles
  WHERE user_id = p_user_id AND competition_id = p_competition_id AND status = 'active';
$$;

-- 10. Seed default permissions
INSERT INTO public.permissions (code, name, name_ar, category) VALUES
  ('competition.create', 'Create Competition', 'إنشاء مسابقة', 'competition'),
  ('competition.edit', 'Edit Competition', 'تعديل مسابقة', 'competition'),
  ('competition.delete', 'Delete Competition', 'حذف مسابقة', 'competition'),
  ('competition.manage_roles', 'Manage Competition Roles', 'إدارة أدوار المسابقة', 'competition'),
  ('competition.register', 'Register for Competition', 'التسجيل في مسابقة', 'competition'),
  ('judging.score', 'Score Entries', 'تقييم المشاركات', 'judging'),
  ('judging.view_scores', 'View All Scores', 'عرض جميع التقييمات', 'judging'),
  ('judging.finalize', 'Finalize Results', 'اعتماد النتائج', 'judging'),
  ('community.post', 'Create Posts', 'إنشاء منشورات', 'community'),
  ('community.moderate', 'Moderate Content', 'إدارة المحتوى', 'community'),
  ('community.create_group', 'Create Groups', 'إنشاء مجموعات', 'community'),
  ('admin.dashboard', 'Access Admin Dashboard', 'الوصول للوحة الإدارة', 'admin'),
  ('admin.manage_users', 'Manage Users', 'إدارة المستخدمين', 'admin'),
  ('admin.manage_roles', 'Manage Roles', 'إدارة الأدوار', 'admin'),
  ('admin.system_settings', 'System Settings', 'إعدادات النظام', 'admin'),
  ('certificate.issue', 'Issue Certificates', 'إصدار شهادات', 'certificate'),
  ('certificate.verify', 'Verify Certificates', 'التحقق من الشهادات', 'certificate'),
  ('tasting.create', 'Create Tasting Session', 'إنشاء جلسة تذوق', 'tasting'),
  ('tasting.evaluate', 'Evaluate Tastings', 'تقييم التذوق', 'tasting'),
  ('exhibition.create', 'Create Exhibition', 'إنشاء معرض', 'exhibition'),
  ('exhibition.manage', 'Manage Exhibition', 'إدارة معرض', 'exhibition'),
  ('masterclass.create', 'Create Masterclass', 'إنشاء دورة', 'masterclass'),
  ('masterclass.enroll', 'Enroll in Masterclass', 'التسجيل في دورة', 'masterclass'),
  ('mentorship.mentor', 'Act as Mentor', 'العمل كمرشد', 'mentorship'),
  ('mentorship.request', 'Request Mentorship', 'طلب إرشاد', 'mentorship'),
  ('shop.sell', 'Sell Products', 'بيع منتجات', 'shop'),
  ('shop.purchase', 'Purchase Products', 'شراء منتجات', 'shop');

-- 11. Seed role → permission mappings
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'chef', id FROM public.permissions WHERE code IN (
  'competition.register', 'community.post', 'community.create_group',
  'masterclass.enroll', 'mentorship.request', 'shop.sell', 'shop.purchase', 'tasting.evaluate'
);

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'judge', id FROM public.permissions WHERE code IN (
  'judging.score', 'judging.view_scores', 'community.post',
  'tasting.evaluate', 'masterclass.enroll', 'mentorship.mentor'
);

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'student', id FROM public.permissions WHERE code IN (
  'competition.register', 'community.post', 'masterclass.enroll',
  'mentorship.request', 'shop.purchase'
);

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'organizer', id FROM public.permissions WHERE code IN (
  'competition.create', 'competition.edit', 'competition.manage_roles',
  'judging.finalize', 'judging.view_scores', 'community.post', 'community.moderate',
  'certificate.issue', 'tasting.create', 'exhibition.create', 'exhibition.manage',
  'masterclass.create', 'admin.dashboard', 'admin.manage_users', 'admin.manage_roles'
);

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'volunteer', id FROM public.permissions WHERE code IN ('community.post', 'community.moderate');

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'sponsor', id FROM public.permissions WHERE code IN ('community.post', 'shop.purchase');

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'assistant', id FROM public.permissions WHERE code IN ('community.post', 'community.moderate', 'admin.dashboard');

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'supervisor', id FROM public.permissions;

-- 12. Triggers
CREATE TRIGGER update_user_titles_updated_at
  BEFORE UPDATE ON public.user_titles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_affiliations_updated_at
  BEFORE UPDATE ON public.user_affiliations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
