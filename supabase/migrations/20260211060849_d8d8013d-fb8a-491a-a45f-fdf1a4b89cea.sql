
-- Support Tickets System
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL DEFAULT '',
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  subject_ar TEXT,
  description TEXT NOT NULL,
  description_ar TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',
  assigned_to UUID,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Ticket number generation
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date TEXT;
  v_count INTEGER;
BEGIN
  v_date := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO v_count
  FROM support_tickets
  WHERE created_at::date = CURRENT_DATE;
  RETURN 'TKT' || v_date || LPAD(v_count::TEXT, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_set_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_ticket_number
  BEFORE INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_ticket_number();

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS for support_tickets
CREATE POLICY "Users can view their own tickets" ON public.support_tickets
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets" ON public.support_tickets
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete tickets" ON public.support_tickets
  FOR DELETE USING (public.is_admin(auth.uid()));

-- Ticket Messages (replies/thread)
CREATE TABLE public.support_ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  message_ar TEXT,
  is_internal_note BOOLEAN DEFAULT false,
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ticket messages" ON public.support_ticket_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

CREATE POLICY "Users can add messages to their tickets" ON public.support_ticket_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

-- Live Chat Sessions
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id UUID,
  status TEXT NOT NULL DEFAULT 'waiting',
  subject TEXT,
  subject_ar TEXT,
  rating INTEGER,
  feedback TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their chat sessions" ON public.chat_sessions
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = agent_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create chat sessions" ON public.chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Update chat sessions" ON public.chat_sessions
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = agent_id OR public.is_admin(auth.uid()));

-- Live Chat Messages
CREATE TABLE public.chat_session_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_session_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chat messages" ON public.chat_session_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions s
      WHERE s.id = session_id AND (s.user_id = auth.uid() OR s.agent_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

CREATE POLICY "Users can send chat messages" ON public.chat_session_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.chat_sessions s
      WHERE s.id = session_id AND (s.user_id = auth.uid() OR s.agent_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

-- Audience Segments for targeting
CREATE TABLE public.audience_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  filters JSONB NOT NULL DEFAULT '{}',
  estimated_reach INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audience_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage segments" ON public.audience_segments
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_audience_segments_updated_at
  BEFORE UPDATE ON public.audience_segments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- CRM Activities (activity log for leads)
CREATE TABLE public.crm_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage CRM activities" ON public.crm_activities
  FOR ALL USING (public.is_admin(auth.uid()));

-- Enable realtime for live chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_session_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_ticket_messages;

-- Indexes
CREATE INDEX idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_assigned ON public.support_tickets(assigned_to);
CREATE INDEX idx_ticket_messages_ticket ON public.support_ticket_messages(ticket_id);
CREATE INDEX idx_chat_sessions_user ON public.chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_status ON public.chat_sessions(status);
CREATE INDEX idx_chat_messages_session ON public.chat_session_messages(session_id);
CREATE INDEX idx_crm_activities_lead ON public.crm_activities(lead_id);
CREATE INDEX idx_audience_segments_active ON public.audience_segments(is_active);
