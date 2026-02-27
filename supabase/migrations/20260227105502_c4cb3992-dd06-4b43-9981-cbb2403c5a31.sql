
-- Create recipe_reviews table for fan recipe ratings
CREATE TABLE public.recipe_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (recipe_id, user_id)
);

-- Enable RLS
ALTER TABLE public.recipe_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY "Anyone can read recipe reviews"
ON public.recipe_reviews FOR SELECT USING (true);

-- Authenticated users can create reviews
CREATE POLICY "Users can create their own reviews"
ON public.recipe_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
ON public.recipe_reviews FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
ON public.recipe_reviews FOR DELETE
USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_recipe_reviews_recipe_id ON public.recipe_reviews(recipe_id);
CREATE INDEX idx_recipe_reviews_user_id ON public.recipe_reviews(user_id);
