-- Organizer follows/bookmarks table
CREATE TABLE public.organizer_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, organizer_id)
);

ALTER TABLE public.organizer_follows ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can see follow counts
CREATE POLICY "Anyone can read organizer follows"
  ON public.organizer_follows FOR SELECT
  TO authenticated
  USING (true);

-- Users can follow/unfollow
CREATE POLICY "Users can follow organizers"
  ON public.organizer_follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow organizers"
  ON public.organizer_follows FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add follower count to organizers
ALTER TABLE public.organizers ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;

-- Trigger to update follower count
CREATE OR REPLACE FUNCTION public.update_organizer_follower_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE organizers SET follower_count = follower_count + 1 WHERE id = NEW.organizer_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE organizers SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.organizer_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_organizer_follower_count
  AFTER INSERT OR DELETE ON public.organizer_follows
  FOR EACH ROW EXECUTE FUNCTION public.update_organizer_follower_count();