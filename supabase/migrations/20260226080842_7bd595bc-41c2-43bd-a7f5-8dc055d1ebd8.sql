
-- Bookmark collections table
CREATE TABLE public.bookmark_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT,
  emoji TEXT DEFAULT '📌',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Link bookmarks to collections
CREATE TABLE public.bookmark_collection_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.bookmark_collections(id) ON DELETE CASCADE,
  post_id UUID NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(collection_id, post_id)
);

-- Enable RLS
ALTER TABLE public.bookmark_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmark_collection_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for bookmark_collections
CREATE POLICY "Users can view own collections" ON public.bookmark_collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own collections" ON public.bookmark_collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own collections" ON public.bookmark_collections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own collections" ON public.bookmark_collections FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for bookmark_collection_items
CREATE POLICY "Users can view own collection items" ON public.bookmark_collection_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.bookmark_collections bc WHERE bc.id = collection_id AND bc.user_id = auth.uid()));
CREATE POLICY "Users can add to own collections" ON public.bookmark_collection_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.bookmark_collections bc WHERE bc.id = collection_id AND bc.user_id = auth.uid()));
CREATE POLICY "Users can remove from own collections" ON public.bookmark_collection_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.bookmark_collections bc WHERE bc.id = collection_id AND bc.user_id = auth.uid()));
