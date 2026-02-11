-- Update handle_new_user to also save email
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, username, email)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name',
    LOWER(NEW.raw_user_meta_data->>'username'),
    NEW.email
  );
  RETURN NEW;
END;
$function$;