
CREATE TABLE public.post_polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  question TEXT,
  ends_at TIMESTAMPTZ,
  allows_multiple BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id)
);

CREATE TABLE public.post_poll_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.post_polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.post_poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.post_polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.post_poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id, option_id)
);

ALTER TABLE public.post_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view polls" ON public.post_polls FOR SELECT USING (true);
CREATE POLICY "Anyone can view poll options" ON public.post_poll_options FOR SELECT USING (true);
CREATE POLICY "Anyone can view poll votes" ON public.post_poll_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create polls" ON public.post_polls FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can create poll options" ON public.post_poll_options FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can vote" ON public.post_poll_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their vote" ON public.post_poll_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authors can delete their polls" ON public.post_polls FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM posts WHERE posts.id = post_id AND posts.author_id = auth.uid()));
