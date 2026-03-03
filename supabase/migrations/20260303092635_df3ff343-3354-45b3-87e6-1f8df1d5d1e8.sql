
-- Add data source and display style columns to homepage_sections
ALTER TABLE public.homepage_sections
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS source_table text DEFAULT '',
  ADD COLUMN IF NOT EXISTS source_filters jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS source_sort_by text DEFAULT 'created_at',
  ADD COLUMN IF NOT EXISTS source_sort_dir text DEFAULT 'desc',
  ADD COLUMN IF NOT EXISTS display_style text NOT NULL DEFAULT 'grid',
  ADD COLUMN IF NOT EXISTS card_template text NOT NULL DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS show_title boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_subtitle boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_description boolean NOT NULL DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN public.homepage_sections.source_type IS 'auto, manual, or query';
COMMENT ON COLUMN public.homepage_sections.source_table IS 'DB table to pull data from';
COMMENT ON COLUMN public.homepage_sections.source_filters IS 'JSON filters for data query';
COMMENT ON COLUMN public.homepage_sections.source_sort_by IS 'Column to sort source data by';
COMMENT ON COLUMN public.homepage_sections.source_sort_dir IS 'asc or desc';
COMMENT ON COLUMN public.homepage_sections.display_style IS 'grid, carousel, list, masonry, featured';
COMMENT ON COLUMN public.homepage_sections.card_template IS 'default, minimal, overlay, horizontal, stats';
