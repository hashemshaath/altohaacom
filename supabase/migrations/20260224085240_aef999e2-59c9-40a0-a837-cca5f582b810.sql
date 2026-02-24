
-- Exhibition analytics events for detailed tracking
CREATE TABLE public.exhibition_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibition_id UUID NOT NULL REFERENCES public.exhibitions(id) ON DELETE CASCADE,
  user_id UUID,
  event_type TEXT NOT NULL DEFAULT 'page_view',
  event_data JSONB DEFAULT '{}',
  source TEXT,
  device_type TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exhibition_analytics_exhibition ON exhibition_analytics_events(exhibition_id);
CREATE INDEX idx_exhibition_analytics_type ON exhibition_analytics_events(event_type);
CREATE INDEX idx_exhibition_analytics_created ON exhibition_analytics_events(created_at);

ALTER TABLE public.exhibition_analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can view their exhibition analytics"
ON public.exhibition_analytics_events FOR SELECT
USING (
  EXISTS (SELECT 1 FROM exhibitions e WHERE e.id = exhibition_id AND e.created_by = auth.uid())
  OR public.is_admin_user()
);

CREATE POLICY "Anyone can insert analytics events"
ON public.exhibition_analytics_events FOR INSERT
WITH CHECK (true);

-- Social wall posts for exhibitions
CREATE TABLE public.exhibition_social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibition_id UUID NOT NULL REFERENCES public.exhibitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  hashtags TEXT[] DEFAULT '{}',
  platform TEXT DEFAULT 'internal',
  likes_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_social_posts_exhibition ON exhibition_social_posts(exhibition_id);
CREATE INDEX idx_social_posts_hashtags ON exhibition_social_posts USING GIN(hashtags);

ALTER TABLE public.exhibition_social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved social posts"
ON public.exhibition_social_posts FOR SELECT
USING (is_approved = true OR user_id = auth.uid() OR public.is_admin_user());

CREATE POLICY "Authenticated users can create social posts"
ON public.exhibition_social_posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
ON public.exhibition_social_posts FOR UPDATE
USING (auth.uid() = user_id OR public.is_admin_user());

CREATE POLICY "Users can delete own posts"
ON public.exhibition_social_posts FOR DELETE
USING (auth.uid() = user_id OR public.is_admin_user());

-- Social post likes
CREATE TABLE public.exhibition_social_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.exhibition_social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.exhibition_social_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
ON public.exhibition_social_likes FOR SELECT USING (true);

CREATE POLICY "Auth users can like"
ON public.exhibition_social_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike"
ON public.exhibition_social_likes FOR DELETE USING (auth.uid() = user_id);

-- Trigger to update likes count
CREATE OR REPLACE FUNCTION public.update_social_post_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE exhibition_social_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE exhibition_social_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;

CREATE TRIGGER trg_social_likes_count
AFTER INSERT OR DELETE ON public.exhibition_social_likes
FOR EACH ROW EXECUTE FUNCTION public.update_social_post_likes_count();
