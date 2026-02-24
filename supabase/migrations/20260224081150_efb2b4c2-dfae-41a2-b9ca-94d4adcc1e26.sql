
-- Exhibition Volunteers table
CREATE TABLE public.exhibition_volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibition_id UUID NOT NULL REFERENCES public.exhibitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, checked_in
  role_title TEXT, -- e.g. 'Registration Desk', 'Guide'
  role_title_ar TEXT,
  availability_start TIMESTAMPTZ,
  availability_end TIMESTAMPTZ,
  skills TEXT[],
  notes TEXT,
  notes_ar TEXT,
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,
  total_hours NUMERIC(5,2) DEFAULT 0,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(exhibition_id, user_id)
);

ALTER TABLE public.exhibition_volunteers ENABLE ROW LEVEL SECURITY;

-- Volunteer Tasks table
CREATE TABLE public.exhibition_volunteer_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibition_id UUID NOT NULL REFERENCES public.exhibitions(id) ON DELETE CASCADE,
  volunteer_id UUID NOT NULL REFERENCES public.exhibition_volunteers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  assigned_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exhibition_volunteer_tasks ENABLE ROW LEVEL SECURITY;

-- RLS for exhibition_volunteers
CREATE POLICY "Users can view volunteers of exhibitions" ON public.exhibition_volunteers
FOR SELECT USING (true);

CREATE POLICY "Users can register as volunteer" ON public.exhibition_volunteers
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners update own volunteer record" ON public.exhibition_volunteers
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins manage volunteers" ON public.exhibition_volunteers
FOR ALL USING (public.is_admin_user());

-- RLS for exhibition_volunteer_tasks
CREATE POLICY "View tasks" ON public.exhibition_volunteer_tasks
FOR SELECT USING (true);

CREATE POLICY "Admins manage tasks" ON public.exhibition_volunteer_tasks
FOR ALL USING (public.is_admin_user());

CREATE POLICY "Volunteers update own tasks" ON public.exhibition_volunteer_tasks
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.exhibition_volunteers v WHERE v.id = volunteer_id AND v.user_id = auth.uid())
);

-- Notification trigger for volunteer approval
CREATE OR REPLACE FUNCTION public.notify_volunteer_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_exhibition_title TEXT;
  v_exhibition_slug TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('approved', 'rejected') THEN
    SELECT title, slug INTO v_exhibition_title, v_exhibition_slug FROM exhibitions WHERE id = NEW.exhibition_id;
    INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
    VALUES (
      NEW.user_id,
      CASE WHEN NEW.status = 'approved' THEN '✅ Volunteer application approved!' ELSE '❌ Volunteer application declined' END,
      CASE WHEN NEW.status = 'approved' THEN '✅ تم قبول طلب التطوع!' ELSE '❌ تم رفض طلب التطوع' END,
      'Your volunteer application for "' || v_exhibition_title || '" has been ' || NEW.status,
      'طلب التطوع الخاص بك في "' || v_exhibition_title || '" تم ' || CASE WHEN NEW.status = 'approved' THEN 'قبوله' ELSE 'رفضه' END,
      'volunteer_status',
      '/exhibitions/' || v_exhibition_slug,
      jsonb_build_object('exhibition_id', NEW.exhibition_id, 'status', NEW.status)
    );
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_volunteer_status
AFTER UPDATE ON public.exhibition_volunteers
FOR EACH ROW EXECUTE FUNCTION public.notify_volunteer_status();
