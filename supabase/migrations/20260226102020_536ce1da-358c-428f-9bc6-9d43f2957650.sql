CREATE OR REPLACE FUNCTION public.notify_exhibition_followers()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_follower_ids UUID[];
  v_title TEXT;
  v_title_ar TEXT;
BEGIN
  -- Only trigger on meaningful status changes
  IF TG_OP = 'UPDATE' AND (
    OLD.status IS DISTINCT FROM NEW.status OR
    OLD.start_date IS DISTINCT FROM NEW.start_date OR
    OLD.venue IS DISTINCT FROM NEW.venue
  ) THEN
    v_title := COALESCE(NEW.title, 'Exhibition');
    v_title_ar := COALESCE(NEW.title_ar, NEW.title, 'معرض');

    SELECT ARRAY_AGG(user_id) INTO v_follower_ids
    FROM exhibition_followers
    WHERE exhibition_id = NEW.id;

    IF v_follower_ids IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
      SELECT
        uid,
        '📢 Update: ' || v_title,
        '📢 تحديث: ' || v_title_ar,
        CASE
          WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'Status changed to ' || NEW.status
          WHEN OLD.start_date IS DISTINCT FROM NEW.start_date THEN 'Event dates have been updated'
          WHEN OLD.venue IS DISTINCT FROM NEW.venue THEN 'Venue has been updated'
          ELSE 'Event details have been updated'
        END,
        CASE
          WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'تم تغيير الحالة إلى ' || NEW.status
          WHEN OLD.start_date IS DISTINCT FROM NEW.start_date THEN 'تم تحديث مواعيد الفعالية'
          WHEN OLD.venue IS DISTINCT FROM NEW.venue THEN 'تم تحديث مكان الفعالية'
          ELSE 'تم تحديث تفاصيل الفعالية'
        END,
        'exhibition_update',
        '/exhibitions/' || NEW.slug,
        jsonb_build_object('exhibition_id', NEW.id, 'change_type',
          CASE
            WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'status'
            WHEN OLD.start_date IS DISTINCT FROM NEW.start_date THEN 'dates'
            WHEN OLD.venue IS DISTINCT FROM NEW.venue THEN 'venue'
            ELSE 'details'
          END
        )
      FROM UNNEST(v_follower_ids) AS uid;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;