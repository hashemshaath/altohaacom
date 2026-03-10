
-- SEO audit reports and issues
CREATE TABLE public.seo_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running',
  total_pages INTEGER DEFAULT 0,
  issues_found INTEGER DEFAULT 0,
  score INTEGER,
  summary JSONB DEFAULT '{}',
  triggered_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.seo_audit_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES public.seo_audits(id) ON DELETE CASCADE NOT NULL,
  page_path TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning',
  message TEXT NOT NULL,
  message_ar TEXT,
  details JSONB DEFAULT '{}',
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_audit_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage seo_audits" ON public.seo_audits
  FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins can manage seo_audit_issues" ON public.seo_audit_issues
  FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE INDEX idx_seo_audit_issues_audit ON public.seo_audit_issues(audit_id);
CREATE INDEX idx_seo_audit_issues_severity ON public.seo_audit_issues(severity);
