
-- Add scheduled_at column to posts for post scheduling
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT false;

-- Index for finding scheduled posts that need publishing
CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON public.posts (scheduled_at) WHERE is_scheduled = true;
