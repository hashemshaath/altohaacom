
-- Add tags/labels column to company_communications
ALTER TABLE public.company_communications ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Add internal_notes column if not exists (for admin-only notes on threads)
-- Note: is_internal_note already exists as boolean

-- Add response_time_minutes for SLA tracking
ALTER TABLE public.company_communications ADD COLUMN IF NOT EXISTS response_time_minutes integer;

-- Add archived status support  
ALTER TABLE public.company_communications ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;

-- Add starred/pinned support
ALTER TABLE public.company_communications ADD COLUMN IF NOT EXISTS is_starred boolean DEFAULT false;
