
-- Universal content reviews table
CREATE TABLE public.content_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entity_type TEXT NOT NULL, -- 'recipe', 'competition', 'chef', 'article', 'exhibition'
  entity_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, entity_type, entity_id)
);

-- Index for fast lookups
CREATE INDEX idx_content_reviews_entity ON public.content_reviews (entity_type, entity_id);
CREATE INDEX idx_content_reviews_user ON public.content_reviews (user_id);

-- Enable RLS
ALTER TABLE public.content_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read visible reviews
CREATE POLICY "Anyone can read visible reviews"
  ON public.content_reviews FOR SELECT
  USING (is_visible = true);

-- Authenticated users can insert their own reviews
CREATE POLICY "Users can insert own reviews"
  ON public.content_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
  ON public.content_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
  ON public.content_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
