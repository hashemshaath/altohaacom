
-- Add booth_status to exhibition_booths for booth management
ALTER TABLE public.exhibition_booths ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';
ALTER TABLE public.exhibition_booths ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);
ALTER TABLE public.exhibition_booths ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
ALTER TABLE public.exhibition_booths ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
ALTER TABLE public.exhibition_booths ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'SAR';

-- Notify organizer when booth is assigned
CREATE OR REPLACE FUNCTION public.notify_booth_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_exhibition_title TEXT;
  v_exhibition_slug TEXT;
  v_assignee_name TEXT;
  v_creator_id UUID;
BEGIN
  IF NEW.assigned_to IS NOT NULL AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    SELECT title, slug, created_by INTO v_exhibition_title, v_exhibition_slug, v_creator_id
    FROM exhibitions WHERE id = NEW.exhibition_id;

    SELECT COALESCE(full_name, username, 'Someone') INTO v_assignee_name
    FROM profiles WHERE user_id = NEW.assigned_to;

    -- Notify assignee
    INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
    VALUES (
      NEW.assigned_to,
      'You''ve been assigned booth ' || NEW.booth_number,
      'تم تعيينك في الجناح ' || NEW.booth_number,
      'Booth assigned at "' || v_exhibition_title || '"',
      'تم تعيين جناح في "' || v_exhibition_title || '"',
      'booth_assignment',
      '/exhibitions/' || v_exhibition_slug,
      jsonb_build_object('booth_id', NEW.id, 'exhibition_id', NEW.exhibition_id, 'booth_number', NEW.booth_number)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_booth_assignment
AFTER UPDATE ON public.exhibition_booths
FOR EACH ROW EXECUTE FUNCTION public.notify_booth_assignment();

-- Notify followers 24h before exhibition (via cron - create function for it)
CREATE OR REPLACE FUNCTION public.notify_upcoming_exhibitions()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_rec RECORD;
  v_follower_ids UUID[];
BEGIN
  FOR v_rec IN
    SELECT id, title, title_ar, slug, start_date
    FROM exhibitions
    WHERE start_date BETWEEN now() AND now() + INTERVAL '24 hours'
    AND status = 'published'
    AND is_cancelled = false
  LOOP
    SELECT ARRAY_AGG(user_id) INTO v_follower_ids
    FROM exhibition_followers WHERE exhibition_id = v_rec.id;

    IF v_follower_ids IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
      SELECT
        uid,
        '⏰ Starting soon: ' || v_rec.title,
        '⏰ يبدأ قريباً: ' || COALESCE(v_rec.title_ar, v_rec.title),
        'This event starts in less than 24 hours!',
        'تبدأ الفعالية خلال أقل من 24 ساعة!',
        'exhibition_reminder',
        '/exhibitions/' || v_rec.slug,
        jsonb_build_object('exhibition_id', v_rec.id, 'start_date', v_rec.start_date)
      FROM UNNEST(v_follower_ids) AS uid
      WHERE NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.user_id = uid AND n.type = 'exhibition_reminder'
        AND n.metadata->>'exhibition_id' = v_rec.id::TEXT
      );
    END IF;
  END LOOP;
END;
$$;
