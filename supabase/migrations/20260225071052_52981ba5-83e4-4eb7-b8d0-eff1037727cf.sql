
-- Create CV import history table
CREATE TABLE public.cv_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chef_id UUID NOT NULL,
  imported_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  file_name TEXT,
  input_method TEXT NOT NULL DEFAULT 'paste',
  sections_imported TEXT[] DEFAULT '{}',
  extracted_data JSONB,
  records_created INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cv_imports ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write
CREATE POLICY "Admins can manage cv_imports"
ON public.cv_imports
FOR ALL
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Index for quick lookups
CREATE INDEX idx_cv_imports_chef_id ON public.cv_imports(chef_id);
CREATE INDEX idx_cv_imports_created_at ON public.cv_imports(created_at DESC);
