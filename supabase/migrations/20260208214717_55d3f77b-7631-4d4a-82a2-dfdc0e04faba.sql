-- Update handle_new_user function to also capture username from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, username)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name',
    LOWER(NEW.raw_user_meta_data->>'username')
  );
  RETURN NEW;
END;
$function$;