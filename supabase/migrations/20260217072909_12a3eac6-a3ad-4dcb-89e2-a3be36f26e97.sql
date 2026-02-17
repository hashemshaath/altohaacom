
-- Notification trigger for post reactions
CREATE OR REPLACE FUNCTION public.notify_post_reaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_reactor_name TEXT;
  v_post_author_id UUID;
  v_emoji TEXT;
BEGIN
  -- Get post author
  SELECT author_id INTO v_post_author_id FROM posts WHERE id = NEW.post_id;
  
  -- Don't notify self
  IF v_post_author_id = NEW.user_id THEN RETURN NEW; END IF;
  
  SELECT COALESCE(full_name, username, 'Someone') INTO v_reactor_name
  FROM profiles WHERE user_id = NEW.user_id;

  v_emoji := CASE NEW.reaction_type
    WHEN 'fire' THEN '🔥'
    WHEN 'chef_kiss' THEN '👨‍🍳'
    WHEN 'star' THEN '⭐'
    WHEN 'love' THEN '❤️'
    WHEN 'bravo' THEN '👏'
    ELSE '👍'
  END;

  INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
  VALUES (
    v_post_author_id,
    v_reactor_name || ' reacted ' || v_emoji || ' to your post',
    v_reactor_name || ' تفاعل ' || v_emoji || ' على منشورك',
    'Someone reacted to your post',
    'شخص ما تفاعل مع منشورك',
    'reaction',
    '/community',
    jsonb_build_object('reactor_id', NEW.user_id, 'post_id', NEW.post_id, 'reaction_type', NEW.reaction_type)
  );

  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_post_reaction_insert
AFTER INSERT ON public.post_reactions
FOR EACH ROW
EXECUTE FUNCTION public.notify_post_reaction();

-- Notification trigger for story views (notify story owner when someone views)
CREATE OR REPLACE FUNCTION public.notify_story_view()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_viewer_name TEXT;
  v_story_owner_id UUID;
BEGIN
  SELECT user_id INTO v_story_owner_id FROM community_stories WHERE id = NEW.story_id;
  IF v_story_owner_id = NEW.viewer_id THEN RETURN NEW; END IF;

  SELECT COALESCE(full_name, username, 'Someone') INTO v_viewer_name
  FROM profiles WHERE user_id = NEW.viewer_id;

  INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
  VALUES (
    v_story_owner_id,
    v_viewer_name || ' viewed your story',
    v_viewer_name || ' شاهد قصتك',
    'Someone viewed your story',
    'شخص ما شاهد قصتك',
    'story_view',
    '/community',
    jsonb_build_object('viewer_id', NEW.viewer_id, 'story_id', NEW.story_id)
  );

  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_story_view_insert
AFTER INSERT ON public.story_views
FOR EACH ROW
EXECUTE FUNCTION public.notify_story_view();

-- Notification trigger for live session registration
CREATE OR REPLACE FUNCTION public.notify_live_session_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_attendee_name TEXT;
  v_host_id UUID;
  v_session_title TEXT;
BEGIN
  SELECT host_id, title INTO v_host_id, v_session_title FROM live_sessions WHERE id = NEW.session_id;
  IF v_host_id = NEW.user_id THEN RETURN NEW; END IF;

  SELECT COALESCE(full_name, username, 'Someone') INTO v_attendee_name
  FROM profiles WHERE user_id = NEW.user_id;

  INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
  VALUES (
    v_host_id,
    v_attendee_name || ' registered for your session',
    v_attendee_name || ' سجّل في جلستك',
    'New registration for "' || v_session_title || '"',
    'تسجيل جديد في "' || v_session_title || '"',
    'live_session',
    '/community',
    jsonb_build_object('attendee_id', NEW.user_id, 'session_id', NEW.session_id)
  );

  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_live_session_registration
AFTER INSERT ON public.live_session_attendees
FOR EACH ROW
EXECUTE FUNCTION public.notify_live_session_registration();
