
-- Add company response columns to company_evaluations
ALTER TABLE public.company_evaluations
ADD COLUMN IF NOT EXISTS company_response TEXT,
ADD COLUMN IF NOT EXISTS company_response_ar TEXT,
ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS responded_by UUID;
