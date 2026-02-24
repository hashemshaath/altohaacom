
-- Smart notification rules for automated triggers
CREATE TABLE public.notification_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  trigger_event TEXT NOT NULL, -- e.g. 'user_signup', 'competition_registration', 'invoice_overdue', 'membership_expiring', 'inactivity'
  conditions JSONB DEFAULT '{}'::jsonb, -- e.g. {"days_inactive": 7, "role": "chef"}
  notification_title TEXT NOT NULL,
  notification_title_ar TEXT,
  notification_body TEXT NOT NULL,
  notification_body_ar TEXT,
  notification_type TEXT DEFAULT 'info',
  notification_link TEXT,
  channels TEXT[] DEFAULT ARRAY['in_app'],
  delay_minutes INTEGER DEFAULT 0, -- delay before sending
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  max_sends_per_user INTEGER DEFAULT 1, -- prevent spam
  cooldown_hours INTEGER DEFAULT 24, -- min hours between re-sends
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Track which rules fired for which users
CREATE TABLE public.notification_rule_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID NOT NULL REFERENCES public.notification_rules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  notification_id UUID REFERENCES public.notifications(id),
  triggered_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_notification_rule_logs_rule_user ON public.notification_rule_logs(rule_id, user_id);
CREATE INDEX idx_notification_rule_logs_user ON public.notification_rule_logs(user_id);
CREATE INDEX idx_notification_rules_active ON public.notification_rules(is_active) WHERE is_active = true;

-- RLS
ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_rule_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notification rules"
ON public.notification_rules FOR ALL
USING (public.is_admin_user());

CREATE POLICY "Admins can view rule logs"
ON public.notification_rule_logs FOR SELECT
USING (public.is_admin_user());

CREATE POLICY "System can insert rule logs"
ON public.notification_rule_logs FOR INSERT
WITH CHECK (true);
