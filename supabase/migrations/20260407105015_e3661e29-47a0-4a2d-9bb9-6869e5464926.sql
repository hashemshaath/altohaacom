CREATE POLICY "Public can read active integration settings"
ON public.integration_settings
FOR SELECT
TO anon, authenticated
USING (is_active = true);