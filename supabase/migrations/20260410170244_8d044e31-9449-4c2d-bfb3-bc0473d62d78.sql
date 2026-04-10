
-- Drop old function with different return type
DROP FUNCTION IF EXISTS public.verify_certificate(text);

-- Recreate with jsonb return
CREATE OR REPLACE FUNCTION public.verify_certificate(p_code text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', c.id,
    'certificate_number', c.certificate_number,
    'recipient_name', c.recipient_name,
    'recipient_name_ar', c.recipient_name_ar,
    'type', c.type,
    'status', c.status,
    'achievement', c.achievement,
    'achievement_ar', c.achievement_ar,
    'event_name', c.event_name,
    'event_name_ar', c.event_name_ar,
    'event_date', c.event_date,
    'event_location', c.event_location,
    'event_location_ar', c.event_location_ar,
    'issued_at', c.issued_at,
    'verification_code', c.verification_code,
    'visibility', c.visibility
  )
  FROM public.certificates c
  WHERE c.verification_code = p_code
    AND c.status = 'issued'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.verify_certificate(text) TO anon, authenticated;
