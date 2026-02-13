-- Add vendor assignment columns to requirement_list_items
ALTER TABLE public.requirement_list_items
  ADD COLUMN IF NOT EXISTS assigned_vendor_id UUID REFERENCES public.companies(id),
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS assigned_by UUID;

-- Index for vendor queries
CREATE INDEX IF NOT EXISTS idx_req_items_vendor ON public.requirement_list_items(assigned_vendor_id) WHERE assigned_vendor_id IS NOT NULL;