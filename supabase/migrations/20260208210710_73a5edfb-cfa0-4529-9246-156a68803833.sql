
-- Connections table (follow/connect with other users)
CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Groups table
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  cover_image_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Group memberships
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

-- Posts (feed content)
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Post likes
CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

-- Post comments
CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Connections RLS
CREATE POLICY "Anyone can view connections"
ON public.connections FOR SELECT USING (true);

CREATE POLICY "Users can follow others"
ON public.connections FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
ON public.connections FOR DELETE USING (auth.uid() = follower_id);

-- Groups RLS
CREATE POLICY "Anyone can view public groups"
ON public.groups FOR SELECT USING (is_private = false OR created_by = auth.uid());

CREATE POLICY "Authenticated users can create groups"
ON public.groups FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can update their groups"
ON public.groups FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Group creators can delete their groups"
ON public.groups FOR DELETE USING (auth.uid() = created_by);

-- Group members RLS
CREATE POLICY "Anyone can view group members of public groups"
ON public.group_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND (is_private = false OR created_by = auth.uid()))
  OR user_id = auth.uid()
);

CREATE POLICY "Users can join groups"
ON public.group_members FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
ON public.group_members FOR DELETE USING (auth.uid() = user_id);

-- Posts RLS
CREATE POLICY "Anyone can view posts in public groups or personal feed"
ON public.posts FOR SELECT USING (
  group_id IS NULL 
  OR EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND is_private = false)
  OR EXISTS (SELECT 1 FROM public.group_members WHERE group_id = posts.group_id AND user_id = auth.uid())
);

CREATE POLICY "Users can create posts"
ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts"
ON public.posts FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own posts"
ON public.posts FOR DELETE USING (auth.uid() = author_id);

-- Post likes RLS
CREATE POLICY "Anyone can view likes"
ON public.post_likes FOR SELECT USING (true);

CREATE POLICY "Users can like posts"
ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- Post comments RLS
CREATE POLICY "Anyone can view comments"
ON public.post_comments FOR SELECT USING (true);

CREATE POLICY "Users can comment"
ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own comments"
ON public.post_comments FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments"
ON public.post_comments FOR DELETE USING (auth.uid() = author_id);

-- Triggers for updated_at
CREATE TRIGGER update_groups_updated_at
BEFORE UPDATE ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at
BEFORE UPDATE ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
