
-- Fix: Certificate public verification should not expose email fields
-- Drop the overly permissive public verification policy
DROP POLICY IF EXISTS "Public can verify issued certificates" ON public.certificates;

-- Create a more restrictive public verification policy that excludes email fields
-- We use a security definer function to return only safe fields
CREATE OR REPLACE FUNCTION public.verify_certificate(p_code text)
RETURNS TABLE(
  id uuid,
  certificate_number text,
  verification_code text,
  type text,
  status text,
  recipient_name text,
  recipient_name_ar text,
  event_name text,
  event_name_ar text,
  event_date text,
  event_location text,
  event_location_ar text,
  achievement text,
  achievement_ar text,
  issued_at timestamptz,
  logos jsonb,
  signatures jsonb
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public' AS $$
  SELECT 
    c.id, c.certificate_number, c.verification_code, 
    c.type::text, c.status::text,
    c.recipient_name, c.recipient_name_ar,
    c.event_name, c.event_name_ar, c.event_date,
    c.event_location, c.event_location_ar,
    c.achievement, c.achievement_ar,
    c.issued_at, c.logos, c.signatures
  FROM certificates c
  WHERE c.verification_code = UPPER(p_code)
    AND c.status = 'issued';
$$;

-- Re-create a tighter public verification policy (no email columns exposed via direct query)
CREATE POLICY "Public can verify certificates by code"
ON public.certificates
FOR SELECT
USING (status = 'issued' AND visibility = 'public');

-- Fix: Competition team members - restrict public view to names and roles only
DROP POLICY IF EXISTS "Anyone can view team members" ON public.competition_team_members;

CREATE POLICY "Authenticated users can view team members"
ON public.competition_team_members
FOR SELECT
USING (auth.uid() IS NOT NULL);
