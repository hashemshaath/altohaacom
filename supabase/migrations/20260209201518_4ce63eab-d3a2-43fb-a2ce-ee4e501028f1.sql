
-- Fix: Replace ALL policy with specific operation policies for competition_series
DROP POLICY IF EXISTS "Admins can manage series" ON public.competition_series;

CREATE POLICY "Admins can insert series" ON public.competition_series
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update series" ON public.competition_series
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete series" ON public.competition_series
  FOR DELETE USING (public.is_admin(auth.uid()));
