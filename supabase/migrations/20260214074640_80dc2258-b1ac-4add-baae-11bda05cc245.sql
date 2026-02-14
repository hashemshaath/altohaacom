-- Create referral_clicks table for detailed click analytics
CREATE TABLE IF NOT EXISTS public.referral_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  source TEXT DEFAULT 'direct',
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;

-- Allow the service role to insert (edge function uses service role)
-- Allow referral code owners to read their click data
CREATE POLICY "Users can view clicks on their referral codes"
ON public.referral_clicks FOR SELECT
USING (
  referral_code_id IN (
    SELECT id FROM public.referral_codes WHERE user_id = auth.uid()
  )
);

-- Index for fast lookups
CREATE INDEX idx_referral_clicks_code_id ON public.referral_clicks(referral_code_id);
CREATE INDEX idx_referral_clicks_clicked_at ON public.referral_clicks(clicked_at);