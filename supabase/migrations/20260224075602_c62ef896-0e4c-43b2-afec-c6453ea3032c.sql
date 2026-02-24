
-- ============================================
-- 1. Exhibition Schedule Items (event agenda within exhibitions)
-- ============================================
CREATE TABLE public.exhibition_schedule_items (
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
  category TEXT NOT NULL DEFAULT 'session',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  max_attendees INT,
  is_featured BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exhibition_schedule_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view schedule items" ON public.exhibition_schedule_items
  FOR SELECT USING (true);

CREATE POLICY "Exhibition creator can manage schedule items" ON public.exhibition_schedule_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM exhibitions e WHERE e.id = exhibition_id AND e.created_by = auth.uid())
  );

CREATE POLICY "Admins can manage schedule items" ON public.exhibition_schedule_items
  FOR ALL USING (public.is_admin(auth.uid()));

-- ============================================
-- 2. Exhibition Ticket Types
-- ============================================
CREATE TABLE public.exhibition_ticket_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exhibition_id UUID NOT NULL REFERENCES public.exhibitions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'SAR',
  max_quantity INT,
  sold_count INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT DEFAULT 0,
  benefits JSONB DEFAULT '[]',
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exhibition_ticket_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active ticket types" ON public.exhibition_ticket_types
  FOR SELECT USING (true);

CREATE POLICY "Exhibition creator can manage ticket types" ON public.exhibition_ticket_types
  FOR ALL USING (
    EXISTS (SELECT 1 FROM exhibitions e WHERE e.id = exhibition_id AND e.created_by = auth.uid())
  );

CREATE POLICY "Admins can manage ticket types" ON public.exhibition_ticket_types
  FOR ALL USING (public.is_admin(auth.uid()));

-- ============================================
-- 3. Add ticket_type_id to exhibition_tickets
-- ============================================
ALTER TABLE public.exhibition_tickets 
  ADD COLUMN IF NOT EXISTS ticket_type_id UUID REFERENCES public.exhibition_ticket_types(id),
  ADD COLUMN IF NOT EXISTS price_paid DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'SAR';

-- ============================================
-- 4. Add status colors to exhibition_booths for map
-- ============================================
ALTER TABLE public.exhibition_booths
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS color_hex TEXT;

-- ============================================
-- 5. Schedule item registration (users can register for specific sessions)
-- ============================================
CREATE TABLE public.exhibition_schedule_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_item_id UUID NOT NULL REFERENCES public.exhibition_schedule_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(schedule_item_id, user_id)
);

ALTER TABLE public.exhibition_schedule_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own registrations" ON public.exhibition_schedule_registrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can see registration counts" ON public.exhibition_schedule_registrations
  FOR SELECT USING (true);

CREATE POLICY "Users can register themselves" ON public.exhibition_schedule_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unregister themselves" ON public.exhibition_schedule_registrations
  FOR DELETE USING (auth.uid() = user_id);

-- Increment sold_count trigger for ticket types
CREATE OR REPLACE FUNCTION public.increment_ticket_type_sold()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.ticket_type_id IS NOT NULL THEN
    UPDATE exhibition_ticket_types SET sold_count = sold_count + 1 WHERE id = NEW.ticket_type_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_increment_ticket_type_sold
AFTER INSERT ON public.exhibition_tickets
FOR EACH ROW EXECUTE FUNCTION public.increment_ticket_type_sold();
