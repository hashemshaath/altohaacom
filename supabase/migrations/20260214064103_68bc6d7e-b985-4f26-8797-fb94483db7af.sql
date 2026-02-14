
-- Fix notify_new_follower trigger to use correct column names
CREATE OR REPLACE FUNCTION public.notify_new_follower()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_follower_name TEXT;
BEGIN
  SELECT COALESCE(full_name, username, 'Someone') INTO v_follower_name
  FROM profiles WHERE user_id = NEW.follower_id;

  INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
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
$function$;

-- Fix notify_follow_request trigger to use correct column names
CREATE OR REPLACE FUNCTION public.notify_follow_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_name TEXT;
BEGIN
  SELECT COALESCE(full_name, username, 'Someone') INTO v_name
  FROM profiles WHERE user_id = NEW.requester_id;

  INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
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
$function$;
