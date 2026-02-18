
-- Atomic function to approve a Chef's Table request and create a session
CREATE OR REPLACE FUNCTION public.approve_chefs_table_request(
  p_request_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_request RECORD;
  v_session_id UUID;
  v_admin_id UUID;
BEGIN
  v_admin_id := auth.uid();
  
  -- Verify caller is admin
  IF NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Only admins can approve requests';
  END IF;

  -- Get and lock the request
  SELECT * INTO v_request
  FROM chefs_table_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Request is not pending (current status: %)', v_request.status;
  END IF;

  -- Update request status
  UPDATE chefs_table_requests
  SET status = 'approved',
      reviewed_by = v_admin_id,
      reviewed_at = now(),
      admin_notes = p_admin_notes,
      updated_at = now()
  WHERE id = p_request_id;

  -- Create session from approved request
  INSERT INTO chefs_table_sessions (
    request_id, company_id, title, title_ar,
    description, description_ar,
    product_name, product_name_ar, product_category,
    experience_type, venue, venue_ar,
    city, country_code,
    session_date, session_end,
    organizer_id, chef_selection_method, max_chefs,
    status
  ) VALUES (
    v_request.id, v_request.company_id, v_request.title, v_request.title_ar,
    v_request.product_description, v_request.product_description_ar,
    v_request.product_name, v_request.product_name_ar, v_request.product_category,
    v_request.experience_type, v_request.preferred_venue, v_request.preferred_venue_ar,
    v_request.preferred_city, v_request.preferred_country_code,
    v_request.preferred_date_start, v_request.preferred_date_end,
    v_admin_id, 'admin_select', COALESCE(v_request.chef_count, 3),
    'scheduled'
  )
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$;

-- Atomic function to reject a Chef's Table request
CREATE OR REPLACE FUNCTION public.reject_chefs_table_request(
  p_request_id UUID,
  p_rejection_reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_id UUID;
  v_current_status TEXT;
BEGIN
  v_admin_id := auth.uid();
  
  IF NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Only admins can reject requests';
  END IF;

  SELECT status INTO v_current_status
  FROM chefs_table_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF v_current_status != 'pending' THEN
    RAISE EXCEPTION 'Request is not pending (current status: %)', v_current_status;
  END IF;

  UPDATE chefs_table_requests
  SET status = 'rejected',
      reviewed_by = v_admin_id,
      reviewed_at = now(),
      rejection_reason = p_rejection_reason,
      updated_at = now()
  WHERE id = p_request_id;
END;
$$;
