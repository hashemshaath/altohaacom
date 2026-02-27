
-- Fan recipe collections table
CREATE TABLE public.fan_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  emoji TEXT DEFAULT '📖',
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.fan_collection_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.fan_collections(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('recipe', 'chef', 'post')),
  item_id UUID NOT NULL,
  note TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (collection_id, item_type, item_id)
);

-- Fan streaks table
CREATE TABLE public.fan_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  total_active_days INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fan_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_streaks ENABLE ROW LEVEL SECURITY;

-- fan_collections policies
CREATE POLICY "Users can view own collections" ON public.fan_collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view public collections" ON public.fan_collections FOR SELECT USING (is_public = true);
CREATE POLICY "Users can create own collections" ON public.fan_collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own collections" ON public.fan_collections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own collections" ON public.fan_collections FOR DELETE USING (auth.uid() = user_id);

-- fan_collection_items policies
CREATE POLICY "Users can view items in own collections" ON public.fan_collection_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.fan_collections WHERE id = collection_id AND (user_id = auth.uid() OR is_public = true)));
CREATE POLICY "Users can add items to own collections" ON public.fan_collection_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.fan_collections WHERE id = collection_id AND user_id = auth.uid()));
CREATE POLICY "Users can remove items from own collections" ON public.fan_collection_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.fan_collections WHERE id = collection_id AND user_id = auth.uid()));

-- fan_streaks policies
CREATE POLICY "Users can view own streaks" ON public.fan_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own streaks" ON public.fan_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streaks" ON public.fan_streaks FOR UPDATE USING (auth.uid() = user_id);
