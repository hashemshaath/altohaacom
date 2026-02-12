
-- Add link_type columns to competitions for tracking what entity it's linked to
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS link_type TEXT DEFAULT 'exhibition';
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS linked_entity_id UUID;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS linked_chef_id UUID;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS linked_tasting_id UUID;
