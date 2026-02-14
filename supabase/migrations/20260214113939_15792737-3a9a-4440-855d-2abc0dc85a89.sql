-- Allow company contacts to insert branches for their own company
CREATE POLICY "Company contacts can insert branches"
ON public.company_branches
FOR INSERT
TO authenticated
WITH CHECK (company_id IN (
  SELECT company_id FROM public.company_contacts WHERE user_id = auth.uid()
));

-- Allow company contacts to update branches for their own company
CREATE POLICY "Company contacts can update branches"
ON public.company_branches
FOR UPDATE
TO authenticated
USING (company_id IN (
  SELECT company_id FROM public.company_contacts WHERE user_id = auth.uid()
));

-- Allow company contacts to delete branches for their own company
CREATE POLICY "Company contacts can delete branches"
ON public.company_branches
FOR DELETE
TO authenticated
USING (company_id IN (
  SELECT company_id FROM public.company_contacts WHERE user_id = auth.uid()
));