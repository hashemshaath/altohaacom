
-- Fix 1: ad_user_behaviors - remove broad INSERT policy
DROP POLICY IF EXISTS "Authenticated or session behavior tracking" ON public.ad_user_behaviors;

-- Fix 2: conversion_events - remove broad INSERT policy
DROP POLICY IF EXISTS "Authenticated can insert conversions" ON public.conversion_events;

-- Fix 3: exhibition_sponsor_applications - remove broad INSERT policy
DROP POLICY IF EXISTS "Authenticated users can apply" ON public.exhibition_sponsor_applications;

-- Fix 4: competition_sponsors - restrict public SELECT to hide amount_paid
DROP POLICY IF EXISTS "Anyone can view active sponsors" ON public.competition_sponsors;
CREATE POLICY "Authenticated can view active sponsors"
  ON public.competition_sponsors
  FOR SELECT
  TO authenticated
  USING (status = 'active');
