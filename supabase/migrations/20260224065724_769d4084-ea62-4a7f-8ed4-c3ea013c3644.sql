
-- ============================================
-- 1. Exhibition Ticket Bookings
-- ============================================
CREATE TABLE public.exhibition_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exhibition_id UUID NOT NULL REFERENCES public.exhibitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  ticket_number TEXT NOT NULL DEFAULT '',
  ticket_type TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'confirmed',
  booking_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  attendee_name TEXT,
  attendee_name_ar TEXT,
  attendee_email TEXT,
  attendee_phone TEXT,
  notes TEXT,
  checked_in_at TIMESTAMPTZ,
  qr_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.generate_exhibition_ticket_number()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_date TEXT; v_count INTEGER;
BEGIN
  v_date := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO v_count FROM exhibition_tickets WHERE created_at::date = CURRENT_DATE;
  RETURN 'ETK' || v_date || LPAD(v_count::TEXT, 6, '0');
END; $$;

CREATE OR REPLACE FUNCTION public.trigger_set_exhibition_ticket_number()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := generate_exhibition_ticket_number();
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER set_exhibition_ticket_number
BEFORE INSERT ON public.exhibition_tickets
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_exhibition_ticket_number();

ALTER TABLE public.exhibition_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tickets" ON public.exhibition_tickets
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tickets" ON public.exhibition_tickets
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets" ON public.exhibition_tickets
FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update tickets" ON public.exhibition_tickets
FOR UPDATE USING (public.is_admin(auth.uid()));

-- ============================================
-- 2. Exhibition Agenda Items
-- ============================================
CREATE TABLE public.exhibition_agenda_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exhibition_id UUID NOT NULL REFERENCES public.exhibitions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  speaker_name TEXT,
  speaker_name_ar TEXT,
  speaker_image_url TEXT,
  location TEXT,
  location_ar TEXT,
  day_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  category TEXT DEFAULT 'session',
  is_highlighted BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exhibition_agenda_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view agenda items" ON public.exhibition_agenda_items
FOR SELECT USING (true);

CREATE POLICY "Admins can manage agenda items" ON public.exhibition_agenda_items
FOR ALL USING (public.is_admin(auth.uid()));

-- User favorites for agenda items
CREATE TABLE public.exhibition_agenda_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agenda_item_id UUID NOT NULL REFERENCES public.exhibition_agenda_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, agenda_item_id)
);

ALTER TABLE public.exhibition_agenda_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites" ON public.exhibition_agenda_favorites
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites" ON public.exhibition_agenda_favorites
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON public.exhibition_agenda_favorites
FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 3. Exhibition Floor Map / Booths
-- ============================================
CREATE TABLE public.exhibition_booths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exhibition_id UUID NOT NULL REFERENCES public.exhibitions(id) ON DELETE CASCADE,
  booth_number TEXT NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  category TEXT DEFAULT 'general',
  company_id UUID REFERENCES public.companies(id),
  logo_url TEXT,
  location_x NUMERIC,
  location_y NUMERIC,
  hall TEXT,
  hall_ar TEXT,
  floor_level TEXT DEFAULT 'ground',
  size TEXT DEFAULT 'standard',
  is_featured BOOLEAN DEFAULT false,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exhibition_booths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view booths" ON public.exhibition_booths
FOR SELECT USING (true);

CREATE POLICY "Admins can manage booths" ON public.exhibition_booths
FOR ALL USING (public.is_admin(auth.uid()));

-- ============================================
-- 4. Exhibition Reviews / Ratings
-- ============================================
CREATE TABLE public.exhibition_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exhibition_id UUID NOT NULL REFERENCES public.exhibitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  title_ar TEXT,
  content TEXT,
  content_ar TEXT,
  is_verified_attendee BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(exhibition_id, user_id)
);

ALTER TABLE public.exhibition_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published reviews" ON public.exhibition_reviews
FOR SELECT USING (is_published = true OR auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create their own reviews" ON public.exhibition_reviews
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON public.exhibition_reviews
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON public.exhibition_reviews
FOR DELETE USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Indexes
CREATE INDEX idx_exhibition_tickets_exhibition ON public.exhibition_tickets(exhibition_id);
CREATE INDEX idx_exhibition_tickets_user ON public.exhibition_tickets(user_id);
CREATE INDEX idx_exhibition_agenda_items_exhibition ON public.exhibition_agenda_items(exhibition_id, day_date);
CREATE INDEX idx_exhibition_booths_exhibition ON public.exhibition_booths(exhibition_id);
CREATE INDEX idx_exhibition_reviews_exhibition ON public.exhibition_reviews(exhibition_id);
