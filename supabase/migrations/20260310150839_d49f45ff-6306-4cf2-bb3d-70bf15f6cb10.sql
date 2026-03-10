-- Remove redundant duplicate index (covered by unique constraint ad_user_interests_user_id_interest_category_key)
DROP INDEX IF EXISTS public.idx_ad_interests_user;

-- Add composite index on notifications for fast user-specific queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
ON public.notifications (user_id, created_at DESC);

-- Add index on ad_user_behaviors for time-range queries and future partitioning readiness
CREATE INDEX IF NOT EXISTS idx_ad_behaviors_created_at 
ON public.ad_user_behaviors (created_at DESC);

-- Add index on ad_user_behaviors for user-specific lookups
CREATE INDEX IF NOT EXISTS idx_ad_behaviors_user_event 
ON public.ad_user_behaviors (user_id, event_type, created_at DESC);