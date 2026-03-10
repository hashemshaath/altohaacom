
-- Core Web Vitals tracking table
CREATE TABLE public.seo_web_vitals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path TEXT NOT NULL,
  -- Core Web Vitals
  lcp NUMERIC,           -- Largest Contentful Paint (ms)
  inp NUMERIC,           -- Interaction to Next Paint (ms)
  cls NUMERIC,           -- Cumulative Layout Shift (score)
  fcp NUMERIC,           -- First Contentful Paint (ms)
  ttfb NUMERIC,          -- Time to First Byte (ms)
  -- Context
  device_type TEXT DEFAULT 'desktop',
  connection_type TEXT,  -- e.g. '4g', '3g', 'wifi'
  session_id TEXT,
  user_agent TEXT,
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for analytics queries
CREATE INDEX idx_web_vitals_path_created ON public.seo_web_vitals (path, created_at DESC);
CREATE INDEX idx_web_vitals_device ON public.seo_web_vitals (device_type, created_at DESC);
CREATE INDEX idx_web_vitals_created ON public.seo_web_vitals (created_at DESC);

-- Allow anonymous inserts (beacon-based tracking), no reads from client
ALTER TABLE public.seo_web_vitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous vitals inserts"
  ON public.seo_web_vitals
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Only admins can read vitals"
  ON public.seo_web_vitals
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user());
