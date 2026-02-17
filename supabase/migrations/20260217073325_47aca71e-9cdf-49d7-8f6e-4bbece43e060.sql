
-- Change default moderation_status from 'approved' to 'pending' for pre-publication review
ALTER TABLE public.posts ALTER COLUMN moderation_status SET DEFAULT 'pending';

-- Create content moderation log for AI screening results
CREATE TABLE IF NOT EXISTS public.content_moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL DEFAULT 'post', -- post, comment, story
  entity_id UUID NOT NULL,
  user_id UUID,
  content_text TEXT,
  image_urls TEXT[],
  ai_decision TEXT NOT NULL DEFAULT 'pending', -- approved, rejected, flagged
  ai_confidence NUMERIC,
  ai_categories TEXT[], -- e.g. political, indecent, off_topic, profanity, defamatory
  ai_explanation TEXT,
  ai_explanation_ar TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  final_decision TEXT, -- admin override: approved, rejected
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.content_moderation_log ENABLE ROW LEVEL SECURITY;

-- Admins can see all moderation logs
CREATE POLICY "Admins can manage moderation logs"
ON public.content_moderation_log FOR ALL
USING (public.is_admin_user());

-- Users can see their own moderation results
CREATE POLICY "Users can view own moderation logs"
ON public.content_moderation_log FOR SELECT
USING (auth.uid() = user_id);

-- Allow inserts from edge functions (service role) and authenticated users
CREATE POLICY "Authenticated users can insert moderation logs"
ON public.content_moderation_log FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_content_moderation_entity ON public.content_moderation_log(entity_type, entity_id);
CREATE INDEX idx_content_moderation_decision ON public.content_moderation_log(ai_decision);
CREATE INDEX idx_content_moderation_user ON public.content_moderation_log(user_id);
