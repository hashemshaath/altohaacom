-- Create a function to check and send milestone notifications for social link pages
CREATE OR REPLACE FUNCTION public.check_social_link_milestone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
  v_page_owner UUID;
  v_page_title TEXT;
  v_milestones INTEGER[] := ARRAY[10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
  v_milestone INTEGER;
BEGIN
  -- Get page owner
  SELECT user_id INTO v_page_owner FROM social_link_pages WHERE id = NEW.page_id;
  IF v_page_owner IS NULL THEN RETURN NEW; END IF;

  -- Count total visits for this page
  SELECT COUNT(*) INTO v_count FROM social_link_visits WHERE page_id = NEW.page_id;

  -- Check if we hit a milestone
  FOREACH v_milestone IN ARRAY v_milestones LOOP
    IF v_count = v_milestone THEN
      SELECT COALESCE(page_title, 'Bio Page') INTO v_page_title FROM social_link_pages WHERE id = NEW.page_id;
      
      INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
      VALUES (
        v_page_owner,
        '🎉 ' || v_milestone || ' visits on your bio page!',
        '🎉 ' || v_milestone || ' زيارة لصفحة Bio الخاصة بك!',
        'Your page "' || v_page_title || '" reached ' || v_milestone || ' visits',
        'صفحتك "' || v_page_title || '" وصلت إلى ' || v_milestone || ' زيارة',
        'bio_milestone',
        '/social-links',
        jsonb_build_object('page_id', NEW.page_id, 'milestone', v_milestone, 'milestone_type', 'visits')
      );
      EXIT;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger for visit milestones
DROP TRIGGER IF EXISTS trg_social_link_visit_milestone ON public.social_link_visits;
CREATE TRIGGER trg_social_link_visit_milestone
  AFTER INSERT ON public.social_link_visits
  FOR EACH ROW
  EXECUTE FUNCTION public.check_social_link_milestone();

-- Create a function for click milestones on link items
CREATE OR REPLACE FUNCTION public.check_social_link_click_milestone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_clicks INTEGER;
  v_owner UUID;
  v_title TEXT;
  v_milestones INTEGER[] := ARRAY[10, 50, 100, 500, 1000, 5000];
  v_milestone INTEGER;
BEGIN
  IF NEW.click_count IS NULL OR OLD.click_count IS NULL THEN RETURN NEW; END IF;
  IF NEW.click_count = OLD.click_count THEN RETURN NEW; END IF;

  v_clicks := NEW.click_count;
  v_owner := NEW.user_id;
  v_title := NEW.title;

  FOREACH v_milestone IN ARRAY v_milestones LOOP
    IF v_clicks = v_milestone THEN
      INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
      VALUES (
        v_owner,
        '🔥 ' || v_milestone || ' clicks on "' || v_title || '"!',
        '🔥 ' || v_milestone || ' نقرة على "' || v_title || '"!',
        'Your link reached ' || v_milestone || ' clicks',
        'رابطك وصل إلى ' || v_milestone || ' نقرة',
        'link_milestone',
        '/social-links',
        jsonb_build_object('item_id', NEW.id, 'milestone', v_milestone, 'milestone_type', 'clicks')
      );
      EXIT;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger for click milestones
DROP TRIGGER IF EXISTS trg_social_link_click_milestone ON public.social_link_items;
CREATE TRIGGER trg_social_link_click_milestone
  AFTER UPDATE ON public.social_link_items
  FOR EACH ROW
  EXECUTE FUNCTION public.check_social_link_click_milestone();