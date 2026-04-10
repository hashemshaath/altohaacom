
-- 1) knowledge-files: restrict to published or admin
DROP POLICY IF EXISTS "Authenticated users can view knowledge files" ON storage.objects;
CREATE POLICY "Authenticated users can view knowledge files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'knowledge-files'
  AND (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.knowledge_resources kr
      WHERE kr.file_url LIKE '%' || name AND kr.is_published = true
    )
  )
);

-- 2) SEO internal tables: admin only
DROP POLICY IF EXISTS "Anyone can read translatable fields" ON public.seo_translatable_fields;
CREATE POLICY "Admins can read translatable fields"
ON public.seo_translatable_fields FOR SELECT TO authenticated
USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can read AI models" ON public.seo_ai_models;
CREATE POLICY "Admins can read AI models"
ON public.seo_ai_models FOR SELECT TO authenticated
USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can read content sources" ON public.seo_content_sources;
CREATE POLICY "Admins can read content sources"
ON public.seo_content_sources FOR SELECT TO authenticated
USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can read SEO rules" ON public.seo_rules;
CREATE POLICY "Admins can read SEO rules"
ON public.seo_rules FOR SELECT TO authenticated
USING (is_admin(auth.uid()));
