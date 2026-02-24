
-- 1. Enhance exhibition_tickets with check-in support
ALTER TABLE public.exhibition_tickets 
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS checked_in_by UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS check_in_notes TEXT DEFAULT NULL;

-- 2. Enhance exhibition_reviews with photos and helpful votes
ALTER TABLE public.exhibition_reviews 
ADD COLUMN IF NOT EXISTS photo_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reviewer_type TEXT DEFAULT 'general';

-- 3. Create review votes table (helpful/not helpful)
CREATE TABLE IF NOT EXISTS public.exhibition_review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.exhibition_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL DEFAULT 'helpful',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id)
);

ALTER TABLE public.exhibition_review_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view review votes"
ON public.exhibition_review_votes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote"
ON public.exhibition_review_votes FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own vote"
ON public.exhibition_review_votes FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- 4. Trigger to update helpful_count on exhibition_reviews
CREATE OR REPLACE FUNCTION public.update_review_helpful_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE exhibition_reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE exhibition_reviews SET helpful_count = GREATEST(helpful_count - 1, 0) WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_update_review_helpful_count
AFTER INSERT OR DELETE ON public.exhibition_review_votes
FOR EACH ROW EXECUTE FUNCTION public.update_review_helpful_count();

-- 5. Auto-mark ticket holder as verified attendee on check-in
CREATE OR REPLACE FUNCTION public.mark_verified_attendee_on_checkin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.checked_in_at IS NOT NULL AND OLD.checked_in_at IS NULL THEN
    UPDATE exhibition_reviews 
    SET is_verified_attendee = true 
    WHERE exhibition_id = NEW.exhibition_id AND user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_mark_verified_attendee
AFTER UPDATE ON public.exhibition_tickets
FOR EACH ROW EXECUTE FUNCTION public.mark_verified_attendee_on_checkin();
