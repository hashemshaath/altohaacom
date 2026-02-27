
-- Add moderation columns to event_comments
ALTER TABLE public.event_comments 
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS flagged_by UUID,
  ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hidden_by UUID,
  ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS flag_reason TEXT;

-- Admins can update any comment (for moderation)
CREATE POLICY "Admins can update any comment"
  ON public.event_comments FOR UPDATE
  USING (public.is_admin_user());

-- Admins can delete any comment
CREATE POLICY "Admins can delete any comment"
  ON public.event_comments FOR DELETE
  USING (public.is_admin_user());

-- Update SELECT policy to hide hidden comments for non-admins
DROP POLICY IF EXISTS "Anyone can view event comments" ON public.event_comments;
CREATE POLICY "Anyone can view visible event comments"
  ON public.event_comments FOR SELECT
  USING (is_hidden = false OR public.is_admin_user());

-- Notification trigger for comment replies
CREATE OR REPLACE FUNCTION public.notify_event_comment_reply()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_parent_user_id UUID;
  v_commenter_name TEXT;
  v_event_title TEXT;
  v_link TEXT;
BEGIN
  IF NEW.parent_id IS NULL THEN RETURN NEW; END IF;

  SELECT user_id INTO v_parent_user_id FROM event_comments WHERE id = NEW.parent_id;
  IF v_parent_user_id = NEW.user_id THEN RETURN NEW; END IF;

  SELECT COALESCE(full_name, username, 'Someone') INTO v_commenter_name
  FROM profiles WHERE user_id = NEW.user_id;

  -- Get event title for context
  IF NEW.event_type = 'competition' THEN
    SELECT COALESCE(slug, id::text) INTO v_link FROM competitions WHERE id = NEW.event_id;
    v_link := '/competitions/' || v_link;
  ELSE
    SELECT COALESCE(slug, id::text) INTO v_link FROM exhibitions WHERE id = NEW.event_id;
    v_link := '/exhibitions/' || v_link;
  END IF;

  INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
  VALUES (
    v_parent_user_id,
    v_commenter_name || ' replied to your comment',
    v_commenter_name || ' رد على تعليقك',
    LEFT(NEW.content, 100),
    LEFT(NEW.content, 100),
    'comment_reply',
    v_link,
    jsonb_build_object('comment_id', NEW.id, 'parent_id', NEW.parent_id, 'event_type', NEW.event_type, 'event_id', NEW.event_id)
  );

  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_comment_reply
  AFTER INSERT ON public.event_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_event_comment_reply();

-- Notification trigger for comment likes
CREATE OR REPLACE FUNCTION public.notify_event_comment_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_comment_user_id UUID;
  v_liker_name TEXT;
BEGIN
  SELECT user_id INTO v_comment_user_id FROM event_comments WHERE id = NEW.comment_id;
  IF v_comment_user_id = NEW.user_id THEN RETURN NEW; END IF;

  SELECT COALESCE(full_name, username, 'Someone') INTO v_liker_name
  FROM profiles WHERE user_id = NEW.user_id;

  INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
  VALUES (
    v_comment_user_id,
    v_liker_name || ' liked your comment',
    v_liker_name || ' أعجب بتعليقك',
    'Someone liked your comment',
    'أعجب شخص ما بتعليقك',
    'comment_like',
    '/community',
    jsonb_build_object('comment_id', NEW.comment_id, 'liker_id', NEW.user_id)
  );

  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_comment_like
  AFTER INSERT ON public.event_comment_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_event_comment_like();
