
-- Group chats table
CREATE TABLE public.chat_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  avatar_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Group members table
CREATE TABLE public.chat_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin' or 'member'
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Group messages table
CREATE TABLE public.chat_group_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  message_type TEXT NOT NULL DEFAULT 'text',
  attachment_urls TEXT[] DEFAULT '{}',
  attachment_names TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_group_messages ENABLE ROW LEVEL SECURITY;

-- RLS: Groups - members can see their groups
CREATE POLICY "Members can view their groups"
ON public.chat_groups FOR SELECT
USING (id IN (SELECT group_id FROM public.chat_group_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can create groups"
ON public.chat_groups FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group admins can update"
ON public.chat_groups FOR UPDATE
USING (id IN (SELECT group_id FROM public.chat_group_members WHERE user_id = auth.uid() AND role = 'admin'));

-- RLS: Members
CREATE POLICY "Members can view group members"
ON public.chat_group_members FOR SELECT
USING (group_id IN (SELECT group_id FROM public.chat_group_members AS gm WHERE gm.user_id = auth.uid()));

CREATE POLICY "Admins can add members"
ON public.chat_group_members FOR INSERT
WITH CHECK (
  group_id IN (SELECT group_id FROM public.chat_group_members WHERE user_id = auth.uid() AND role = 'admin')
  OR group_id IN (SELECT id FROM public.chat_groups WHERE created_by = auth.uid())
);

CREATE POLICY "Admins can remove members"
ON public.chat_group_members FOR DELETE
USING (
  user_id = auth.uid()
  OR group_id IN (SELECT group_id FROM public.chat_group_members WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS: Messages
CREATE POLICY "Members can view group messages"
ON public.chat_group_messages FOR SELECT
USING (group_id IN (SELECT group_id FROM public.chat_group_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can send messages"
ON public.chat_group_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND group_id IN (SELECT group_id FROM public.chat_group_members WHERE user_id = auth.uid())
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_group_messages;

-- Index for performance
CREATE INDEX idx_group_members_user ON public.chat_group_members(user_id);
CREATE INDEX idx_group_messages_group ON public.chat_group_messages(group_id, created_at DESC);
