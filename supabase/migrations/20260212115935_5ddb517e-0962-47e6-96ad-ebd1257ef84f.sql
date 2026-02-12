
-- Create entity_positions table for leadership/board positions
CREATE TABLE public.entity_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.culinary_entities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  position_type TEXT NOT NULL DEFAULT 'member',
  position_title TEXT,
  position_title_ar TEXT,
  is_active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,
  sort_order INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entity_id, user_id, position_type)
);

-- Enable RLS
ALTER TABLE public.entity_positions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view entity positions"
ON public.entity_positions FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage entity positions"
ON public.entity_positions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update entity positions"
ON public.entity_positions FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete entity positions"
ON public.entity_positions FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Timestamp trigger
CREATE TRIGGER update_entity_positions_updated_at
BEFORE UPDATE ON public.entity_positions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.entity_positions;
