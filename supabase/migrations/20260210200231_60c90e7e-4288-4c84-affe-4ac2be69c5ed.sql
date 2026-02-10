-- Update verify_qr_code to also log scans
CREATE OR REPLACE FUNCTION public.verify_qr_code(p_code TEXT)
RETURNS TABLE(
  id UUID, code TEXT, entity_type TEXT, entity_id TEXT, 
  category TEXT, metadata JSONB, scan_count INTEGER, 
  is_active BOOLEAN, created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_qr_id UUID;
BEGIN
  -- Get QR code ID
  SELECT q.id INTO v_qr_id 
  FROM qr_codes q 
  WHERE q.code = UPPER(p_code) AND q.is_active = true;

  IF v_qr_id IS NOT NULL THEN
    -- Increment scan count
    UPDATE qr_codes SET 
      scan_count = qr_codes.scan_count + 1,
      last_scanned_at = now()
    WHERE qr_codes.id = v_qr_id;

    -- Log the scan
    INSERT INTO qr_scan_logs (qr_code_id, code)
    VALUES (v_qr_id, UPPER(p_code));
  END IF;

  RETURN QUERY
  SELECT q.id, q.code, q.entity_type, q.entity_id, q.category, 
         q.metadata, q.scan_count, q.is_active, q.created_at
  FROM qr_codes q
  WHERE q.code = UPPER(p_code) AND q.is_active = true;
END;
$$;