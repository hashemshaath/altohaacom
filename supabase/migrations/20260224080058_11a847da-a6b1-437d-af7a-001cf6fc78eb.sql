
-- ============================================
-- Exhibition notification triggers for key events
-- ============================================

-- 1. Notify exhibition creator when someone registers for a schedule item
CREATE OR REPLACE FUNCTION public.notify_schedule_registration()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_user_name TEXT;
  v_item_title TEXT;
  v_exhibition_id UUID;
  v_exhibition_slug TEXT;
  v_creator_id UUID;
BEGIN
  SELECT COALESCE(full_name, username, 'Someone') INTO v_user_name
  FROM profiles WHERE user_id = NEW.user_id;

  SELECT si.title, si.exhibition_id INTO v_item_title, v_exhibition_id
  FROM exhibition_schedule_items si WHERE si.id = NEW.schedule_item_id;

  SELECT slug, created_by INTO v_exhibition_slug, v_creator_id
  FROM exhibitions WHERE id = v_exhibition_id;

  IF v_creator_id IS NOT NULL AND v_creator_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
    VALUES (
      v_creator_id,
      v_user_name || ' joined "' || v_item_title || '"',
      v_user_name || ' انضم إلى "' || v_item_title || '"',
      'New session registration',
      'تسجيل جديد في الجلسة',
      'schedule_registration',
      '/exhibitions/' || v_exhibition_slug,
      jsonb_build_object('schedule_item_id', NEW.schedule_item_id, 'user_id', NEW.user_id)
    );
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_schedule_registration
AFTER INSERT ON public.exhibition_schedule_registrations
FOR EACH ROW EXECUTE FUNCTION public.notify_schedule_registration();

-- 2. Notify exhibition creator when a ticket is purchased
CREATE OR REPLACE FUNCTION public.notify_exhibition_ticket_purchase()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_exhibition_title TEXT;
  v_exhibition_slug TEXT;
  v_creator_id UUID;
  v_ticket_type_name TEXT;
BEGIN
  SELECT title, slug, created_by INTO v_exhibition_title, v_exhibition_slug, v_creator_id
  FROM exhibitions WHERE id = NEW.exhibition_id;

  IF NEW.ticket_type_id IS NOT NULL THEN
    SELECT name INTO v_ticket_type_name FROM exhibition_ticket_types WHERE id = NEW.ticket_type_id;
  END IF;

  IF v_creator_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
    VALUES (
      v_creator_id,
      '🎫 New ticket: ' || COALESCE(NEW.attendee_name, 'Guest') || COALESCE(' (' || v_ticket_type_name || ')', ''),
      '🎫 تذكرة جديدة: ' || COALESCE(NEW.attendee_name, 'زائر') || COALESCE(' (' || v_ticket_type_name || ')', ''),
      'Ticket #' || NEW.ticket_number || ' for "' || v_exhibition_title || '"',
      'تذكرة #' || NEW.ticket_number || ' لـ "' || v_exhibition_title || '"',
      'exhibition_ticket',
      '/exhibitions/' || v_exhibition_slug,
      jsonb_build_object('ticket_id', NEW.id, 'exhibition_id', NEW.exhibition_id, 'ticket_number', NEW.ticket_number)
    );
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_exhibition_ticket_purchase
AFTER INSERT ON public.exhibition_tickets
FOR EACH ROW EXECUTE FUNCTION public.notify_exhibition_ticket_purchase();

-- 3. Notify user when they are checked in
CREATE OR REPLACE FUNCTION public.notify_exhibition_checkin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_exhibition_title TEXT;
  v_exhibition_slug TEXT;
BEGIN
  IF NEW.checked_in_at IS NOT NULL AND OLD.checked_in_at IS NULL AND NEW.user_id IS NOT NULL THEN
    SELECT title, slug INTO v_exhibition_title, v_exhibition_slug
    FROM exhibitions WHERE id = NEW.exhibition_id;

    INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
    VALUES (
      NEW.user_id,
      '✅ Welcome! You''re checked in',
      '✅ أهلاً! تم تسجيل حضورك',
      'Checked in at "' || v_exhibition_title || '"',
      'تم تسجيل حضورك في "' || v_exhibition_title || '"',
      'exhibition_checkin',
      '/exhibitions/' || v_exhibition_slug,
      jsonb_build_object('ticket_id', NEW.id, 'exhibition_id', NEW.exhibition_id)
    );
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_exhibition_checkin
AFTER UPDATE ON public.exhibition_tickets
FOR EACH ROW EXECUTE FUNCTION public.notify_exhibition_checkin();
