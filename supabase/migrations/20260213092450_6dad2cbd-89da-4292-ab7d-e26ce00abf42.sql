
-- Order item requests from chefs/competitors
CREATE TABLE public.order_item_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_role TEXT NOT NULL DEFAULT 'chef',
  category TEXT NOT NULL DEFAULT 'food_ingredients',
  item_name TEXT NOT NULL,
  item_name_ar TEXT,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'piece',
  notes TEXT,
  notes_ar TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  list_id UUID REFERENCES public.requirement_lists(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_item_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own requests"
ON public.order_item_requests FOR SELECT
USING (requester_id = auth.uid());

-- Admins/organizers can view all requests
CREATE POLICY "Admins can view all requests"
ON public.order_item_requests FOR SELECT
USING (public.is_admin_user());

-- Competition role holders can view competition requests
CREATE POLICY "Competition role holders can view requests"
ON public.order_item_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.competition_roles cr
    WHERE cr.competition_id = order_item_requests.competition_id
      AND cr.user_id = auth.uid()
      AND cr.status = 'active'
      AND cr.role IN ('organizer', 'head_judge', 'coordinator')
  )
);

-- Authenticated users can create requests
CREATE POLICY "Users can create requests"
ON public.order_item_requests FOR INSERT
WITH CHECK (auth.uid() = requester_id);

-- Admins/organizers can update requests (for approval/rejection)
CREATE POLICY "Admins can update requests"
ON public.order_item_requests FOR UPDATE
USING (public.is_admin_user());

-- Competition organizers can update requests
CREATE POLICY "Competition organizers can update requests"
ON public.order_item_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.competition_roles cr
    WHERE cr.competition_id = order_item_requests.competition_id
      AND cr.user_id = auth.uid()
      AND cr.status = 'active'
      AND cr.role IN ('organizer', 'coordinator')
  )
);

-- Users can delete their own pending requests
CREATE POLICY "Users can delete own pending requests"
ON public.order_item_requests FOR DELETE
USING (requester_id = auth.uid() AND status = 'pending');

-- Trigger for updated_at
CREATE TRIGGER update_order_item_requests_updated_at
  BEFORE UPDATE ON public.order_item_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_item_requests;
