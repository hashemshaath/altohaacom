
-- Trigger: notify page owner when a new subscriber joins
CREATE OR REPLACE FUNCTION public.notify_bio_new_subscriber()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_page_title TEXT;
  v_sub_count INTEGER;
  v_milestones INTEGER[] := ARRAY[5, 10, 25, 50, 100, 250, 500, 1000];
  v_milestone INTEGER;
BEGIN
  SELECT COALESCE(page_title, 'Bio Page') INTO v_page_title
  FROM social_link_pages WHERE id = NEW.page_id;

  -- Always notify on new subscriber
  INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
  VALUES (
    NEW.page_owner_id,
    '📬 New subscriber: ' || COALESCE(NEW.name, NEW.email),
    '📬 مشترك جديد: ' || COALESCE(NEW.name, NEW.email),
    NEW.email || ' subscribed to "' || v_page_title || '"',
    NEW.email || ' اشترك في "' || v_page_title || '"',
    'bio_subscriber',
    '/social-links',
    jsonb_build_object('page_id', NEW.page_id, 'subscriber_email', NEW.email)
  );

  -- Check subscriber milestones
  SELECT COUNT(*) INTO v_sub_count FROM bio_subscribers WHERE page_id = NEW.page_id AND is_active = true;

  FOREACH v_milestone IN ARRAY v_milestones LOOP
    IF v_sub_count = v_milestone THEN
      INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
      VALUES (
        NEW.page_owner_id,
        '🎉 ' || v_milestone || ' subscribers on your bio page!',
        '🎉 ' || v_milestone || ' مشترك في صفحة Bio!',
        'Your page "' || v_page_title || '" reached ' || v_milestone || ' subscribers',
        'صفحتك "' || v_page_title || '" وصلت إلى ' || v_milestone || ' مشترك',
        'bio_milestone',
        '/social-links',
        jsonb_build_object('page_id', NEW.page_id, 'milestone', v_milestone, 'milestone_type', 'subscribers')
      );
      EXIT;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_bio_new_subscriber
AFTER INSERT ON public.bio_subscribers
FOR EACH ROW
EXECUTE FUNCTION public.notify_bio_new_subscriber();
