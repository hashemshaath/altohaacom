
-- 1) companies: hide financial fields from anon
REVOKE SELECT (credit_limit, payment_terms, supplier_score) ON public.companies FROM anon;

-- 2) tasting_scores: require authentication for completed session scores
DROP POLICY IF EXISTS "Judges and organizers can view scores" ON public.tasting_scores;
CREATE POLICY "Judges and organizers can view scores"
ON public.tasting_scores FOR SELECT TO authenticated
USING (
  auth.uid() = judge_id
  OR EXISTS (
    SELECT 1 FROM tasting_sessions ts
    WHERE ts.id = tasting_scores.session_id AND ts.organizer_id = auth.uid()
  )
  OR (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM tasting_sessions ts
      WHERE ts.id = tasting_scores.session_id AND ts.status = 'completed'
    )
  )
  OR is_admin(auth.uid())
);

-- 3) competition_scores: enforce blind judging
DROP POLICY IF EXISTS "Participants can view their scores" ON public.competition_scores;
CREATE POLICY "Participants can view their scores"
ON public.competition_scores FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM competition_registrations cr
    WHERE cr.id = competition_scores.registration_id
    AND cr.participant_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM competitions c
      WHERE c.id = cr.competition_id AND c.blind_judging_enabled = true
    )
  )
);

-- 4) wallet_transactions PBAC: restrict to admin
DROP POLICY IF EXISTS "PBAC: finance manage wallet txns" ON public.wallet_transactions;
CREATE POLICY "PBAC: finance manage wallet txns"
ON public.wallet_transactions FOR ALL TO authenticated
USING (is_admin(auth.uid()) AND has_permission('finance.manage'))
WITH CHECK (is_admin(auth.uid()) AND has_permission('finance.manage'));

DROP POLICY IF EXISTS "PBAC: finance view wallet txns" ON public.wallet_transactions;
CREATE POLICY "PBAC: finance view wallet txns"
ON public.wallet_transactions FOR SELECT TO authenticated
USING (
  (wallet_id IN (SELECT id FROM user_wallets WHERE user_id = auth.uid()))
  OR (is_admin(auth.uid()) AND has_permission('finance.view'))
);

-- 5) invoices PBAC: restrict to admin
DROP POLICY IF EXISTS "PBAC: admin invoice access" ON public.invoices;
CREATE POLICY "PBAC: admin invoice access"
ON public.invoices FOR SELECT TO authenticated
USING (is_admin(auth.uid()) AND has_permission('invoice.read'));

-- company_transactions PBAC: restrict to admin
DROP POLICY IF EXISTS "PBAC: finance manage company txns" ON public.company_transactions;
CREATE POLICY "PBAC: finance manage company txns"
ON public.company_transactions FOR ALL TO authenticated
USING (is_admin(auth.uid()) AND has_permission('finance.manage'))
WITH CHECK (is_admin(auth.uid()) AND has_permission('finance.manage'));
