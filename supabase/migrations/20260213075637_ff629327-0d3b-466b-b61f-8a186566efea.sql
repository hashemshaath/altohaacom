
-- ======================================================
-- EXPAND REQUIREMENT SYSTEM: Order Management Center
-- ======================================================

-- 1. Expand requirement_items (master catalog) with specifications, tags, brand
ALTER TABLE public.requirement_items 
  ADD COLUMN IF NOT EXISTS specifications jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS brand text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS brand_ar text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS supplier_notes text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS supplier_notes_ar text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS size text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS size_ar text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS material text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS material_ar text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS alternatives text[] DEFAULT '{}';

-- 2. Expand requirement_list_items with delivery tracking and deadlines
ALTER TABLE public.requirement_list_items
  ADD COLUMN IF NOT EXISTS deadline timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS delivered_by uuid DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS alternative_item_id uuid REFERENCES public.requirement_items(id) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS alternative_notes text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS alternative_notes_ar text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS checked boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS checked_by uuid DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS checked_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS assigned_to uuid DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS category text DEFAULT NULL;

-- 3. Create item suggestions table for chefs/participants
CREATE TABLE IF NOT EXISTS public.requirement_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  list_id uuid REFERENCES public.requirement_lists(id) ON DELETE SET NULL,
  suggested_by uuid NOT NULL,
  item_name text NOT NULL,
  item_name_ar text,
  category text NOT NULL DEFAULT 'other',
  subcategory text,
  quantity integer DEFAULT 1,
  unit text DEFAULT 'piece',
  description text,
  description_ar text,
  image_url text,
  estimated_cost numeric,
  currency text DEFAULT 'USD',
  priority text DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected, added
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.requirement_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS: Authenticated users can suggest items
CREATE POLICY "Authenticated users can suggest items"
  ON public.requirement_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = suggested_by);

-- RLS: Users can view their own suggestions + admins/organizers can view all
CREATE POLICY "Users can view suggestions"
  ON public.requirement_suggestions FOR SELECT
  TO authenticated
  USING (
    auth.uid() = suggested_by
    OR public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.competition_roles
      WHERE competition_id = requirement_suggestions.competition_id
        AND user_id = auth.uid()
        AND role IN ('organizer', 'coordinator', 'head_judge')
        AND status = 'active'
    )
  );

-- RLS: Admins/organizers can update suggestions
CREATE POLICY "Admins can update suggestions"
  ON public.requirement_suggestions FOR UPDATE
  TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.competition_roles
      WHERE competition_id = requirement_suggestions.competition_id
        AND user_id = auth.uid()
        AND role IN ('organizer', 'coordinator')
        AND status = 'active'
    )
  );

-- RLS: Users can delete their own pending suggestions
CREATE POLICY "Users can delete own pending suggestions"
  ON public.requirement_suggestions FOR DELETE
  TO authenticated
  USING (auth.uid() = suggested_by AND status = 'pending');

-- 4. Create delivery checklist tracking table  
CREATE TABLE IF NOT EXISTS public.requirement_delivery_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_item_id uuid NOT NULL REFERENCES public.requirement_list_items(id) ON DELETE CASCADE,
  action text NOT NULL, -- 'delivered', 'checked', 'returned', 'substituted'
  action_by uuid NOT NULL,
  notes text,
  notes_ar text,
  quantity_delivered integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.requirement_delivery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view delivery logs"
  ON public.requirement_delivery_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can add delivery logs"
  ON public.requirement_delivery_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = action_by);

-- Add updated_at trigger for suggestions
CREATE TRIGGER update_requirement_suggestions_updated_at
  BEFORE UPDATE ON public.requirement_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
