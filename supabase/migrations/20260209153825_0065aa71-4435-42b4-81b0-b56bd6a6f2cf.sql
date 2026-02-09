
-- Add exhibition_id to competitions to link them
ALTER TABLE public.competitions ADD COLUMN exhibition_id UUID REFERENCES public.exhibitions(id) ON DELETE SET NULL;

-- Create index for fast lookups
CREATE INDEX idx_competitions_exhibition_id ON public.competitions(exhibition_id);

-- Link the existing Carthage competitions to their exhibition
UPDATE public.competitions 
SET exhibition_id = 'a1b2c3d4-1111-2222-3333-444455556666'
WHERE id IN ('c1111111-aaaa-bbbb-cccc-dddddddddddd', 'c2222222-aaaa-bbbb-cccc-dddddddddddd', 'c3333333-aaaa-bbbb-cccc-dddddddddddd');

-- Update the exhibition cover image
UPDATE public.exhibitions 
SET cover_image_url = '/exhibition-covers/carthage-chefs-cup.jpg'
WHERE id = 'a1b2c3d4-1111-2222-3333-444455556666';
