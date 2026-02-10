
-- ═══════════════════════════════════════════════════════
-- COUNTRIES INFRASTRUCTURE FOR GLOBAL EXPANSION
-- ═══════════════════════════════════════════════════════

-- 1. Countries master table
CREATE TABLE public.countries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code CHAR(2) NOT NULL UNIQUE,
  code_alpha3 CHAR(3) UNIQUE,
  name TEXT NOT NULL,
  name_ar TEXT,
  name_local TEXT,
  flag_emoji TEXT,
  continent TEXT,
  region TEXT,
  
  default_language TEXT NOT NULL DEFAULT 'en',
  supported_languages TEXT[] NOT NULL DEFAULT '{en}',
  currency_code CHAR(3) NOT NULL DEFAULT 'USD',
  currency_symbol TEXT NOT NULL DEFAULT '$',
  currency_name TEXT,
  currency_name_ar TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  date_format TEXT DEFAULT 'yyyy-MM-dd',
  phone_code TEXT,
  phone_format TEXT,
  
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  launch_date DATE,
  sort_order INTEGER DEFAULT 0,
  
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_name TEXT DEFAULT 'VAT',
  tax_name_ar TEXT DEFAULT 'ضريبة القيمة المضافة',
  requires_tax_number BOOLEAN DEFAULT false,
  data_residency_notes TEXT,
  
  features JSONB NOT NULL DEFAULT '{"competitions":true,"exhibitions":true,"shop":true,"masterclasses":true,"community":true,"company_portal":true,"judging":true,"certificates":true,"knowledge_portal":true}'::jsonb,
  
  support_email TEXT,
  support_phone TEXT,
  local_office_address TEXT,
  local_office_address_ar TEXT,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Countries are publicly readable"
  ON public.countries FOR SELECT USING (true);

CREATE POLICY "Admins can insert countries"
  ON public.countries FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update countries"
  ON public.countries FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete countries"
  ON public.countries FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_countries_updated_at
  BEFORE UPDATE ON public.countries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_countries_code ON public.countries(code);
CREATE INDEX idx_countries_active ON public.countries(is_active) WHERE is_active = true;
CREATE INDEX idx_countries_region ON public.countries(region);

-- 2. Country-specific services config
CREATE TABLE public.country_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_id UUID NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  service_key TEXT NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(country_id, service_type, service_key)
);

ALTER TABLE public.country_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Country services are publicly readable"
  ON public.country_services FOR SELECT USING (true);

CREATE POLICY "Admins can manage country services insert"
  ON public.country_services FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage country services update"
  ON public.country_services FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage country services delete"
  ON public.country_services FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- 3. Add country fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country_code CHAR(2),
  ADD COLUMN IF NOT EXISTS nationality TEXT,
  ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

-- 4. Add operating countries to companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS operating_countries TEXT[] DEFAULT '{}';

-- 5. Seed initial countries
INSERT INTO public.countries (code, code_alpha3, name, name_ar, flag_emoji, continent, region, default_language, supported_languages, currency_code, currency_symbol, currency_name, currency_name_ar, timezone, phone_code, is_active, is_featured, sort_order, tax_rate, tax_name, requires_tax_number) VALUES
  ('SA', 'SAU', 'Saudi Arabia', 'المملكة العربية السعودية', '🇸🇦', 'Asia', 'GCC', 'ar', '{ar,en}', 'SAR', '﷼', 'Saudi Riyal', 'ريال سعودي', 'Asia/Riyadh', '+966', true, true, 1, 15.00, 'VAT', true),
  ('AE', 'ARE', 'United Arab Emirates', 'الإمارات العربية المتحدة', '🇦🇪', 'Asia', 'GCC', 'ar', '{ar,en}', 'AED', 'د.إ', 'UAE Dirham', 'درهم إماراتي', 'Asia/Dubai', '+971', true, true, 2, 5.00, 'VAT', true),
  ('KW', 'KWT', 'Kuwait', 'الكويت', '🇰🇼', 'Asia', 'GCC', 'ar', '{ar,en}', 'KWD', 'د.ك', 'Kuwaiti Dinar', 'دينار كويتي', 'Asia/Kuwait', '+965', false, false, 3, 0, 'VAT', false),
  ('QA', 'QAT', 'Qatar', 'قطر', '🇶🇦', 'Asia', 'GCC', 'ar', '{ar,en}', 'QAR', 'ر.ق', 'Qatari Riyal', 'ريال قطري', 'Asia/Qatar', '+974', false, false, 4, 0, 'VAT', false),
  ('BH', 'BHR', 'Bahrain', 'البحرين', '🇧🇭', 'Asia', 'GCC', 'ar', '{ar,en}', 'BHD', '.د.ب', 'Bahraini Dinar', 'دينار بحريني', 'Asia/Bahrain', '+973', false, false, 5, 10.00, 'VAT', true),
  ('OM', 'OMN', 'Oman', 'عُمان', '🇴🇲', 'Asia', 'GCC', 'ar', '{ar,en}', 'OMR', 'ر.ع', 'Omani Rial', 'ريال عماني', 'Asia/Muscat', '+968', false, false, 6, 5.00, 'VAT', true),
  ('EG', 'EGY', 'Egypt', 'مصر', '🇪🇬', 'Africa', 'MENA', 'ar', '{ar,en}', 'EGP', 'ج.م', 'Egyptian Pound', 'جنيه مصري', 'Africa/Cairo', '+20', false, false, 10, 14.00, 'VAT', true),
  ('JO', 'JOR', 'Jordan', 'الأردن', '🇯🇴', 'Asia', 'MENA', 'ar', '{ar,en}', 'JOD', 'د.ا', 'Jordanian Dinar', 'دينار أردني', 'Asia/Amman', '+962', false, false, 11, 16.00, 'GST', true),
  ('LB', 'LBN', 'Lebanon', 'لبنان', '🇱🇧', 'Asia', 'MENA', 'ar', '{ar,en,fr}', 'LBP', 'ل.ل', 'Lebanese Pound', 'ليرة لبنانية', 'Asia/Beirut', '+961', false, false, 12, 11.00, 'VAT', false),
  ('TN', 'TUN', 'Tunisia', 'تونس', '🇹🇳', 'Africa', 'MENA', 'ar', '{ar,fr,en}', 'TND', 'د.ت', 'Tunisian Dinar', 'دينار تونسي', 'Africa/Tunis', '+216', false, false, 13, 19.00, 'VAT', true),
  ('MA', 'MAR', 'Morocco', 'المغرب', '🇲🇦', 'Africa', 'MENA', 'ar', '{ar,fr,en}', 'MAD', 'د.م', 'Moroccan Dirham', 'درهم مغربي', 'Africa/Casablanca', '+212', false, false, 14, 20.00, 'VAT', true),
  ('TR', 'TUR', 'Turkey', 'تركيا', '🇹🇷', 'Asia', 'Europe', 'tr', '{tr,en}', 'TRY', '₺', 'Turkish Lira', 'ليرة تركية', 'Europe/Istanbul', '+90', false, false, 20, 20.00, 'KDV', true),
  ('GB', 'GBR', 'United Kingdom', 'المملكة المتحدة', '🇬🇧', 'Europe', 'Europe', 'en', '{en}', 'GBP', '£', 'British Pound', 'جنيه إسترليني', 'Europe/London', '+44', false, false, 30, 20.00, 'VAT', true),
  ('FR', 'FRA', 'France', 'فرنسا', '🇫🇷', 'Europe', 'Europe', 'fr', '{fr,en}', 'EUR', '€', 'Euro', 'يورو', 'Europe/Paris', '+33', false, false, 31, 20.00, 'TVA', true),
  ('DE', 'DEU', 'Germany', 'ألمانيا', '🇩🇪', 'Europe', 'Europe', 'de', '{de,en}', 'EUR', '€', 'Euro', 'يورو', 'Europe/Berlin', '+49', false, false, 32, 19.00, 'MwSt', true),
  ('US', 'USA', 'United States', 'الولايات المتحدة', '🇺🇸', 'North America', 'Americas', 'en', '{en,es}', 'USD', '$', 'US Dollar', 'دولار أمريكي', 'America/New_York', '+1', false, false, 40, 0, 'Sales Tax', false),
  ('IN', 'IND', 'India', 'الهند', '🇮🇳', 'Asia', 'South Asia', 'en', '{en,hi}', 'INR', '₹', 'Indian Rupee', 'روبية هندية', 'Asia/Kolkata', '+91', false, false, 50, 18.00, 'GST', true),
  ('MY', 'MYS', 'Malaysia', 'ماليزيا', '🇲🇾', 'Asia', 'Southeast Asia', 'ms', '{ms,en}', 'MYR', 'RM', 'Malaysian Ringgit', 'رينغيت ماليزي', 'Asia/Kuala_Lumpur', '+60', false, false, 51, 6.00, 'SST', true),
  ('SG', 'SGP', 'Singapore', 'سنغافورة', '🇸🇬', 'Asia', 'Southeast Asia', 'en', '{en,zh,ms}', 'SGD', 'S$', 'Singapore Dollar', 'دولار سنغافوري', 'Asia/Singapore', '+65', false, false, 52, 9.00, 'GST', true),
  ('AU', 'AUS', 'Australia', 'أستراليا', '🇦🇺', 'Oceania', 'Oceania', 'en', '{en}', 'AUD', 'A$', 'Australian Dollar', 'دولار أسترالي', 'Australia/Sydney', '+61', false, false, 60, 10.00, 'GST', true);
