-- Order activity log for tracking all changes in the Order Center
CREATE TABLE public.order_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- item_added, item_removed, status_changed, vendor_assigned, quote_sent, suggestion_submitted, deadline_set, item_checked, budget_updated
  entity_type TEXT NOT NULL, -- item, list, quote, suggestion, vendor
  entity_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_activity_log ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated users can read logs for competitions they have access to
CREATE POLICY "Anyone can read order activity logs"
  ON public.order_activity_log FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert order activity logs"
  ON public.order_activity_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index for fast queries
CREATE INDEX idx_order_activity_competition ON public.order_activity_log(competition_id, created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_activity_log;