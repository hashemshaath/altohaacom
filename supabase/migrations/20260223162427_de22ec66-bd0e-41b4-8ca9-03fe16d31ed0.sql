
-- Create smart_import_logs table to track all imports
CREATE TABLE public.smart_import_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  imported_by UUID NOT NULL,
  target_table TEXT NOT NULL,
  target_record_id UUID,
  action TEXT NOT NULL DEFAULT 'create', -- 'create' or 'update'
  entity_name TEXT,
  entity_name_ar TEXT,
  entity_type TEXT,
  source_query TEXT,
  source_location TEXT,
  source_url TEXT,
  sources_used JSONB,
  extracted_fields_count INTEGER DEFAULT 0,
  imported_data JSONB,
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.smart_import_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view/insert
CREATE POLICY "Admins can view import logs"
  ON public.smart_import_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert import logs"
  ON public.smart_import_logs FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Index for quick lookups
CREATE INDEX idx_smart_import_logs_created ON public.smart_import_logs(created_at DESC);
CREATE INDEX idx_smart_import_logs_target ON public.smart_import_logs(target_table, target_record_id);
