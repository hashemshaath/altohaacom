
-- Admin-managed global events (annual food days, international events, etc.)
CREATE TABLE public.global_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'other',
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  all_day BOOLEAN NOT NULL DEFAULT true,
  start_time TIME,
  end_time TIME,
  timezone TEXT DEFAULT 'Asia/Riyadh',
  city TEXT,
  country_code TEXT,
  venue TEXT,
  venue_ar TEXT,
  organizer TEXT,
  organizer_ar TEXT,
  link TEXT,
  image_url TEXT,
  is_international BOOLEAN DEFAULT false,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  target_audience TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  color TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  priority INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.global_events ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can view active global events"
ON public.global_events FOR SELECT
USING (status = 'active');

-- Admin manage
CREATE POLICY "Admins can manage global events"
ON public.global_events FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER update_global_events_updated_at
BEFORE UPDATE ON public.global_events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
