
DROP VIEW IF EXISTS public.profile_views_safe;
CREATE VIEW public.profile_views_safe
WITH (security_invoker = on) AS
SELECT id, profile_user_id, viewer_user_id,
  country, device_type, browser, viewer_type, company_id, created_at
FROM public.profile_views;

DROP VIEW IF EXISTS public.job_postings_public;
CREATE VIEW public.job_postings_public
WITH (security_invoker = on) AS
SELECT id, company_id, posted_by, title, title_ar, description, description_ar,
  job_type, experience_level, specialization, specialization_ar,
  location, location_ar, country_code, city,
  CASE WHEN is_salary_visible = true THEN salary_min ELSE NULL END AS salary_min,
  CASE WHEN is_salary_visible = true THEN salary_max ELSE NULL END AS salary_max,
  CASE WHEN is_salary_visible = true THEN salary_currency ELSE NULL END AS salary_currency,
  is_salary_visible, requirements, requirements_ar, benefits, benefits_ar,
  status, is_featured, application_deadline, views_count, applications_count,
  created_at, updated_at
FROM public.job_postings
WHERE status = 'active';
