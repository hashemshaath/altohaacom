
-- =============================================
-- Company Employee Roles & Invitation System
-- =============================================

-- Company contact roles for granular permissions
CREATE TYPE public.company_contact_role AS ENUM ('owner', 'admin', 'manager', 'editor', 'viewer');

-- Add role and invitation columns to company_contacts
ALTER TABLE public.company_contacts
  ADD COLUMN IF NOT EXISTS role company_contact_role DEFAULT 'viewer',
  ADD COLUMN IF NOT EXISTS invited_by uuid,
  ADD COLUMN IF NOT EXISTS invitation_status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS invitation_token text,
  ADD COLUMN IF NOT EXISTS invited_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Company employee invitations table
CREATE TABLE IF NOT EXISTS public.company_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email text NOT NULL,
  role company_contact_role DEFAULT 'viewer',
  invited_by uuid NOT NULL,
  token text NOT NULL DEFAULT UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT) FROM 1 FOR 12)),
  status text NOT NULL DEFAULT 'pending',
  message text,
  message_ar text,
  department text,
  title text,
  title_ar text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + INTERVAL '7 days',
  accepted_at timestamptz,
  accepted_by uuid,
  UNIQUE(company_id, email, status)
);

-- Enable RLS
ALTER TABLE public.company_invitations ENABLE ROW LEVEL SECURITY;

-- RLS: Company contacts can view their company's invitations
CREATE POLICY "Company members can view invitations"
  ON public.company_invitations FOR SELECT
  USING (
    company_id IN (SELECT company_id FROM public.company_contacts WHERE user_id = auth.uid())
    OR public.is_admin_user()
  );

-- RLS: Company admins/owners can create invitations
CREATE POLICY "Company admins can create invitations"
  ON public.company_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_contacts
      WHERE company_id = company_invitations.company_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin', 'manager')
    )
    OR public.is_admin_user()
  );

-- RLS: Company admins can update invitations
CREATE POLICY "Company admins can update invitations"
  ON public.company_invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.company_contacts
      WHERE company_id = company_invitations.company_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin', 'manager')
    )
    OR public.is_admin_user()
  );

-- RLS: Company admins can delete invitations
CREATE POLICY "Company admins can delete invitations"
  ON public.company_invitations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.company_contacts
      WHERE company_id = company_invitations.company_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
    OR public.is_admin_user()
  );

-- Homepage sponsor showcase table (extends partner_logos for dedicated sponsor section)
CREATE TABLE IF NOT EXISTS public.homepage_sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_ar text,
  logo_url text NOT NULL,
  website_url text,
  tier text DEFAULT 'silver',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  starts_at timestamptz DEFAULT now(),
  ends_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.homepage_sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active homepage sponsors"
  ON public.homepage_sponsors FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage homepage sponsors"
  ON public.homepage_sponsors FOR ALL
  USING (public.is_admin_user());
