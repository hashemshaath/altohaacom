-- Notification trigger: notify supplier on new review
CREATE OR REPLACE FUNCTION public.notify_supplier_new_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_reviewer_name TEXT;
  v_company_name TEXT;
  v_contact_user_ids UUID[];
BEGIN
  -- Get reviewer name
  SELECT COALESCE(full_name, username, 'Someone') INTO v_reviewer_name
  FROM profiles WHERE user_id = NEW.user_id;

  -- Get company name
  SELECT name INTO v_company_name FROM companies WHERE id = NEW.company_id;

  -- Get all company contacts
  SELECT ARRAY_AGG(user_id) INTO v_contact_user_ids
  FROM company_contacts WHERE company_id = NEW.company_id;

  IF v_contact_user_ids IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
    SELECT
      uid,
      v_reviewer_name || ' left a ' || NEW.rating || '-star review',
      v_reviewer_name || ' ترك تقييم ' || NEW.rating || ' نجوم',
      'New review on ' || v_company_name,
      'تقييم جديد على ' || v_company_name,
      'supplier_review',
      '/company/supplier',
      jsonb_build_object('review_id', NEW.id, 'company_id', NEW.company_id, 'rating', NEW.rating)
    FROM UNNEST(v_contact_user_ids) AS uid;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_supplier_new_review
AFTER INSERT ON public.supplier_reviews
FOR EACH ROW
EXECUTE FUNCTION public.notify_supplier_new_review();

-- Notification trigger: notify supplier on new inquiry (company_communications)
CREATE OR REPLACE FUNCTION public.notify_supplier_new_inquiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sender_name TEXT;
  v_company_name TEXT;
  v_contact_user_ids UUID[];
BEGIN
  -- Only notify on initial messages (not replies from company)
  IF NEW.sender_type = 'company' THEN RETURN NEW; END IF;

  SELECT COALESCE(full_name, username, 'Someone') INTO v_sender_name
  FROM profiles WHERE user_id = NEW.sender_id;

  SELECT name INTO v_company_name FROM companies WHERE id = NEW.company_id;

  SELECT ARRAY_AGG(user_id) INTO v_contact_user_ids
  FROM company_contacts WHERE company_id = NEW.company_id;

  IF v_contact_user_ids IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
    SELECT
      uid,
      'New inquiry from ' || v_sender_name,
      'استفسار جديد من ' || v_sender_name,
      COALESCE(LEFT(NEW.subject, 80), 'New message for ' || v_company_name),
      COALESCE(LEFT(NEW.subject_ar, 80), 'رسالة جديدة لـ ' || v_company_name),
      'supplier_inquiry',
      '/company/supplier',
      jsonb_build_object('communication_id', NEW.id, 'company_id', NEW.company_id)
    FROM UNNEST(v_contact_user_ids) AS uid;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_supplier_new_inquiry
AFTER INSERT ON public.company_communications
FOR EACH ROW
EXECUTE FUNCTION public.notify_supplier_new_inquiry();

-- Notification trigger: notify supplier on wishlist milestone (every 10 saves)
CREATE OR REPLACE FUNCTION public.notify_supplier_wishlist_milestone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
  v_company_name TEXT;
  v_contact_user_ids UUID[];
BEGIN
  SELECT COUNT(*) INTO v_count FROM supplier_wishlists WHERE company_id = NEW.company_id;

  -- Notify at milestones: 10, 25, 50, 100, 250, 500
  IF v_count NOT IN (10, 25, 50, 100, 250, 500) THEN RETURN NEW; END IF;

  SELECT name INTO v_company_name FROM companies WHERE id = NEW.company_id;

  SELECT ARRAY_AGG(user_id) INTO v_contact_user_ids
  FROM company_contacts WHERE company_id = NEW.company_id;

  IF v_contact_user_ids IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
    SELECT
      uid,
      '🎉 ' || v_count || ' people saved ' || v_company_name || '!',
      '🎉 ' || v_count || ' شخص حفظوا ' || v_company_name || '!',
      'Your supplier profile reached ' || v_count || ' wishlist saves',
      'ملف المورد وصل إلى ' || v_count || ' حفظ في المفضلة',
      'supplier_milestone',
      '/company/supplier',
      jsonb_build_object('company_id', NEW.company_id, 'milestone', v_count)
    FROM UNNEST(v_contact_user_ids) AS uid;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_supplier_wishlist_milestone
AFTER INSERT ON public.supplier_wishlists
FOR EACH ROW
EXECUTE FUNCTION public.notify_supplier_wishlist_milestone();