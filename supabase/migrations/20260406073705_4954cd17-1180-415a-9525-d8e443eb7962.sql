
CREATE TABLE public.exhibition_competitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exhibition_id UUID NOT NULL REFERENCES public.exhibitions(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  edition_year INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(exhibition_id, competition_id)
);

ALTER TABLE public.exhibition_competitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exhibition competitions"
  ON public.exhibition_competitions FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage exhibition competitions"
  ON public.exhibition_competitions FOR ALL TO authenticated USING (true) WITH CHECK (true);
