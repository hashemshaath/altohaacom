
-- Notification trigger: notify followers when exhibition is updated
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
    OLD.venue IS DISTINCT FROM NEW.venue OR
    OLD.is_cancelled IS DISTINCT FROM NEW.is_cancelled
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

-- Create trigger on exhibitions table
CREATE TRIGGER notify_exhibition_followers_on_update
AFTER UPDATE ON public.exhibitions
FOR EACH ROW
EXECUTE FUNCTION public.notify_exhibition_followers();

-- Notification trigger: notify followers when exhibition review is posted
CREATE OR REPLACE FUNCTION public.notify_exhibition_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_reviewer_name TEXT;
  v_exhibition_title TEXT;
  v_exhibition_slug TEXT;
  v_creator_id UUID;
BEGIN
  SELECT COALESCE(full_name, username, 'Someone') INTO v_reviewer_name
  FROM profiles WHERE user_id = NEW.user_id;

  SELECT title, slug, created_by INTO v_exhibition_title, v_exhibition_slug, v_creator_id
  FROM exhibitions WHERE id = NEW.exhibition_id;

  -- Notify the exhibition creator (if not self)
  IF v_creator_id IS NOT NULL AND v_creator_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
    VALUES (
      v_creator_id,
      v_reviewer_name || ' reviewed your event (' || NEW.rating || '⭐)',
      v_reviewer_name || ' قيّم فعاليتك (' || NEW.rating || '⭐)',
      'New ' || NEW.rating || '-star review on "' || v_exhibition_title || '"',
      'تقييم جديد ' || NEW.rating || ' نجوم على "' || v_exhibition_title || '"',
      'exhibition_review',
      '/exhibitions/' || v_exhibition_slug,
      jsonb_build_object('exhibition_id', NEW.exhibition_id, 'review_id', NEW.id, 'rating', NEW.rating)
    );
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER notify_exhibition_review_on_insert
AFTER INSERT ON public.exhibition_reviews
FOR EACH ROW
EXECUTE FUNCTION public.notify_exhibition_review();
