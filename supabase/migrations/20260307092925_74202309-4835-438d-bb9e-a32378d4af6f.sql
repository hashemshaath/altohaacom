
-- Add priority column to notifications
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal';

-- Add comment
COMMENT ON COLUMN public.notifications.priority IS 'Notification priority: urgent, high, normal, low';
