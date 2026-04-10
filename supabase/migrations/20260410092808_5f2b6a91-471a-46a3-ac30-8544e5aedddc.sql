CREATE POLICY "Authors and admins can view post edits"
  ON public.post_edits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_edits.post_id
        AND (posts.author_id = auth.uid() OR is_admin(auth.uid()))
    )
  );
