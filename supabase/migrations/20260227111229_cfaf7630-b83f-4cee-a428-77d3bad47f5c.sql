
-- Event watchlist for fans to save competitions & exhibitions
CREATE TABLE public.event_watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('competition', 'exhibition')),
  event_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_type, event_id)
);

ALTER TABLE public.event_watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watchlist" ON public.event_watchlist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to watchlist" ON public.event_watchlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from watchlist" ON public.event_watchlist
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_event_watchlist_user ON public.event_watchlist (user_id);
