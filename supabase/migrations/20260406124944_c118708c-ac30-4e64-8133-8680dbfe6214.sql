
CREATE OR REPLACE FUNCTION public.audit_sensitive_access()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  record_identifier text;
BEGIN
  -- Try to get a record identifier, handling tables without an 'id' column
  BEGIN
    IF TG_OP = 'DELETE' THEN
      record_identifier := to_jsonb(OLD) ->> 'id';
      IF record_identifier IS NULL THEN
        record_identifier := to_jsonb(OLD) ->> 'key';
      END IF;
    ELSE
      record_identifier := to_jsonb(NEW) ->> 'id';
      IF record_identifier IS NULL THEN
        record_identifier := to_jsonb(NEW) ->> 'key';
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    record_identifier := 'unknown';
  END;

  INSERT INTO public.admin_actions (admin_id, action_type, details)
  VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    TG_ARGV[0],
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'record_id', record_identifier
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$function$;
