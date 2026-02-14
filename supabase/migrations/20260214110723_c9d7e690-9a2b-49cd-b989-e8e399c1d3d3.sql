
-- Company support messages for company-admin communication
CREATE TABLE public.company_support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL DEFAULT 'company' CHECK (sender_type IN ('company', 'admin')),
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_csm_company ON public.company_support_messages(company_id);
CREATE INDEX idx_csm_created ON public.company_support_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.company_support_messages ENABLE ROW LEVEL SECURITY;

-- Company contacts can view their company's messages
CREATE POLICY "Company contacts can view messages"
ON public.company_support_messages FOR SELECT
TO authenticated
USING (
  company_id IN (SELECT public.get_user_company_id(auth.uid()))
  OR public.is_admin_user()
);

-- Company contacts can send messages
CREATE POLICY "Company contacts can insert messages"
ON public.company_support_messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND (
    (sender_type = 'company' AND company_id IN (SELECT public.get_user_company_id(auth.uid())))
    OR (sender_type = 'admin' AND public.is_admin_user())
  )
);

-- Users can mark messages as read
CREATE POLICY "Users can update read status"
ON public.company_support_messages FOR UPDATE
TO authenticated
USING (
  company_id IN (SELECT public.get_user_company_id(auth.uid()))
  OR public.is_admin_user()
)
WITH CHECK (
  company_id IN (SELECT public.get_user_company_id(auth.uid()))
  OR public.is_admin_user()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_support_messages;
