
CREATE OR REPLACE FUNCTION public.get_company_contacts_safe(p_company_id uuid)
RETURNS TABLE(
  id uuid, company_id uuid, user_id uuid, email text,
  name text, name_ar text, role text, 
  phone text, mobile text, department text,
  title text, title_ar text, is_primary boolean,
  invitation_status text,
  created_at timestamptz, updated_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, company_id, user_id, email, name, name_ar, role,
         phone, mobile, department, title, title_ar, is_primary,
         invitation_status, created_at, updated_at
  FROM company_contacts
  WHERE company_id = p_company_id
  AND company_id IN (SELECT cc.company_id FROM company_contacts cc WHERE cc.user_id = auth.uid());
$$;
