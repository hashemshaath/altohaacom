-- Create storage bucket for brand assets (logos, seasonal identity)
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Brand assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-assets');

-- Admin upload
CREATE POLICY "Admins can upload brand assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'brand-assets'
  AND public.is_admin_user()
);

-- Admin update
CREATE POLICY "Admins can update brand assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'brand-assets'
  AND public.is_admin_user()
);

-- Admin delete
CREATE POLICY "Admins can delete brand assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'brand-assets'
  AND public.is_admin_user()
);
