
-- SEO Competitors table
CREATE TABLE IF NOT EXISTS public.seo_competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL,
  name text NOT NULL,
  da_score integer,
  organic_keywords integer,
  organic_traffic integer,
  backlinks integer,
  last_checked timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(domain)
);

ALTER TABLE public.seo_competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage seo_competitors" ON public.seo_competitors
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'supervisor'))
  WITH CHECK (public.has_role(auth.uid(), 'supervisor'));

-- SEO Backlinks table
CREATE TABLE IF NOT EXISTS public.seo_backlinks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url text NOT NULL,
  source_domain text NOT NULL,
  target_path text NOT NULL DEFAULT '/',
  anchor_text text,
  domain_authority integer,
  link_type text NOT NULL DEFAULT 'editorial',
  status text NOT NULL DEFAULT 'active',
  is_dofollow boolean NOT NULL DEFAULT true,
  first_seen timestamptz NOT NULL DEFAULT now(),
  last_checked timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_backlinks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage seo_backlinks" ON public.seo_backlinks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'supervisor'))
  WITH CHECK (public.has_role(auth.uid(), 'supervisor'));
