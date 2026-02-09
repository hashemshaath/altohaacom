-- Create certificate type enum
CREATE TYPE public.certificate_type AS ENUM (
  'participation',
  'winner_gold',
  'winner_silver', 
  'winner_bronze',
  'appreciation',
  'organizer',
  'judge',
  'sponsor',
  'volunteer'
);

-- Create certificate status enum
CREATE TYPE public.certificate_status AS ENUM (
  'draft',
  'pending_signature',
  'signed',
  'issued',
  'revoked'
);

-- Certificate templates table
CREATE TABLE public.certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT,
  type certificate_type NOT NULL,
  description TEXT,
  description_ar TEXT,
  -- Design settings
  background_color TEXT DEFAULT '#ffffff',
  border_style TEXT DEFAULT 'elegant',
  border_color TEXT DEFAULT '#c9a227',
  title_font TEXT DEFAULT 'serif',
  body_font TEXT DEFAULT 'sans-serif',
  -- Content templates
  title_text TEXT NOT NULL DEFAULT 'Certificate of Appreciation',
  title_text_ar TEXT,
  body_template TEXT NOT NULL,
  body_template_ar TEXT,
  -- Logo positions
  header_logos JSONB DEFAULT '[]'::jsonb,
  footer_logos JSONB DEFAULT '[]'::jsonb,
  -- Signature settings
  signature_positions JSONB DEFAULT '[]'::jsonb,
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Authorized signatures table
CREATE TABLE public.certificate_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT,
  title TEXT NOT NULL,
  title_ar TEXT,
  organization TEXT,
  organization_ar TEXT,
  signature_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Organization logos table
CREATE TABLE public.certificate_logos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT,
  logo_url TEXT NOT NULL,
  organization TEXT,
  is_sponsor BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Issued certificates table
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_number TEXT NOT NULL UNIQUE,
  verification_code TEXT NOT NULL UNIQUE,
  template_id UUID REFERENCES certificate_templates(id) NOT NULL,
  competition_id UUID REFERENCES competitions(id),
  -- Recipient info
  recipient_id UUID REFERENCES auth.users(id),
  recipient_name TEXT NOT NULL,
  recipient_name_ar TEXT,
  recipient_email TEXT,
  -- Certificate details
  type certificate_type NOT NULL,
  achievement TEXT,
  achievement_ar TEXT,
  event_name TEXT,
  event_name_ar TEXT,
  event_location TEXT,
  event_location_ar TEXT,
  event_date DATE,
  -- Signatures applied
  signatures JSONB DEFAULT '[]'::jsonb,
  -- Logos applied
  logos JSONB DEFAULT '[]'::jsonb,
  -- Status
  status certificate_status DEFAULT 'draft',
  issued_at TIMESTAMPTZ,
  issued_by UUID REFERENCES auth.users(id),
  signed_at TIMESTAMPTZ,
  signed_by UUID REFERENCES auth.users(id),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),
  revoke_reason TEXT,
  -- Delivery
  sent_at TIMESTAMPTZ,
  sent_to_email TEXT,
  downloaded_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Certificate verification log
CREATE TABLE public.certificate_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id UUID REFERENCES certificates(id) NOT NULL,
  verification_code TEXT NOT NULL,
  verified_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for templates
CREATE POLICY "Admins can manage templates"
ON public.certificate_templates FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view active templates"
ON public.certificate_templates FOR SELECT
USING (is_active = true);

-- RLS Policies for signatures
CREATE POLICY "Admins can manage signatures"
ON public.certificate_signatures FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view active signatures"
ON public.certificate_signatures FOR SELECT
USING (is_active = true);

-- RLS Policies for logos
CREATE POLICY "Admins can manage logos"
ON public.certificate_logos FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view active logos"
ON public.certificate_logos FOR SELECT
USING (is_active = true);

-- RLS Policies for certificates
CREATE POLICY "Admins can manage certificates"
ON public.certificates FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Recipients can view their certificates"
ON public.certificates FOR SELECT
USING (recipient_id = auth.uid() AND status = 'issued');

CREATE POLICY "Public can verify issued certificates"
ON public.certificates FOR SELECT
USING (status = 'issued');

-- RLS Policies for verifications
CREATE POLICY "Anyone can log verification"
ON public.certificate_verifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view verifications"
ON public.certificate_verifications FOR SELECT
USING (is_admin(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_certificate_templates_updated_at
BEFORE UPDATE ON public.certificate_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificate_signatures_updated_at
BEFORE UPDATE ON public.certificate_signatures
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at
BEFORE UPDATE ON public.certificates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate certificate number
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year INTEGER;
  v_count INTEGER;
BEGIN
  v_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  SELECT COUNT(*) + 1 INTO v_count
  FROM certificates
  WHERE EXTRACT(YEAR FROM created_at) = v_year;
  
  RETURN 'CERT-' || v_year || '-' || LPAD(v_count::TEXT, 5, '0');
END;
$$;

-- Function to generate verification code
CREATE OR REPLACE FUNCTION public.generate_verification_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT) FROM 1 FOR 8));
END;
$$;