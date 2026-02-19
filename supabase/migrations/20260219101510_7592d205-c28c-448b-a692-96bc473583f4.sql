
-- Create country audit log table
CREATE TABLE public.country_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'activated', 'deactivated', 'bulk_activated', 'bulk_deactivated'
  changed_by UUID REFERENCES auth.users(id),
  changes JSONB, -- { field: { old: ..., new: ... } }
  summary TEXT,
  summary_ar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.country_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view country audit logs"
  ON public.country_audit_log FOR SELECT
  USING (public.is_admin_user());

-- Only admins can insert audit logs
CREATE POLICY "Admins can insert country audit logs"
  ON public.country_audit_log FOR INSERT
  WITH CHECK (public.is_admin_user());

-- Index for querying by country
CREATE INDEX idx_country_audit_log_code ON public.country_audit_log(country_code);
CREATE INDEX idx_country_audit_log_created ON public.country_audit_log(created_at DESC);
