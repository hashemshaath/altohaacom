
-- ============================================
-- 1. Organizer replies to reviews
-- ============================================
CREATE TABLE public.exhibition_review_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.exhibition_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exhibition_review_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view review replies"
ON public.exhibition_review_replies FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create replies"
ON public.exhibition_review_replies FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own replies"
ON public.exhibition_review_replies FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- 2. Review reporting
-- ============================================
CREATE TABLE public.exhibition_review_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.exhibition_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reason TEXT NOT NULL DEFAULT 'inappropriate',
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id)
);

ALTER TABLE public.exhibition_review_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can report reviews"
ON public.exhibition_review_reports FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can see own reports"
ON public.exhibition_review_reports FOR SELECT
TO authenticated USING (auth.uid() = user_id OR public.is_admin_user());

-- ============================================
-- 3. Exhibition invite links
-- ============================================
CREATE TABLE public.exhibition_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exhibition_id UUID NOT NULL REFERENCES public.exhibitions(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  code TEXT NOT NULL UNIQUE DEFAULT UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT) FROM 1 FOR 8)),
  label TEXT,
  max_uses INTEGER,
  use_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exhibition_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active invites"
ON public.exhibition_invites FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can create invites"
ON public.exhibition_invites FOR INSERT
TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update own invites"
ON public.exhibition_invites FOR UPDATE
TO authenticated USING (auth.uid() = created_by);

-- Notify review author when organizer replies
CREATE OR REPLACE FUNCTION public.notify_review_reply()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_review_author_id UUID;
  v_replier_name TEXT;
  v_exhibition_id UUID;
  v_exhibition_slug TEXT;
BEGIN
  SELECT user_id, exhibition_id INTO v_review_author_id, v_exhibition_id
  FROM exhibition_reviews WHERE id = NEW.review_id;

  IF v_review_author_id = NEW.user_id THEN RETURN NEW; END IF;

  SELECT COALESCE(full_name, username, 'Someone') INTO v_replier_name
  FROM profiles WHERE user_id = NEW.user_id;

  SELECT slug INTO v_exhibition_slug FROM exhibitions WHERE id = v_exhibition_id;

  INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
  VALUES (
    v_review_author_id,
    v_replier_name || ' replied to your review',
    v_replier_name || ' رد على تقييمك',
    'New reply on your review',
    'رد جديد على تقييمك',
    'review_reply',
    '/exhibitions/' || v_exhibition_slug,
    jsonb_build_object('review_id', NEW.review_id, 'reply_id', NEW.id)
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_review_reply
AFTER INSERT ON public.exhibition_review_replies
FOR EACH ROW EXECUTE FUNCTION public.notify_review_reply();
