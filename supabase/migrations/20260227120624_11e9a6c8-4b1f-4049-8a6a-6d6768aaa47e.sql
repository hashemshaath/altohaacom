
-- Recipe saves (bookmarks) for quick access
CREATE TABLE IF NOT EXISTS public.recipe_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

ALTER TABLE public.recipe_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saves" ON public.recipe_saves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save recipes" ON public.recipe_saves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave recipes" ON public.recipe_saves FOR DELETE USING (auth.uid() = user_id);

-- Recipe shares tracking
CREATE TABLE IF NOT EXISTS public.recipe_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  share_method TEXT NOT NULL DEFAULT 'link',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recipe_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a share" ON public.recipe_shares FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own shares" ON public.recipe_shares FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Add save_count and share_count to recipes for denormalized access
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS save_count INTEGER DEFAULT 0;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;

-- Trigger to update save_count
CREATE OR REPLACE FUNCTION public.update_recipe_save_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE recipes SET save_count = save_count + 1 WHERE id = NEW.recipe_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE recipes SET save_count = GREATEST(save_count - 1, 0) WHERE id = OLD.recipe_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_recipe_save_count
AFTER INSERT OR DELETE ON public.recipe_saves
FOR EACH ROW EXECUTE FUNCTION public.update_recipe_save_count();

-- Trigger to update share_count
CREATE OR REPLACE FUNCTION public.update_recipe_share_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE recipes SET share_count = share_count + 1 WHERE id = NEW.recipe_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_recipe_share_count
AFTER INSERT ON public.recipe_shares
FOR EACH ROW EXECUTE FUNCTION public.update_recipe_share_count();

-- Enable realtime for recipe_saves
ALTER PUBLICATION supabase_realtime ADD TABLE public.recipe_saves;
