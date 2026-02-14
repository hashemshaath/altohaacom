
-- Create membership cancellation requests table
CREATE TABLE public.membership_cancellation_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  current_tier TEXT NOT NULL,
  reason TEXT,
  reason_ar TEXT,
  feedback TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  retention_offer TEXT,
  retention_offer_ar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.membership_cancellation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage cancellation requests"
ON public.membership_cancellation_requests
FOR ALL USING (public.is_admin_user());

CREATE POLICY "Users can view own cancellation requests"
ON public.membership_cancellation_requests
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create cancellation requests"
ON public.membership_cancellation_requests
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_membership_cancellation_requests_updated_at
BEFORE UPDATE ON public.membership_cancellation_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
