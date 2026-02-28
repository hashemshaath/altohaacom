-- Add is_pinned column to messages for pinned messages feature
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false;

-- Add index for pinned messages lookup
CREATE INDEX IF NOT EXISTS idx_messages_pinned ON public.messages (sender_id, receiver_id) WHERE is_pinned = true;
