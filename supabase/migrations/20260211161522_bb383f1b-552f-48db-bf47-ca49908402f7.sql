
-- 1. Add entry_type and fee/payment fields to competition_registrations
ALTER TABLE public.competition_registrations
  ADD COLUMN IF NOT EXISTS entry_type text NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS team_name text,
  ADD COLUMN IF NOT EXISTS team_name_ar text,
  ADD COLUMN IF NOT EXISTS organization_id uuid,
  ADD COLUMN IF NOT EXISTS organization_name text,
  ADD COLUMN IF NOT EXISTS organization_name_ar text,
  ADD COLUMN IF NOT EXISTS organization_type text,
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS payment_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS tax_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS notes text;

-- 2. Create registration_team_members linking registration to team members
CREATE TABLE IF NOT EXISTS public.registration_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES public.competition_registrations(id) ON DELETE CASCADE,
  user_id uuid,
  member_name text NOT NULL,
  member_name_ar text,
  role_in_team text DEFAULT 'member',
  job_title text,
  job_title_ar text,
  avatar_url text,
  email text,
  phone text,
  is_captain boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.registration_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rtm_select" ON public.registration_team_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "rtm_insert" ON public.registration_team_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.competition_registrations cr WHERE cr.id = registration_id AND cr.participant_id = auth.uid())
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "rtm_update" ON public.registration_team_members
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.competition_registrations cr WHERE cr.id = registration_id AND cr.participant_id = auth.uid())
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "rtm_delete" ON public.registration_team_members
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.competition_registrations cr WHERE cr.id = registration_id AND cr.participant_id = auth.uid())
    OR public.is_admin(auth.uid())
  );

-- 3. Add registration fee fields to competitions table
ALTER TABLE public.competitions
  ADD COLUMN IF NOT EXISTS registration_fee_type text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS registration_fee numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS registration_currency text,
  ADD COLUMN IF NOT EXISTS registration_tax_rate numeric,
  ADD COLUMN IF NOT EXISTS registration_tax_name text,
  ADD COLUMN IF NOT EXISTS registration_tax_name_ar text,
  ADD COLUMN IF NOT EXISTS allowed_entry_types text[] DEFAULT '{individual}',
  ADD COLUMN IF NOT EXISTS max_team_size integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS min_team_size integer DEFAULT 2;

-- 4. Unique constraint to prevent duplicate registrations
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_registration
  ON public.competition_registrations (competition_id, participant_id, COALESCE(category_id, '00000000-0000-0000-0000-000000000000'));
