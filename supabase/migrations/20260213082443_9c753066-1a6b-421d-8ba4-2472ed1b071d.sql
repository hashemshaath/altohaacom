-- Requirement templates for reusing lists across competitions
CREATE TABLE public.requirement_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.requirement_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public templates"
  ON public.requirement_templates FOR SELECT
  USING (is_public = true OR auth.uid() = created_by);

CREATE POLICY "Users can create their own templates"
  ON public.requirement_templates FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates"
  ON public.requirement_templates FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own templates"
  ON public.requirement_templates FOR DELETE
  USING (auth.uid() = created_by);

CREATE INDEX idx_requirement_templates_creator ON public.requirement_templates(created_by);
CREATE INDEX idx_requirement_templates_public ON public.requirement_templates(is_public) WHERE is_public = true;