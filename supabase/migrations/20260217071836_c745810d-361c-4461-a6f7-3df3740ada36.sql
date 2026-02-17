
-- Post reactions (culinary emoji reactions)
CREATE TABLE public.post_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('fire', 'chef_kiss', 'star', 'love', 'bravo')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, reaction_type)
);
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reactions" ON public.post_reactions FOR SELECT USING (true);
CREATE POLICY "Auth users can add reactions" ON public.post_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own reactions" ON public.post_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Community stories (24h ephemeral content)
CREATE TABLE public.community_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);
ALTER TABLE public.community_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active stories" ON public.community_stories FOR SELECT USING (expires_at > now());
CREATE POLICY "Auth users can create stories" ON public.community_stories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own stories" ON public.community_stories FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Story views tracking
CREATE TABLE public.story_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.community_stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Story owners can see views" ON public.story_views FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM community_stories WHERE id = story_id AND user_id = auth.uid())
  OR viewer_id = auth.uid()
);
CREATE POLICY "Auth users can log views" ON public.story_views FOR INSERT TO authenticated WITH CHECK (auth.uid() = viewer_id);

-- Live cooking sessions
CREATE TABLE public.live_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
  max_attendees INT,
  cover_image_url TEXT,
  stream_url TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view sessions" ON public.live_sessions FOR SELECT USING (true);
CREATE POLICY "Auth users can create sessions" ON public.live_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts can update own sessions" ON public.live_sessions FOR UPDATE TO authenticated USING (auth.uid() = host_id);
CREATE POLICY "Hosts can delete own sessions" ON public.live_sessions FOR DELETE TO authenticated USING (auth.uid() = host_id);

-- Live session attendees
CREATE TABLE public.live_session_attendees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);
ALTER TABLE public.live_session_attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view attendees" ON public.live_session_attendees FOR SELECT USING (true);
CREATE POLICY "Auth users can register" ON public.live_session_attendees FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unregister" ON public.live_session_attendees FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_post_reactions_post ON public.post_reactions(post_id);
CREATE INDEX idx_stories_user ON public.community_stories(user_id);
CREATE INDEX idx_stories_expires ON public.community_stories(expires_at);
CREATE INDEX idx_live_sessions_scheduled ON public.live_sessions(scheduled_at);
CREATE INDEX idx_live_sessions_status ON public.live_sessions(status);
