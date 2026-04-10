DROP POLICY IF EXISTS "Chefs can delete own pending registrations" ON public.chef_evaluation_registrations;

CREATE POLICY "Chefs can delete own pending registrations"
  ON public.chef_evaluation_registrations FOR DELETE
  TO authenticated
  USING (chef_id = auth.uid() AND status = 'pending');
