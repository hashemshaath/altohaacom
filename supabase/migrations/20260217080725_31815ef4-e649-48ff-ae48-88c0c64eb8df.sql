
-- Post edit history table
CREATE TABLE public.post_edits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  previous_content TEXT NOT NULL,
  edited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  edited_by UUID NOT NULL
);

ALTER TABLE public.post_edits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view post edits" ON public.post_edits FOR SELECT USING (true);
CREATE POLICY "Authors can insert edits" ON public.post_edits FOR INSERT WITH CHECK (auth.uid() = edited_by);

-- Add edited_at column to posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- Index for fast lookup
CREATE INDEX idx_post_edits_post_id ON public.post_edits(post_id);
