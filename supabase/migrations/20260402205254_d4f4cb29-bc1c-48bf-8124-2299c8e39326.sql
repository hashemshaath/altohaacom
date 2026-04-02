CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_username TEXT;
  v_base TEXT;
  v_suffix INTEGER;
  v_account_type account_type;
BEGIN
  v_username := LOWER(NEW.raw_user_meta_data->>'username');
  
  IF v_username IS NULL OR v_username = '' THEN
    v_base := LOWER(REGEXP_REPLACE(
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        SPLIT_PART(NEW.email, '@', 1)
      ),
      '[^a-z0-9]', '', 'g'
    ));
    
    IF v_base = '' OR v_base !~ '^[a-z]' THEN
      v_base := 'user' || v_base;
    END IF;
    IF LENGTH(v_base) < 3 THEN
      v_base := v_base || 'user';
    END IF;
    v_base := LEFT(v_base, 24);
    
    v_username := v_base;
    v_suffix := 0;
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) LOOP
      v_suffix := v_suffix + 1;
      v_username := v_base || v_suffix::TEXT;
    END LOOP;
  END IF;

  -- Safely cast account_type with fallback
  BEGIN
    v_account_type := COALESCE(NEW.raw_user_meta_data->>'account_type', 'fan')::account_type;
  EXCEPTION WHEN OTHERS THEN
    v_account_type := 'fan'::account_type;
  END;

  INSERT INTO public.profiles (
    user_id, full_name, username, email,
    phone, country_code, account_type, preferred_language
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    v_username,
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'country_code',
    v_account_type,
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en')
  );
  RETURN NEW;
END;
$function$;