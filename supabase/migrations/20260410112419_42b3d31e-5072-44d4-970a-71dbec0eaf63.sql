
-- FIX 1: exhibition_tickets
DROP POLICY IF EXISTS "Users can create their own tickets" ON public.exhibition_tickets;
CREATE POLICY "Users can create their own tickets"
ON public.exhibition_tickets FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (status IS NULL OR status = 'pending')
  AND (price_paid IS NULL OR price_paid = 0)
  AND discount_amount IS NULL
);

-- FIX 2: competition_registrations
DROP POLICY IF EXISTS "Users can register for competitions" ON public.competition_registrations;
CREATE POLICY "Users can register for competitions"
ON public.competition_registrations FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = participant_id
  AND (payment_status IS NULL OR payment_status = 'pending')
);

-- FIX 3: shop_orders
DROP POLICY IF EXISTS "Buyers can create orders" ON public.shop_orders;
CREATE POLICY "Buyers can create orders"
ON public.shop_orders FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = buyer_id
  AND (payment_status IS NULL OR payment_status = 'pending')
);

-- FIX 4: password_recovery_tokens
DROP POLICY IF EXISTS "Users can create recovery tokens" ON public.password_recovery_tokens;

-- FIX 5: Restrict SELECT policies to authenticated
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT TO authenticated
USING ((auth.uid() = participant_1) OR (auth.uid() = participant_2));

DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
CREATE POLICY "Users can view own sessions"
ON public.user_sessions FOR SELECT TO authenticated
USING ((auth.uid() = user_id) OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Judges can view own conversations" ON public.judge_ai_conversations;
CREATE POLICY "Judges can view own conversations"
ON public.judge_ai_conversations FOR SELECT TO authenticated
USING (auth.uid() = judge_id);

DROP POLICY IF EXISTS "Admins can view all conversations" ON public.judge_ai_conversations;
CREATE POLICY "Admins can view all conversations"
ON public.judge_ai_conversations FOR SELECT TO authenticated
USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view own matches" ON public.mentorship_matches;
CREATE POLICY "Users can view own matches"
ON public.mentorship_matches FOR SELECT TO authenticated
USING ((mentor_id = auth.uid()) OR (mentee_id = auth.uid()));

DROP POLICY IF EXISTS "Users can view own enrollments" ON public.mentee_enrollments;
CREATE POLICY "Users can view own enrollments"
ON public.mentee_enrollments FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.mentee_enrollments;
CREATE POLICY "Admins can view all enrollments"
ON public.mentee_enrollments FOR SELECT TO authenticated
USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Evaluators can read own scores" ON public.evaluation_scores;
CREATE POLICY "Evaluators can read own scores"
ON public.evaluation_scores FOR SELECT TO authenticated
USING (evaluator_id = auth.uid());

DROP POLICY IF EXISTS "Users view own challenges" ON public.user_challenges;
CREATE POLICY "Users view own challenges"
ON public.user_challenges FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own streaks" ON public.user_streaks;
CREATE POLICY "Users view own streaks"
ON public.user_streaks FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own streaks" ON public.fan_streaks;
CREATE POLICY "Users can view own streaks"
ON public.fan_streaks FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_milestone_achievements;
CREATE POLICY "Users can view own achievements"
ON public.user_milestone_achievements FOR SELECT TO authenticated
USING (auth.uid() = user_id);
