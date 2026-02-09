
-- Activity/updates table for competitions
CREATE TABLE public.competition_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  title TEXT NOT NULL,
  title_ar TEXT,
  content TEXT,
  content_ar TEXT,
  update_type TEXT NOT NULL DEFAULT 'announcement',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.competition_updates ENABLE ROW LEVEL SECURITY;

-- Anyone can read updates
CREATE POLICY "Updates are publicly readable"
  ON public.competition_updates FOR SELECT
  USING (true);

-- Organizers can manage updates
CREATE POLICY "Organizers can insert updates"
  ON public.competition_updates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.competitions
      WHERE id = competition_id AND organizer_id = auth.uid()
    )
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Organizers can update their updates"
  ON public.competition_updates FOR UPDATE
  USING (
    author_id = auth.uid()
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Organizers can delete their updates"
  ON public.competition_updates FOR DELETE
  USING (
    author_id = auth.uid()
    OR public.is_admin(auth.uid())
  );

CREATE INDEX idx_competition_updates_comp ON public.competition_updates(competition_id, created_at DESC);
