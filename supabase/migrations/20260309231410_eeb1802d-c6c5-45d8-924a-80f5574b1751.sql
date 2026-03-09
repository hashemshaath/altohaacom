
CREATE TABLE public.site_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_ar TEXT,
  body TEXT,
  body_ar TEXT,
  type TEXT NOT NULL DEFAULT 'info',
  link_url TEXT,
  link_text TEXT,
  link_text_ar TEXT,
  bg_color TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_dismissible BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  target_roles TEXT[],
  priority INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active announcements"
  ON public.site_announcements FOR SELECT TO authenticated
  USING (is_active = true AND starts_at <= now() AND (ends_at IS NULL OR ends_at > now()));

CREATE POLICY "Admins manage announcements"
  ON public.site_announcements FOR ALL TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

CREATE TABLE public.dismissed_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES public.site_announcements(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, announcement_id)
);

ALTER TABLE public.dismissed_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own dismissals"
  ON public.dismissed_announcements FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
