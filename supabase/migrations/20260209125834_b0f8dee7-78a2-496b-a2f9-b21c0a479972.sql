
-- =====================
-- 1. COMMENTS & DISCUSSIONS (post_comments already exists, add replies support)
-- =====================

-- Add parent_comment_id for nested replies
ALTER TABLE public.post_comments 
ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE;

-- =====================
-- 2. RECIPE SHARING
-- =====================
CREATE TABLE public.recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  title text NOT NULL,
  title_ar text,
  description text,
  description_ar text,
  ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  image_url text,
  gallery_urls text[] DEFAULT '{}'::text[],
  cuisine text,
  difficulty text DEFAULT 'medium',
  prep_time_minutes integer,
  cook_time_minutes integer,
  servings integer,
  is_published boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published recipes" ON public.recipes
  FOR SELECT USING (is_published = true OR author_id = auth.uid());

CREATE POLICY "Users can create recipes" ON public.recipes
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own recipes" ON public.recipes
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own recipes" ON public.recipes
  FOR DELETE USING (auth.uid() = author_id);

CREATE TABLE public.recipe_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(recipe_id, user_id)
);

ALTER TABLE public.recipe_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ratings" ON public.recipe_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can rate recipes" ON public.recipe_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings" ON public.recipe_ratings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings" ON public.recipe_ratings
  FOR DELETE USING (auth.uid() = user_id);

-- =====================
-- 3. EVENTS & ENGAGEMENT
-- =====================
CREATE TABLE public.community_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL,
  title text NOT NULL,
  title_ar text,
  description text,
  description_ar text,
  event_type text NOT NULL DEFAULT 'event',
  image_url text,
  event_date timestamptz,
  event_end_date timestamptz,
  location text,
  location_ar text,
  is_virtual boolean DEFAULT false,
  max_attendees integer,
  status text DEFAULT 'upcoming',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view events" ON public.community_events
  FOR SELECT USING (true);

CREATE POLICY "Users can create events" ON public.community_events
  FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update own events" ON public.community_events
  FOR UPDATE USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete own events" ON public.community_events
  FOR DELETE USING (auth.uid() = organizer_id);

CREATE TABLE public.event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.community_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text DEFAULT 'going',
  registered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view attendees" ON public.event_attendees
  FOR SELECT USING (true);

CREATE POLICY "Users can register for events" ON public.event_attendees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attendance" ON public.event_attendees
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can cancel attendance" ON public.event_attendees
  FOR DELETE USING (auth.uid() = user_id);

-- Polls
CREATE TABLE public.community_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  question text NOT NULL,
  question_ar text,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view polls" ON public.community_polls
  FOR SELECT USING (true);

CREATE POLICY "Users can create polls" ON public.community_polls
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update polls" ON public.community_polls
  FOR UPDATE USING (auth.uid() = author_id);

CREATE TABLE public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.community_polls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  option_index integer NOT NULL,
  voted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view votes" ON public.poll_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can vote" ON public.poll_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================
-- 4. ADVANCED GROUPS (group_posts for in-group posting)
-- =====================
-- Add cover_image and category to groups
ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS cover_image_url text,
ADD COLUMN IF NOT EXISTS category text;

-- Triggers for updated_at
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_events_updated_at BEFORE UPDATE ON public.community_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
