
-- Profile views tracking table
CREATE TABLE public.profile_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_user_id UUID NOT NULL,
  viewer_user_id UUID,
  viewer_ip TEXT,
  viewer_user_agent TEXT,
  referrer TEXT,
  country TEXT,
  device_type TEXT,
  browser TEXT,
  gender TEXT,
  viewer_type TEXT DEFAULT 'individual',
  company_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_profile_views_profile ON public.profile_views (profile_user_id, created_at DESC);
CREATE INDEX idx_profile_views_date ON public.profile_views (created_at);

-- Enable RLS
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a view (public tracking)
CREATE POLICY "Anyone can record a profile view"
  ON public.profile_views FOR INSERT
  WITH CHECK (true);

-- Profile owners can read their own analytics
CREATE POLICY "Profile owners can view their analytics"
  ON public.profile_views FOR SELECT
  USING (profile_user_id = auth.uid());

-- Admins can view all analytics
CREATE POLICY "Admins can view all profile analytics"
  ON public.profile_views FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Add view_count column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_profile_view()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE user_id = NEW.profile_user_id;
  RETURN NEW;
END;
$$;

-- Trigger to auto-increment
CREATE TRIGGER trigger_increment_profile_view
  AFTER INSERT ON public.profile_views
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_profile_view();
