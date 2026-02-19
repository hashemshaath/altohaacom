
-- Create translation keys table for managing platform translations
CREATE TABLE public.translation_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  namespace TEXT NOT NULL DEFAULT 'common',
  en TEXT NOT NULL DEFAULT '',
  ar TEXT NOT NULL DEFAULT '',
  context TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  auto_translated BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.translation_keys ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can view translations"
ON public.translation_keys FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert translations"
ON public.translation_keys FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update translations"
ON public.translation_keys FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete translations"
ON public.translation_keys FOR DELETE
USING (public.is_admin(auth.uid()));

-- Create platform languages config table
CREATE TABLE public.platform_languages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  native_name TEXT NOT NULL,
  is_rtl BOOLEAN NOT NULL DEFAULT false,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  flag_emoji TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage platform languages"
ON public.platform_languages FOR ALL
USING (public.is_admin(auth.uid()));

-- Seed default languages
INSERT INTO public.platform_languages (code, name, native_name, is_rtl, is_enabled, is_default, flag_emoji, sort_order) VALUES
  ('en', 'English', 'English', false, true, true, '🇬🇧', 1),
  ('ar', 'Arabic', 'العربية', true, true, false, '🇸🇦', 2),
  ('fr', 'French', 'Français', false, false, false, '🇫🇷', 3),
  ('es', 'Spanish', 'Español', false, false, false, '🇪🇸', 4),
  ('de', 'German', 'Deutsch', false, false, false, '🇩🇪', 5),
  ('tr', 'Turkish', 'Türkçe', false, false, false, '🇹🇷', 6),
  ('ur', 'Urdu', 'اردو', true, false, false, '🇵🇰', 7),
  ('hi', 'Hindi', 'हिन्दी', false, false, false, '🇮🇳', 8),
  ('zh', 'Chinese', '中文', false, false, false, '🇨🇳', 9),
  ('ja', 'Japanese', '日本語', false, false, false, '🇯🇵', 10);

-- Trigger for updated_at
CREATE TRIGGER update_translation_keys_updated_at
BEFORE UPDATE ON public.translation_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_platform_languages_updated_at
BEFORE UPDATE ON public.platform_languages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
