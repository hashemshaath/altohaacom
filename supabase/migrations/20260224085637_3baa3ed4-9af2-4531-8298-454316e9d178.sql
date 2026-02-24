
-- Exhibition indoor map waypoints for navigation
CREATE TABLE public.exhibition_map_waypoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibition_id UUID NOT NULL REFERENCES public.exhibitions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  waypoint_type TEXT NOT NULL DEFAULT 'booth',
  x_position NUMERIC NOT NULL DEFAULT 0,
  y_position NUMERIC NOT NULL DEFAULT 0,
  floor_number INTEGER DEFAULT 1,
  booth_id UUID REFERENCES public.exhibition_booths(id) ON DELETE SET NULL,
  icon TEXT,
  description TEXT,
  description_ar TEXT,
  is_accessible BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_map_waypoints_exhibition ON exhibition_map_waypoints(exhibition_id);
ALTER TABLE public.exhibition_map_waypoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view waypoints"
ON public.exhibition_map_waypoints FOR SELECT USING (true);

CREATE POLICY "Organizers can manage waypoints"
ON public.exhibition_map_waypoints FOR ALL
USING (
  EXISTS (SELECT 1 FROM exhibitions e WHERE e.id = exhibition_id AND e.created_by = auth.uid())
  OR public.is_admin_user()
);

-- Exhibition auctions
CREATE TABLE public.exhibition_auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibition_id UUID NOT NULL REFERENCES public.exhibitions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  image_url TEXT,
  starting_price NUMERIC NOT NULL DEFAULT 0,
  current_price NUMERIC NOT NULL DEFAULT 0,
  min_increment NUMERIC NOT NULL DEFAULT 1,
  currency TEXT DEFAULT 'SAR',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming',
  winner_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_auctions_exhibition ON exhibition_auctions(exhibition_id);
ALTER TABLE public.exhibition_auctions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view auctions"
ON public.exhibition_auctions FOR SELECT USING (true);

CREATE POLICY "Organizers can manage auctions"
ON public.exhibition_auctions FOR ALL
USING (
  EXISTS (SELECT 1 FROM exhibitions e WHERE e.id = exhibition_id AND e.created_by = auth.uid())
  OR public.is_admin_user()
);

-- Auction bids
CREATE TABLE public.exhibition_auction_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES public.exhibition_auctions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bids_auction ON exhibition_auction_bids(auction_id);
ALTER TABLE public.exhibition_auction_bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view bids"
ON public.exhibition_auction_bids FOR SELECT USING (true);

CREATE POLICY "Auth users can bid"
ON public.exhibition_auction_bids FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Exhibition special offers (flash deals)
CREATE TABLE public.exhibition_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibition_id UUID NOT NULL REFERENCES public.exhibitions(id) ON DELETE CASCADE,
  booth_id UUID REFERENCES public.exhibition_booths(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  image_url TEXT,
  original_price NUMERIC,
  offer_price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'SAR',
  discount_percent INTEGER,
  quantity_available INTEGER,
  quantity_claimed INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_offers_exhibition ON exhibition_offers(exhibition_id);
ALTER TABLE public.exhibition_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active offers"
ON public.exhibition_offers FOR SELECT USING (true);

CREATE POLICY "Organizers can manage offers"
ON public.exhibition_offers FOR ALL
USING (
  EXISTS (SELECT 1 FROM exhibitions e WHERE e.id = exhibition_id AND e.created_by = auth.uid())
  OR public.is_admin_user()
);

-- Add supplier_score to companies
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS supplier_score NUMERIC DEFAULT 0;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS on_time_delivery_rate NUMERIC DEFAULT 0;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS response_time_hours NUMERIC DEFAULT 0;

-- Enable realtime for auctions
ALTER PUBLICATION supabase_realtime ADD TABLE public.exhibition_auction_bids;
