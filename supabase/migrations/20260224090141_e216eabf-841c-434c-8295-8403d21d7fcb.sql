
-- Phase 23: Saved Reports & Export History

-- Scheduled/saved reports
CREATE TABLE IF NOT EXISTS public.saved_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT,
  report_type TEXT NOT NULL,
  filters JSONB DEFAULT '{}',
  columns TEXT[] DEFAULT '{}',
  schedule TEXT DEFAULT NULL,
  last_generated_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage saved reports"
  ON public.saved_reports FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Report export history
CREATE TABLE IF NOT EXISTS public.report_exports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES public.saved_reports(id) ON DELETE SET NULL,
  exported_by UUID NOT NULL,
  report_type TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'csv',
  row_count INTEGER DEFAULT 0,
  file_url TEXT,
  filters JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage report exports"
  ON public.report_exports FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Add smart notification columns to existing preferences
ALTER TABLE public.notification_preferences 
  ADD COLUMN IF NOT EXISTS quiet_hours_start TIME DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS quiet_hours_end TIME DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS digest_frequency TEXT DEFAULT 'instant',
  ADD COLUMN IF NOT EXISTS muted_types TEXT[] DEFAULT '{}';
