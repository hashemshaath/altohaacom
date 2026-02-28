
-- Establishment Reviews & Ratings
CREATE TABLE public.establishment_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  title_ar text,
  content text,
  content_ar text,
  visit_date date,
  visit_type text DEFAULT 'dine_in',
  photos text[],
  helpful_count integer DEFAULT 0,
  is_verified_visit boolean DEFAULT false,
  status text DEFAULT 'published',
  reply_text text,
  reply_text_ar text,
  replied_by uuid,
  replied_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(establishment_id, user_id)
);

ALTER TABLE public.establishment_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published reviews" ON public.establishment_reviews FOR SELECT USING (status = 'published');
CREATE POLICY "Users can create own reviews" ON public.establishment_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.establishment_reviews FOR UPDATE USING (auth.uid() = user_id OR public.is_admin_user());
CREATE POLICY "Admins can delete reviews" ON public.establishment_reviews FOR DELETE USING (public.is_admin_user());

-- Review helpful votes
CREATE TABLE public.establishment_review_helpful (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES establishment_reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(review_id, user_id)
);

ALTER TABLE public.establishment_review_helpful ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view helpful" ON public.establishment_review_helpful FOR SELECT USING (true);
CREATE POLICY "Users can vote helpful" ON public.establishment_review_helpful FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own vote" ON public.establishment_review_helpful FOR DELETE USING (auth.uid() = user_id);

-- Trigger for helpful count
CREATE OR REPLACE FUNCTION public.update_establishment_review_helpful_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE establishment_reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE establishment_reviews SET helpful_count = GREATEST(helpful_count - 1, 0) WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;

CREATE TRIGGER trg_establishment_review_helpful_insert AFTER INSERT ON establishment_review_helpful FOR EACH ROW EXECUTE FUNCTION update_establishment_review_helpful_count();
CREATE TRIGGER trg_establishment_review_helpful_delete AFTER DELETE ON establishment_review_helpful FOR EACH ROW EXECUTE FUNCTION update_establishment_review_helpful_count();

-- Bookings / Appointments
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  establishment_id uuid REFERENCES establishments(id) ON DELETE SET NULL,
  booking_type text DEFAULT 'table_reservation',
  title text,
  title_ar text,
  booking_date date NOT NULL,
  start_time time,
  end_time time,
  party_size integer DEFAULT 1,
  status text DEFAULT 'pending',
  notes text,
  confirmation_code text DEFAULT UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT) FROM 1 FOR 8)),
  confirmed_by uuid,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id OR public.is_admin_user());
CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = user_id OR public.is_admin_user());
CREATE POLICY "Admins can delete bookings" ON public.bookings FOR DELETE USING (public.is_admin_user());
