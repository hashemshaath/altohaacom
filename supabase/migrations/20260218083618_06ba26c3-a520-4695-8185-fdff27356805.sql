
-- Evaluation Templates: reusable criteria sets by domain/type
CREATE TABLE public.evaluation_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID NOT NULL REFERENCES public.evaluation_domains(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  template_type TEXT NOT NULL DEFAULT 'general', -- general, competition, chefs_table, etc.
  product_category TEXT, -- for chefs_table domain filtering
  criteria_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb, -- saved criteria with categories
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.evaluation_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage evaluation templates"
  ON public.evaluation_templates FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE POLICY "Anyone can view active templates"
  ON public.evaluation_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Evaluation Invitations: invite chefs to evaluate products
CREATE TABLE public.evaluation_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID, -- links to chefs_table_sessions or competition
  domain_slug TEXT NOT NULL DEFAULT 'chefs_table',
  chef_id UUID NOT NULL REFERENCES auth.users(id),
  invited_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, declined, expired
  product_name TEXT,
  product_name_ar TEXT,
  product_description TEXT,
  product_description_ar TEXT,
  product_images TEXT[] DEFAULT '{}',
  evaluation_date TIMESTAMPTZ,
  evaluation_location TEXT,
  evaluation_location_ar TEXT,
  expected_duration_minutes INT DEFAULT 60,
  offered_amount DECIMAL(10,2),
  currency TEXT DEFAULT 'SAR',
  response_deadline TIMESTAMPTZ,
  decline_reason TEXT,
  notes TEXT,
  notes_ar TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.evaluation_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invitations"
  ON public.evaluation_invitations FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE POLICY "Chefs can view their own invitations"
  ON public.evaluation_invitations FOR SELECT
  TO authenticated
  USING (chef_id = auth.uid());

CREATE POLICY "Chefs can update their own invitations"
  ON public.evaluation_invitations FOR UPDATE
  TO authenticated
  USING (chef_id = auth.uid())
  WITH CHECK (chef_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_evaluation_templates_updated_at
  BEFORE UPDATE ON public.evaluation_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_evaluation_invitations_updated_at
  BEFORE UPDATE ON public.evaluation_invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
