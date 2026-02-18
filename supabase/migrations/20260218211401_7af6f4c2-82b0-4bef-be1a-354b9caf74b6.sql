-- Fix SELECT policy to allow members to see ALL members of their groups
-- Use a security definer function to avoid recursion
CREATE OR REPLACE FUNCTION public.get_user_chat_group_ids(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT group_id FROM chat_group_members WHERE user_id = p_user_id;
$$;

-- Drop and recreate SELECT policy using the function
DROP POLICY IF EXISTS "Members can view group members" ON public.chat_group_members;

CREATE POLICY "Members can view group members"
ON public.chat_group_members
FOR SELECT
USING (
  group_id IN (SELECT public.get_user_chat_group_ids(auth.uid()))
);

-- Also fix INSERT to allow admins (who are already members) to add others
DROP POLICY IF EXISTS "Admins can add members" ON public.chat_group_members;

CREATE POLICY "Admins can add members"
ON public.chat_group_members
FOR INSERT
WITH CHECK (
  group_id IN (SELECT public.get_user_chat_group_ids(auth.uid()))
  OR group_id IN (SELECT id FROM chat_groups WHERE created_by = auth.uid())
);

-- Fix DELETE similarly
DROP POLICY IF EXISTS "Admins can remove members" ON public.chat_group_members;

CREATE POLICY "Admins can remove members"
ON public.chat_group_members
FOR DELETE
USING (
  user_id = auth.uid()
  OR group_id IN (SELECT id FROM chat_groups WHERE created_by = auth.uid())
);