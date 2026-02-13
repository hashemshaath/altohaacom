
-- Add notes column to requirement_list_items for item-level notes/recommendations
ALTER TABLE public.requirement_list_items ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.requirement_list_items ADD COLUMN IF NOT EXISTS notes_ar text;
ALTER TABLE public.requirement_list_items ADD COLUMN IF NOT EXISTS importance text DEFAULT 'normal';
ALTER TABLE public.requirement_list_items ADD COLUMN IF NOT EXISTS last_edited_by uuid;
ALTER TABLE public.requirement_list_items ADD COLUMN IF NOT EXISTS last_edited_at timestamptz;
