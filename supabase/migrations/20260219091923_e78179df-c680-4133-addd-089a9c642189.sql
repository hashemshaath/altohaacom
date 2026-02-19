
-- Create site_settings key-value store for all admin-configurable settings
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'general',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings (needed for header/footer/branding on frontend)
CREATE POLICY "Anyone can read site settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can insert site settings"
  ON public.site_settings FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update site settings"
  ON public.site_settings FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete site settings"
  ON public.site_settings FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Seed default settings
INSERT INTO public.site_settings (key, value, category) VALUES
  ('branding', '{"siteName":"Altoha","siteNameAr":"الطهاة","siteDescription":"The premier global culinary community platform","siteDescriptionAr":"المنصة الرائدة لمجتمع الطهي العالمي","contactEmail":"info@altoha.com","logoUrl":"/altoha-logo.png","faviconUrl":"/favicon.ico"}', 'general'),
  ('header', '{"showLogo":true,"showBrandName":true,"showSearch":true,"showNotifications":true,"showThemeToggle":true,"showLanguageSwitcher":true,"stickyHeader":true,"transparentOnHero":false}', 'layout'),
  ('footer', '{"showFooter":true,"showSocialLinks":true,"showNewsletter":false,"copyrightText":"© {year} Altoha. All rights reserved.","copyrightTextAr":"© {year} الطهاة. جميع الحقوق محفوظة.","instagramUrl":"https://instagram.com/altohacom","xUrl":"https://x.com/altohacom","linkedinUrl":"https://linkedin.com/company/altohacom","youtubeUrl":"https://youtube.com/@altohacom","tiktokUrl":"","snapchatUrl":""}', 'layout'),
  ('layout', '{"maxWidth":1200,"containerPadding":"0.75rem","showBreadcrumbs":false,"enableAnimations":true,"compactMode":false}', 'layout'),
  ('notifications', '{"emailNotifications":true,"pushNotifications":false,"smsNotifications":false,"digestFrequency":"daily"}', 'notifications'),
  ('security', '{"requireStrongPasswords":true,"sessionTimeoutMinutes":60,"maxLoginAttempts":5,"enable2FA":false,"requireEmailVerification":true}', 'security'),
  ('content', '{"autoApproveContent":false,"maxUploadSizeMB":10,"enableComments":true,"enableReactions":true,"moderationLevel":"standard"}', 'content'),
  ('seo', '{"defaultTitle":"Altoha - Global Culinary Community","defaultTitleAr":"الطهاة - مجتمع الطهي العالمي","defaultDescription":"The premier global culinary community platform","defaultDescriptionAr":"المنصة الرائدة لمجتمع الطهي العالمي","ogImageUrl":"","robotsTxt":"","sitemapEnabled":true}', 'seo'),
  ('registration', '{"allowRegistration":true,"requireEmailVerification":true,"defaultRole":"chef","allowSocialLogin":true,"maintenanceMode":false}', 'general')
ON CONFLICT (key) DO NOTHING;

-- Create index for faster category lookups
CREATE INDEX idx_site_settings_category ON public.site_settings (category);
