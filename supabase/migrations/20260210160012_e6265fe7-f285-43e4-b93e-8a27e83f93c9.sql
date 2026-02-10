
-- Create company_communications table for messaging between companies and admin
CREATE TABLE public.company_communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'outgoing' CHECK (direction IN ('incoming', 'outgoing')),
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'archived')),
  parent_id UUID REFERENCES public.company_communications(id) ON DELETE SET NULL,
  is_internal_note BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_communications ENABLE ROW LEVEL SECURITY;

-- Company contacts can view their company's communications (non-internal)
CREATE POLICY "Company contacts can view their communications"
  ON public.company_communications
  FOR SELECT
  USING (
    company_id IN (SELECT public.get_user_company_id(auth.uid()))
    AND is_internal_note = false
  );

-- Company contacts can create outgoing messages
CREATE POLICY "Company contacts can send messages"
  ON public.company_communications
  FOR INSERT
  WITH CHECK (
    company_id IN (SELECT public.get_user_company_id(auth.uid()))
    AND direction = 'outgoing'
    AND is_internal_note = false
  );

-- Admins can do everything
CREATE POLICY "Admins can manage all communications"
  ON public.company_communications
  FOR ALL
  USING (public.is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_company_communications_updated_at
  BEFORE UPDATE ON public.company_communications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast company lookups
CREATE INDEX idx_company_communications_company ON public.company_communications(company_id, created_at DESC);
