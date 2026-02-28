
-- Notification trigger when a new exhibition ticket is created
CREATE OR REPLACE FUNCTION public.notify_ticket_purchase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_buyer_name TEXT;
  v_exhibition_title TEXT;
  v_exhibition_slug TEXT;
  v_creator_id UUID;
BEGIN
  -- Get buyer name
  SELECT COALESCE(full_name, username, 'Someone') INTO v_buyer_name
  FROM profiles WHERE user_id = NEW.user_id;

  -- Get exhibition info
  SELECT title, slug, created_by INTO v_exhibition_title, v_exhibition_slug, v_creator_id
  FROM exhibitions WHERE id = NEW.exhibition_id;

  -- Notify buyer (confirmation)
  INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
  VALUES (
    NEW.user_id,
    '🎟️ Ticket booked: ' || v_exhibition_title,
    '🎟️ تم حجز التذكرة: ' || v_exhibition_title,
    'Your ticket #' || NEW.ticket_number || ' is ' || NEW.status,
    'تذكرتك #' || NEW.ticket_number || ' حالتها ' || NEW.status,
    'ticket_booked',
    '/exhibitions/' || v_exhibition_slug,
    jsonb_build_object('ticket_id', NEW.id, 'exhibition_id', NEW.exhibition_id, 'ticket_number', NEW.ticket_number)
  );

  -- Notify organizer (if different from buyer)
  IF v_creator_id IS NOT NULL AND v_creator_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
    VALUES (
      v_creator_id,
      '🎫 New ticket sold: ' || v_buyer_name,
      '🎫 تذكرة جديدة: ' || v_buyer_name,
      v_buyer_name || ' booked ticket for ' || v_exhibition_title,
      v_buyer_name || ' حجز تذكرة لـ ' || v_exhibition_title,
      'ticket_sold',
      '/exhibitions/' || v_exhibition_slug,
      jsonb_build_object('ticket_id', NEW.id, 'exhibition_id', NEW.exhibition_id, 'buyer_id', NEW.user_id)
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Attach trigger
DROP TRIGGER IF EXISTS on_ticket_purchase ON exhibition_tickets;
CREATE TRIGGER on_ticket_purchase
  AFTER INSERT ON exhibition_tickets
  FOR EACH ROW
  EXECUTE FUNCTION notify_ticket_purchase();

-- Notification trigger when ticket is checked in
CREATE OR REPLACE FUNCTION public.notify_ticket_checkin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_exhibition_title TEXT;
  v_exhibition_slug TEXT;
BEGIN
  IF NEW.checked_in_at IS NOT NULL AND OLD.checked_in_at IS NULL THEN
    SELECT title, slug INTO v_exhibition_title, v_exhibition_slug
    FROM exhibitions WHERE id = NEW.exhibition_id;

    INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
    VALUES (
      NEW.user_id,
      '✅ Checked in: ' || v_exhibition_title,
      '✅ تم تسجيل دخولك: ' || v_exhibition_title,
      'Welcome! Enjoy the event',
      'مرحباً! استمتع بالفعالية',
      'ticket_checkin',
      '/exhibitions/' || v_exhibition_slug,
      jsonb_build_object('ticket_id', NEW.id, 'exhibition_id', NEW.exhibition_id)
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_ticket_checkin ON exhibition_tickets;
CREATE TRIGGER on_ticket_checkin
  AFTER UPDATE ON exhibition_tickets
  FOR EACH ROW
  EXECUTE FUNCTION notify_ticket_checkin();
