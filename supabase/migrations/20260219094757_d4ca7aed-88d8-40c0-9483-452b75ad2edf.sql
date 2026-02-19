
-- Add field_type column to seo_translatable_fields for context-aware AI optimization
ALTER TABLE public.seo_translatable_fields
ADD COLUMN field_type TEXT NOT NULL DEFAULT 'text'
CHECK (field_type IN ('title', 'description', 'excerpt', 'meta_title', 'meta_description', 'bio', 'body', 'tag', 'slug', 'text'));

-- Add a comment for clarity
COMMENT ON COLUMN public.seo_translatable_fields.field_type IS 'Field type for AI context: title (≤60), meta_title (≤60), meta_description (≤160), excerpt (≤200), description (≤500), bio (≤300), body (unlimited), tag (≤30), slug (≤80), text (default)';
