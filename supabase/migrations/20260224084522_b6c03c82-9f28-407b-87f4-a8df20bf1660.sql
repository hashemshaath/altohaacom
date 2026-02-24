
-- Add discount codes for exhibitions
CREATE TABLE public.exhibition_discount_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exhibition_id UUID NOT NULL REFERENCES public.exhibitions(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- percentage or fixed
  discount_value NUMERIC NOT NULL DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(exhibition_id, code)
);

ALTER TABLE public.exhibition_discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active discount codes" ON public.exhibition_discount_codes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Exhibition creators can manage discount codes" ON public.exhibition_discount_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM exhibitions WHERE id = exhibition_id AND created_by = auth.uid())
    OR public.is_admin_user()
  );

-- Add discount_code_id to exhibition_tickets
ALTER TABLE public.exhibition_tickets ADD COLUMN IF NOT EXISTS discount_code_id UUID REFERENCES public.exhibition_discount_codes(id);
ALTER TABLE public.exhibition_tickets ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

-- Add photo lightbox support - add full_size_urls to reviews (already have photo_urls)
-- Add review response from organizer directly on the review
ALTER TABLE public.exhibition_reviews ADD COLUMN IF NOT EXISTS organizer_response TEXT;
ALTER TABLE public.exhibition_reviews ADD COLUMN IF NOT EXISTS organizer_response_at TIMESTAMPTZ;
ALTER TABLE public.exhibition_reviews ADD COLUMN IF NOT EXISTS organizer_response_by UUID REFERENCES auth.users(id);
