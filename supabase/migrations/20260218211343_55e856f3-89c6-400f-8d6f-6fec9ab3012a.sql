-- Fix infinite recursion in chat_group_members RLS policies
-- Drop all existing policies
DROP POLICY IF EXISTS "Members can view group members" ON public.chat_group_members;
DROP POLICY IF EXISTS "Admins can add members" ON public.chat_group_members;
DROP POLICY IF EXISTS "Admins can remove members" ON public.chat_group_members;

-- Recreate SELECT policy using auth.uid() directly (no self-reference)
CREATE POLICY "Members can view group members"
ON public.chat_group_members
FOR SELECT
USING (user_id = auth.uid() OR group_id IN (
  SELECT cg.id FROM chat_groups cg WHERE cg.created_by = auth.uid()
));

-- Recreate INSERT policy without self-reference
CREATE POLICY "Admins can add members"
ON public.chat_group_members
FOR INSERT
WITH CHECK (
  group_id IN (SELECT cg.id FROM chat_groups cg WHERE cg.created_by = auth.uid())
);

-- Recreate DELETE policy without self-reference  
CREATE POLICY "Admins can remove members"
ON public.chat_group_members
FOR DELETE
USING (
  user_id = auth.uid() OR group_id IN (SELECT cg.id FROM chat_groups cg WHERE cg.created_by = auth.uid())
);