-- Allow authenticated users to insert invoices for themselves (membership checkout)
CREATE POLICY "Users can create own invoices"
ON public.invoices
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());