-- Fix 1: Remove broad profiles SELECT that exposes PII
DROP POLICY IF EXISTS "Authenticated can view non-private profiles" ON public.profiles;

-- Fix 2: Remove overly permissive career records SELECT
DROP POLICY IF EXISTS "Authenticated can view career records" ON public.user_career_records;