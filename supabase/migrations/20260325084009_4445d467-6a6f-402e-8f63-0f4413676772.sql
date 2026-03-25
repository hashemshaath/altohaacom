
-- Article reactions table for real mood reactions data
CREATE TABLE public.article_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT article_reactions_type_check CHECK (reaction_type IN ('fire', 'insightful', 'love', 'bravo', 'thinking', 'wow'))
);

-- Index for fast counts per article
CREATE INDEX idx_article_reactions_article ON public.article_reactions(article_id);
CREATE INDEX idx_article_reactions_user ON public.article_reactions(user_id) WHERE user_id IS NOT NULL;

-- Unique constraint: one reaction type per user/session per article
CREATE UNIQUE INDEX idx_article_reactions_unique_user ON public.article_reactions(article_id, user_id, reaction_type) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX idx_article_reactions_unique_session ON public.article_reactions(article_id, session_id, reaction_type) WHERE session_id IS NOT NULL AND user_id IS NULL;

-- Enable RLS
ALTER TABLE public.article_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone can read reaction counts
CREATE POLICY "Anyone can read article reactions"
  ON public.article_reactions FOR SELECT
  USING (true);

-- Authenticated users can insert their own reactions
CREATE POLICY "Users can insert own reactions"
  ON public.article_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can delete their own reactions
CREATE POLICY "Users can delete own reactions"
  ON public.article_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Anonymous users can insert with session_id
CREATE POLICY "Anon can insert with session"
  ON public.article_reactions FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL AND session_id IS NOT NULL);
