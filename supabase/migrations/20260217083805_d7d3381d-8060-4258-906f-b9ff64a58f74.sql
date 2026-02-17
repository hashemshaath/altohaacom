
-- Create a content_audit_log table for tracking post deletions, cancellations, and moderation actions
CREATE TABLE public.content_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_type TEXT NOT NULL, -- 'post_deleted', 'post_rejected', 'post_cancelled', 'comment_deleted'
  entity_type TEXT NOT NULL DEFAULT 'post',
  entity_id UUID,
  user_id UUID, -- who performed the action
  author_id UUID, -- original content author
  content_snapshot TEXT, -- snapshot of deleted content
  image_urls TEXT[] DEFAULT '{}',
  reason TEXT,
  reason_ar TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can read content audit logs"
  ON public.content_audit_log FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Allow authenticated users to insert (for logging their own deletions)
CREATE POLICY "Authenticated users can insert audit logs"
  ON public.content_audit_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Index for efficient querying
CREATE INDEX idx_content_audit_log_action ON public.content_audit_log(action_type);
CREATE INDEX idx_content_audit_log_created ON public.content_audit_log(created_at DESC);
