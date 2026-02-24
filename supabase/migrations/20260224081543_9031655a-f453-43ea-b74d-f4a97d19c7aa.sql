
-- Exhibition Live Cooking Sessions
CREATE TABLE public.exhibition_cooking_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibition_id UUID NOT NULL REFERENCES public.exhibitions(id) ON DELETE CASCADE,
  chef_id UUID NOT NULL,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  cuisine_type TEXT,
  difficulty TEXT DEFAULT 'intermediate', -- beginner, intermediate, advanced
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled', -- scheduled, live, completed, cancelled
  max_audience INTEGER DEFAULT 50,
  stream_url TEXT,
  thumbnail_url TEXT,
  ingredients TEXT[],
  equipment TEXT[],
  is_featured BOOLEAN DEFAULT false,
  booth_id UUID REFERENCES public.exhibition_booths(id),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exhibition_cooking_sessions ENABLE ROW LEVEL SECURITY;

-- Audience interactions (reactions, questions)
CREATE TABLE public.exhibition_session_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.exhibition_cooking_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'reaction', -- reaction, question, tip
  content TEXT,
  emoji TEXT,
  is_answered BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exhibition_session_interactions ENABLE ROW LEVEL SECURITY;

-- Session registrations
CREATE TABLE public.exhibition_session_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.exhibition_cooking_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  attended BOOLEAN DEFAULT false,
  UNIQUE(session_id, user_id)
);

ALTER TABLE public.exhibition_session_registrations ENABLE ROW LEVEL SECURITY;

-- RLS: cooking sessions
CREATE POLICY "Anyone can view cooking sessions" ON public.exhibition_cooking_sessions FOR SELECT USING (true);
CREATE POLICY "Admins manage cooking sessions" ON public.exhibition_cooking_sessions FOR ALL USING (public.is_admin_user());
CREATE POLICY "Chefs manage own sessions" ON public.exhibition_cooking_sessions FOR UPDATE USING (auth.uid() = chef_id);
CREATE POLICY "Chefs create sessions" ON public.exhibition_cooking_sessions FOR INSERT WITH CHECK (auth.uid() = chef_id OR public.is_admin_user());

-- RLS: interactions
CREATE POLICY "Anyone can view interactions" ON public.exhibition_session_interactions FOR SELECT USING (true);
CREATE POLICY "Auth users create interactions" ON public.exhibition_session_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own interactions" ON public.exhibition_session_interactions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage interactions" ON public.exhibition_session_interactions FOR ALL USING (public.is_admin_user());

-- RLS: registrations
CREATE POLICY "Anyone can view registrations" ON public.exhibition_session_registrations FOR SELECT USING (true);
CREATE POLICY "Users register for sessions" ON public.exhibition_session_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users cancel own registration" ON public.exhibition_session_registrations FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for live interactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.exhibition_session_interactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.exhibition_cooking_sessions;
