
-- Trigger: notify chef when a schedule event is created/updated by admin
CREATE OR REPLACE FUNCTION public.notify_chef_schedule_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_chef_name TEXT;
  v_action TEXT;
BEGIN
  -- Only notify if updated_by is different from chef_id (admin action)
  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only notify on status changes or significant updates
    IF OLD.status IS DISTINCT FROM NEW.status OR OLD.start_date IS DISTINCT FROM NEW.start_date THEN
      v_action := 'updated';
    ELSE
      RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  -- Don't notify if chef made the change themselves
  IF NEW.updated_by = NEW.chef_id OR NEW.created_by = NEW.chef_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
  VALUES (
    NEW.chef_id,
    'Schedule ' || v_action || ': ' || NEW.title,
    'تحديث الجدول: ' || COALESCE(NEW.title_ar, NEW.title),
    'Your schedule event "' || NEW.title || '" has been ' || v_action || ' by management.',
    'تم تحديث حدث "' || COALESCE(NEW.title_ar, NEW.title) || '" من قبل الإدارة.',
    'schedule',
    '/profile?tab=schedule',
    jsonb_build_object('event_id', NEW.id, 'event_type', NEW.event_type, 'action', v_action)
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_chef_on_schedule_change
AFTER INSERT OR UPDATE ON public.chef_schedule_events
FOR EACH ROW
EXECUTE FUNCTION public.notify_chef_schedule_change();
