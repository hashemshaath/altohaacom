-- Table for storing scheduled AI analytics reports
CREATE TABLE public.ai_analytics_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type TEXT NOT NULL DEFAULT 'weekly',
  language TEXT NOT NULL DEFAULT 'en',
  content TEXT NOT NULL,
  data_snapshot JSONB,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_analytics_reports ENABLE ROW LEVEL SECURITY;

-- Only admins/supervisors can view reports
CREATE POLICY "Admins can view analytics reports"
  ON public.ai_analytics_reports FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Enable pg_cron and pg_net extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;