
-- 1) user-media: restrict anon access to avatars subfolder only
DROP POLICY IF EXISTS "Public can view user media avatars" ON storage.objects;
CREATE POLICY "Public can view user media avatars"
ON storage.objects FOR SELECT TO anon
USING (
  bucket_id = 'user-media'
  AND (storage.foldername(name))[1] = 'avatars'
);

-- 2) Remove old public SEO policies that override admin-only ones
DROP POLICY IF EXISTS "SEO AI models are publicly readable" ON public.seo_ai_models;
DROP POLICY IF EXISTS "seo_ai_models_select" ON public.seo_ai_models;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.seo_ai_models;

DROP POLICY IF EXISTS "SEO rules are publicly readable" ON public.seo_rules;
DROP POLICY IF EXISTS "seo_rules_select" ON public.seo_rules;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.seo_rules;

DROP POLICY IF EXISTS "SEO translatable fields are publicly readable" ON public.seo_translatable_fields;
DROP POLICY IF EXISTS "seo_translatable_fields_select" ON public.seo_translatable_fields;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.seo_translatable_fields;

DROP POLICY IF EXISTS "SEO content sources are publicly readable" ON public.seo_content_sources;
DROP POLICY IF EXISTS "seo_content_sources_select" ON public.seo_content_sources;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.seo_content_sources;
