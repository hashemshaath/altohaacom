
-- =============================================
-- 1. FIX: Make company_id nullable on sessions
-- =============================================
ALTER TABLE public.chefs_table_sessions ALTER COLUMN company_id DROP NOT NULL;

-- =============================================
-- 2. Chef Cost Profiles (per-chef cost estimation)
-- =============================================
CREATE TABLE public.chef_cost_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_id UUID NOT NULL,
  country_code TEXT,
  city TEXT,
  -- Visa
  visa_required BOOLEAN DEFAULT false,
  visa_fee NUMERIC DEFAULT 0,
  visa_currency TEXT DEFAULT 'SAR',
  visa_valid_until DATE,
  visa_type TEXT,
  -- Transportation
  flight_cost_estimate NUMERIC DEFAULT 0,
  local_transport_cost NUMERIC DEFAULT 0,
  transport_currency TEXT DEFAULT 'SAR',
  transport_notes TEXT,
  -- Accommodation
  hotel_cost_per_night NUMERIC DEFAULT 0,
  accommodation_currency TEXT DEFAULT 'SAR',
  preferred_hotel TEXT,
  preferred_hotel_ar TEXT,
  -- Per diem / daily allowance
  daily_allowance NUMERIC DEFAULT 0,
  -- Professional fees
  evaluation_fee NUMERIC DEFAULT 0,
  fee_currency TEXT DEFAULT 'SAR',
  -- Calculated total estimate
  estimated_total_cost NUMERIC DEFAULT 0,
  estimated_days INTEGER DEFAULT 1,
  -- Meta
  notes TEXT,
  notes_ar TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(chef_id)
);

ALTER TABLE public.chef_cost_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage chef cost profiles"
  ON public.chef_cost_profiles FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE POLICY "Chefs view own cost profile"
  ON public.chef_cost_profiles FOR SELECT
  USING (auth.uid() = chef_id);

-- =============================================
-- 3. Chef Travel Records (historical visits)
-- =============================================
CREATE TABLE public.chef_travel_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_id UUID NOT NULL,
  session_id UUID REFERENCES public.chefs_table_sessions(id) ON DELETE SET NULL,
  -- Travel details
  destination_country_code TEXT,
  destination_city TEXT,
  travel_date DATE,
  return_date DATE,
  -- Costs (actual)
  flight_cost NUMERIC DEFAULT 0,
  hotel_cost NUMERIC DEFAULT 0,
  hotel_name TEXT,
  hotel_nights INTEGER DEFAULT 0,
  local_transport_cost NUMERIC DEFAULT 0,
  visa_cost NUMERIC DEFAULT 0,
  daily_allowance_total NUMERIC DEFAULT 0,
  other_costs NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'SAR',
  -- Visa info
  visa_number TEXT,
  visa_issued_date DATE,
  visa_expiry_date DATE,
  visa_type TEXT,
  -- Notes
  notes TEXT,
  notes_ar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.chef_travel_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage travel records"
  ON public.chef_travel_records FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE POLICY "Chefs view own travel records"
  ON public.chef_travel_records FOR SELECT
  USING (auth.uid() = chef_id);

-- =============================================
-- 4. Triggers for updated_at
-- =============================================
CREATE TRIGGER update_chef_cost_profiles_updated_at
  BEFORE UPDATE ON public.chef_cost_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chef_travel_records_updated_at
  BEFORE UPDATE ON public.chef_travel_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
