
-- Exhibitor applications / booth requests
CREATE TABLE IF NOT EXISTS public.exhibition_booth_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibition_id UUID NOT NULL REFERENCES public.exhibitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  company_name TEXT NOT NULL,
  company_name_ar TEXT,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  website_url TEXT,
  logo_url TEXT,
  description TEXT,
  description_ar TEXT,
  preferred_category TEXT DEFAULT 'general',
  preferred_size TEXT DEFAULT 'medium',
  preferred_hall TEXT,
  special_requirements TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  booth_id UUID REFERENCES public.exhibition_booths(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(exhibition_id, user_id)
);

ALTER TABLE public.exhibition_booth_requests ENABLE ROW LEVEL SECURITY;

-- Users can see their own requests
CREATE POLICY "Users can view own booth requests"
ON public.exhibition_booth_requests FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create booth requests"
ON public.exhibition_booth_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their pending requests
CREATE POLICY "Users can update own pending requests"
ON public.exhibition_booth_requests FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- Admins/organizers can view all requests for their exhibitions
CREATE POLICY "Organizers can view exhibition requests"
ON public.exhibition_booth_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM exhibitions e WHERE e.id = exhibition_id AND e.created_by = auth.uid()
  )
  OR public.is_admin(auth.uid())
);

-- Admins/organizers can update requests (approve/reject)
CREATE POLICY "Organizers can manage requests"
ON public.exhibition_booth_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM exhibitions e WHERE e.id = exhibition_id AND e.created_by = auth.uid()
  )
  OR public.is_admin(auth.uid())
);

-- Notify organizer on new booth request
CREATE OR REPLACE FUNCTION public.notify_booth_request()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_exhibition_title TEXT;
  v_exhibition_slug TEXT;
  v_creator_id UUID;
  v_requester_name TEXT;
BEGIN
  SELECT title, slug, created_by INTO v_exhibition_title, v_exhibition_slug, v_creator_id
  FROM exhibitions WHERE id = NEW.exhibition_id;

  SELECT COALESCE(full_name, username, NEW.contact_name) INTO v_requester_name
  FROM profiles WHERE user_id = NEW.user_id;

  IF v_creator_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
    VALUES (
      v_creator_id,
      '📋 New booth request from ' || v_requester_name,
      '📋 طلب جناح جديد من ' || v_requester_name,
      NEW.company_name || ' requested a booth at "' || v_exhibition_title || '"',
      NEW.company_name || ' طلب جناح في "' || v_exhibition_title || '"',
      'booth_request',
      '/exhibitions/' || v_exhibition_slug,
      jsonb_build_object('request_id', NEW.id, 'exhibition_id', NEW.exhibition_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_booth_request
AFTER INSERT ON public.exhibition_booth_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_booth_request();

-- Notify requester on status change
CREATE OR REPLACE FUNCTION public.notify_booth_request_status()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_exhibition_title TEXT;
  v_exhibition_slug TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('approved', 'rejected') THEN
    SELECT title, slug INTO v_exhibition_title, v_exhibition_slug
    FROM exhibitions WHERE id = NEW.exhibition_id;

    INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
    VALUES (
      NEW.user_id,
      CASE WHEN NEW.status = 'approved' THEN '✅ Booth request approved!' ELSE '❌ Booth request declined' END,
      CASE WHEN NEW.status = 'approved' THEN '✅ تم قبول طلب الجناح!' ELSE '❌ تم رفض طلب الجناح' END,
      'Your booth request for "' || v_exhibition_title || '" has been ' || NEW.status,
      'طلب الجناح الخاص بك في "' || v_exhibition_title || '" تم ' || CASE WHEN NEW.status = 'approved' THEN 'قبوله' ELSE 'رفضه' END,
      'booth_request_status',
      '/exhibitions/' || v_exhibition_slug,
      jsonb_build_object('request_id', NEW.id, 'status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_booth_request_status
AFTER UPDATE ON public.exhibition_booth_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_booth_request_status();
