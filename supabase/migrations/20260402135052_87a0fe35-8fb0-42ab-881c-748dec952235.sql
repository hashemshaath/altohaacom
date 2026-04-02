
-- QR codes: restrict public access
DROP POLICY IF EXISTS "Anyone can verify QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Users can view own QR codes" ON public.qr_codes;

CREATE POLICY "Users can view own QR codes"
ON public.qr_codes FOR SELECT TO authenticated
USING (created_by = auth.uid() OR is_admin(auth.uid()));

-- Drop existing function first, then recreate
DROP FUNCTION IF EXISTS public.verify_qr_code(text);

CREATE FUNCTION public.verify_qr_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'valid', true,
    'entity_type', entity_type,
    'entity_id', entity_id,
    'category', category
  ) INTO result
  FROM public.qr_codes
  WHERE code = p_code AND is_active = true;
  
  IF result IS NULL THEN
    RETURN jsonb_build_object('valid', false);
  END IF;
  RETURN result;
END;
$$;

-- Remove entity_positions from Realtime
ALTER PUBLICATION supabase_realtime DROP TABLE public.entity_positions;
