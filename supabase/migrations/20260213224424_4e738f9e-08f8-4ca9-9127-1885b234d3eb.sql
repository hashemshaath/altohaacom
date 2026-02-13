
-- Add follow privacy setting to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS follow_privacy text NOT NULL DEFAULT 'public';
-- 'public' = anyone can follow, 'approval' = follow requests need approval, 'private' = nobody can follow

-- Create follow requests table for approval-based follows
CREATE TABLE IF NOT EXISTS public.follow_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  target_id UUID NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  UNIQUE(requester_id, target_id)
);

ALTER TABLE public.follow_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own follow requests"
  ON public.follow_requests FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = target_id);

CREATE POLICY "Users can create follow requests"
  ON public.follow_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Target can update follow requests"
  ON public.follow_requests FOR UPDATE
  USING (auth.uid() = target_id);

CREATE POLICY "Users can delete own follow requests"
  ON public.follow_requests FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = target_id);

-- Create a function to notify on new follow
CREATE OR REPLACE FUNCTION public.notify_new_follower()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_follower_name TEXT;
BEGIN
  SELECT COALESCE(full_name, username, 'Someone') INTO v_follower_name
  FROM profiles WHERE user_id = NEW.follower_id;

  INSERT INTO notifications (user_id, title, title_ar, message, message_ar, type, action_url, metadata)
  VALUES (
    NEW.following_id,
    v_follower_name || ' started following you',
    v_follower_name || ' بدأ بمتابعتك',
    'You have a new follower',
    'لديك متابع جديد',
    'follow',
    '/community',
    jsonb_build_object('follower_id', NEW.follower_id, 'follower_name', v_follower_name)
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_new_follower
  AFTER INSERT ON public.user_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_follower();

-- Notify on follow request
CREATE OR REPLACE FUNCTION public.notify_follow_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_name TEXT;
BEGIN
  SELECT COALESCE(full_name, username, 'Someone') INTO v_name
  FROM profiles WHERE user_id = NEW.requester_id;

  INSERT INTO notifications (user_id, title, title_ar, message, message_ar, type, action_url, metadata)
  VALUES (
    NEW.target_id,
    v_name || ' wants to follow you',
    v_name || ' يريد متابعتك',
    'You have a new follow request',
    'لديك طلب متابعة جديد',
    'follow_request',
    '/community',
    jsonb_build_object('requester_id', NEW.requester_id, 'request_id', NEW.id)
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_follow_request
  AFTER INSERT ON public.follow_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_follow_request();
