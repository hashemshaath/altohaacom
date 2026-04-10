
-- 1) auth_audit_log: drop the permissive INSERT, keep only the user_id = auth.uid() one
DROP POLICY IF EXISTS "Authenticated can insert auth audit" ON public.auth_audit_log;
-- The "Authenticated can insert own audit" already has user_id = auth.uid(), keep it

-- 2) content_audit_log: fix INSERT to require user_id = auth.uid()
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.content_audit_log;

CREATE POLICY "Users can insert own content audit logs"
ON public.content_audit_log FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- 3) verification_audit_log: drop the permissive INSERT, keep the action_by one
DROP POLICY IF EXISTS "Authenticated users can insert audit" ON public.verification_audit_log;
-- "Users can insert own verification audit" already has action_by = auth.uid()

-- 4) post_poll_votes: restrict SELECT to authenticated only, remove public
DROP POLICY IF EXISTS "Anyone can view poll votes" ON public.post_poll_votes;
DROP POLICY IF EXISTS "Authenticated users can view votes" ON public.post_poll_votes;

CREATE POLICY "Authenticated users can view votes"
ON public.post_poll_votes FOR SELECT TO authenticated
USING (true);

-- 5) exhibition_auction_bids: restrict to bidder or admin
DROP POLICY IF EXISTS "Anyone can view bids" ON public.exhibition_auction_bids;

CREATE POLICY "Bidders and admins can view bids"
ON public.exhibition_auction_bids FOR SELECT TO authenticated
USING (auth.uid() = user_id OR is_admin(auth.uid()));
