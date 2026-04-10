
CREATE INDEX IF NOT EXISTS idx_competition_categories_comp_id ON public.competition_categories(competition_id);
CREATE INDEX IF NOT EXISTS idx_certificates_comp_id ON public.certificates(competition_id);
CREATE INDEX IF NOT EXISTS idx_round_participants_round ON public.round_participants(round_id);
CREATE INDEX IF NOT EXISTS idx_round_participants_reg ON public.round_participants(registration_id);
