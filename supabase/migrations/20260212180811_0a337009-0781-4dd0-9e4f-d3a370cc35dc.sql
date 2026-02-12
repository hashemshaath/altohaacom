
-- Table to track bulk import batches
CREATE TABLE public.bulk_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL, -- 'exhibition', 'competition', 'company', 'entity', 'participant', 'judge', 'winner'
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'processing', 'review', 'approved', 'rejected', 'completed'
  file_name TEXT,
  total_rows INTEGER DEFAULT 0,
  processed_rows INTEGER DEFAULT 0,
  failed_rows INTEGER DEFAULT 0,
  imported_data JSONB DEFAULT '[]'::jsonb,
  errors JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bulk_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bulk imports"
ON public.bulk_imports
FOR ALL
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

CREATE TRIGGER update_bulk_imports_updated_at
BEFORE UPDATE ON public.bulk_imports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
