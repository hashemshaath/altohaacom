-- Create fan favorites table for saving chefs and recipes
CREATE TABLE public.fan_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('chef', 'recipe')),
  entity_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, entity_type, entity_id)
);

ALTER TABLE public.fan_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
ON public.fan_favorites FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
ON public.fan_favorites FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
ON public.fan_favorites FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_fan_favorites_user ON public.fan_favorites(user_id);
CREATE INDEX idx_fan_favorites_entity ON public.fan_favorites(entity_type, entity_id);