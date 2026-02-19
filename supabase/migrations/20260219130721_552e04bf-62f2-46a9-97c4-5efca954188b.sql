
-- Fix: Restrict social/follower table SELECT policies to authenticated users only
-- Currently these use USING (true) for public role, allowing anonymous access

-- 1. connections: Drop old public SELECT, add authenticated-only SELECT
DROP POLICY IF EXISTS "Anyone can view connections" ON public.connections;
CREATE POLICY "Authenticated users can view connections"
ON public.connections
FOR SELECT
TO authenticated
USING (true);

-- 2. user_follows: Drop old public SELECT, add authenticated-only SELECT  
DROP POLICY IF EXISTS "Anyone can view follows" ON public.user_follows;
CREATE POLICY "Authenticated users can view follows"
ON public.user_follows
FOR SELECT
TO authenticated
USING (true);

-- 3. entity_followers: Drop old public SELECT, add authenticated-only SELECT
DROP POLICY IF EXISTS "Anyone can view entity follower counts" ON public.entity_followers;
CREATE POLICY "Authenticated users can view entity followers"
ON public.entity_followers
FOR SELECT
TO authenticated
USING (true);

-- 4. exhibition_followers: Drop old public SELECT, add authenticated-only SELECT
DROP POLICY IF EXISTS "Anyone can view follower counts" ON public.exhibition_followers;
CREATE POLICY "Authenticated users can view exhibition followers"
ON public.exhibition_followers
FOR SELECT
TO authenticated
USING (true);
