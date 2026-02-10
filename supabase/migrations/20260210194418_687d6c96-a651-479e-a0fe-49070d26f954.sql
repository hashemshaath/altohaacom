
-- Unified QR/Barcode tracking table
CREATE TABLE public.qr_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  entity_type TEXT NOT NULL, -- 'user', 'certificate', 'invoice', 'competition', 'company'
  entity_id TEXT NOT NULL, -- ID of the linked entity
  category TEXT NOT NULL DEFAULT 'general', -- 'account', 'certificate', 'invoice', 'competition', 'company'
  metadata JSONB DEFAULT '{}',
  scan_count INTEGER NOT NULL DEFAULT 0,
  last_scanned_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index for fast lookups
CREATE INDEX idx_qr_codes_code ON public.qr_codes(code);
CREATE INDEX idx_qr_codes_entity ON public.qr_codes(entity_type, entity_id);
CREATE INDEX idx_qr_codes_category ON public.qr_codes(category);

-- Enable RLS
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can read active QR codes (for public verification)
CREATE POLICY "Anyone can verify QR codes"
ON public.qr_codes FOR SELECT
USING (is_active = true);

-- Authenticated users can create QR codes
CREATE POLICY "Authenticated users can create QR codes"
ON public.qr_codes FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own QR codes
CREATE POLICY "Users can update own QR codes"
ON public.qr_codes FOR UPDATE
USING (created_by = auth.uid());

-- Admins can manage all
CREATE POLICY "Admins can manage all QR codes"
ON public.qr_codes FOR ALL
USING (public.is_admin(auth.uid()));

-- QR scan log table
CREATE TABLE public.qr_scan_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_code_id UUID NOT NULL REFERENCES public.qr_codes(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  scanned_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_qr_scan_logs_qr ON public.qr_scan_logs(qr_code_id);
CREATE INDEX idx_qr_scan_logs_code ON public.qr_scan_logs(code);

ALTER TABLE public.qr_scan_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can insert scan logs (public verification)
CREATE POLICY "Anyone can log scans"
ON public.qr_scan_logs FOR INSERT
WITH CHECK (true);

-- Only admins can read scan logs
CREATE POLICY "Admins can read scan logs"
ON public.qr_scan_logs FOR SELECT
USING (public.is_admin(auth.uid()));

-- Secure RPC for public verification that increments scan count
CREATE OR REPLACE FUNCTION public.verify_qr_code(p_code TEXT)
RETURNS TABLE(
  id UUID,
  code TEXT,
  entity_type TEXT,
  entity_id TEXT,
  category TEXT,
  metadata JSONB,
  scan_count INTEGER,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Increment scan count
  UPDATE qr_codes SET 
    scan_count = qr_codes.scan_count + 1,
    last_scanned_at = now()
  WHERE qr_codes.code = UPPER(p_code) AND qr_codes.is_active = true;

  RETURN QUERY
  SELECT q.id, q.code, q.entity_type, q.entity_id, q.category, 
         q.metadata, q.scan_count, q.is_active, q.created_at
  FROM qr_codes q
  WHERE q.code = UPPER(p_code) AND q.is_active = true;
END;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.verify_qr_code(TEXT) TO anon, authenticated;

-- Function to generate unique QR code based on category
CREATE OR REPLACE FUNCTION public.generate_qr_code(p_prefix TEXT DEFAULT 'QR')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := UPPER(p_prefix) || UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM qr_codes WHERE code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_qr_codes_updated_at
BEFORE UPDATE ON public.qr_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
