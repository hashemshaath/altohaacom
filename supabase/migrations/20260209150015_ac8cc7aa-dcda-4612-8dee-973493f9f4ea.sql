-- Create masterclass reviews table
CREATE TABLE public.masterclass_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  masterclass_id UUID NOT NULL REFERENCES public.masterclasses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  review_ar TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (masterclass_id, user_id)
);

ALTER TABLE public.masterclass_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON public.masterclass_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own reviews" ON public.masterclass_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON public.masterclass_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON public.masterclass_reviews
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_masterclass_reviews_updated_at
  BEFORE UPDATE ON public.masterclass_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();