
-- Add reply threading, visibility, and moderation to posts
ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS reply_to_post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS moderation_reason text,
  ADD COLUMN IF NOT EXISTS moderated_at timestamptz,
  ADD COLUMN IF NOT EXISTS moderated_by uuid,
  ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS link_url text,
  ADD COLUMN IF NOT EXISTS link_preview jsonb,
  ADD COLUMN IF NOT EXISTS replies_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reposts_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;

-- Create index for reply threads
CREATE INDEX IF NOT EXISTS idx_posts_reply_to ON public.posts(reply_to_post_id);
CREATE INDEX IF NOT EXISTS idx_posts_moderation ON public.posts(moderation_status);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON public.posts(visibility);

-- Post reports table for moderation
CREATE TABLE IF NOT EXISTS public.post_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  reason text NOT NULL,
  reason_detail text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "Users can report posts" ON public.post_reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view own reports" ON public.post_reports
  FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id OR public.is_admin_user());

-- Admins can manage reports
CREATE POLICY "Admins can manage reports" ON public.post_reports
  FOR ALL TO authenticated
  USING (public.is_admin_user());

-- Post bookmarks
CREATE TABLE IF NOT EXISTS public.post_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own bookmarks" ON public.post_bookmarks
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Post reposts
CREATE TABLE IF NOT EXISTS public.post_reposts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_reposts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reposts" ON public.post_reposts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Anyone can read public reposts
CREATE POLICY "Anyone can read reposts" ON public.post_reposts
  FOR SELECT USING (true);

-- Moderation queue view for admins
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL DEFAULT 'post',
  entity_id uuid NOT NULL,
  action text NOT NULL,
  reason text,
  performed_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage moderation actions" ON public.moderation_actions
  FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());
