
-- Master catalog of requirement items (reusable across competitions)
CREATE TABLE public.requirement_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  unit TEXT DEFAULT 'piece',
  default_quantity INTEGER DEFAULT 1,
  estimated_cost NUMERIC,
  currency TEXT DEFAULT 'USD',
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name, category)
);

-- Requirement lists linked to competitions
CREATE TABLE public.requirement_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Items within a requirement list
CREATE TABLE public.requirement_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES public.requirement_lists(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.requirement_items(id),
  custom_name TEXT,
  custom_name_ar TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'piece',
  estimated_cost NUMERIC,
  currency TEXT DEFAULT 'USD',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  sponsor_id UUID REFERENCES public.companies(id),
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Assignments: delegate list preparation to specific users
CREATE TABLE public.requirement_list_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES public.requirement_lists(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  assigned_by UUID REFERENCES auth.users(id) NOT NULL,
  can_edit BOOLEAN DEFAULT true,
  role TEXT DEFAULT 'preparer',
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(list_id, user_id)
);

-- Shares: share lists with users
CREATE TABLE public.requirement_list_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES public.requirement_lists(id) ON DELETE CASCADE NOT NULL,
  shared_with_user_id UUID REFERENCES auth.users(id),
  shared_by UUID REFERENCES auth.users(id) NOT NULL,
  permission TEXT DEFAULT 'view',
  shared_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(list_id, shared_with_user_id)
);

-- Sponsorship requests sent to sponsors
CREATE TABLE public.requirement_sponsorship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES public.requirement_lists(id) ON DELETE CASCADE NOT NULL,
  competition_id UUID REFERENCES public.competitions(id) ON DELETE CASCADE NOT NULL,
  sponsor_company_id UUID REFERENCES public.companies(id) NOT NULL,
  requested_by UUID REFERENCES auth.users(id) NOT NULL,
  request_type TEXT NOT NULL DEFAULT 'sponsorship',
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  items JSONB,
  total_estimated_cost NUMERIC,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending',
  response_notes TEXT,
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES auth.users(id),
  deadline TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Now enable RLS on all tables
ALTER TABLE public.requirement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirement_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirement_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirement_list_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirement_list_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirement_sponsorship_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for requirement_items
CREATE POLICY "Authenticated users can view items" ON public.requirement_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage items" ON public.requirement_items
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can insert items" ON public.requirement_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- RLS Policies for requirement_lists
CREATE POLICY "Users can view lists they have access to" ON public.requirement_lists
  FOR SELECT TO authenticated USING (
    created_by = auth.uid()
    OR public.is_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.requirement_list_assignments WHERE list_id = id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.requirement_list_shares WHERE list_id = id AND shared_with_user_id = auth.uid())
  );
CREATE POLICY "Creators and admins can manage lists" ON public.requirement_lists
  FOR ALL TO authenticated USING (created_by = auth.uid() OR public.is_admin(auth.uid()));

-- RLS Policies for requirement_list_items
CREATE POLICY "Users can view list items via list access" ON public.requirement_list_items
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.requirement_lists rl WHERE rl.id = list_id
      AND (rl.created_by = auth.uid() OR public.is_admin(auth.uid())
        OR EXISTS (SELECT 1 FROM public.requirement_list_assignments rla WHERE rla.list_id = rl.id AND rla.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.requirement_list_shares rls WHERE rls.list_id = rl.id AND rls.shared_with_user_id = auth.uid())))
  );
CREATE POLICY "Authorized users can manage list items" ON public.requirement_list_items
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.requirement_lists rl WHERE rl.id = list_id
      AND (rl.created_by = auth.uid() OR public.is_admin(auth.uid())
        OR EXISTS (SELECT 1 FROM public.requirement_list_assignments rla WHERE rla.list_id = rl.id AND rla.user_id = auth.uid() AND rla.can_edit = true)))
  );

-- RLS Policies for requirement_list_assignments
CREATE POLICY "Users can view their assignments" ON public.requirement_list_assignments
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR assigned_by = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Admins and creators can manage assignments" ON public.requirement_list_assignments
  FOR ALL TO authenticated USING (assigned_by = auth.uid() OR public.is_admin(auth.uid()));

-- RLS Policies for requirement_list_shares
CREATE POLICY "Users can view shares involving them" ON public.requirement_list_shares
  FOR SELECT TO authenticated USING (shared_with_user_id = auth.uid() OR shared_by = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Sharers and admins can manage shares" ON public.requirement_list_shares
  FOR ALL TO authenticated USING (shared_by = auth.uid() OR public.is_admin(auth.uid()));

-- RLS Policies for requirement_sponsorship_requests
CREATE POLICY "Requesters and sponsors can view requests" ON public.requirement_sponsorship_requests
  FOR SELECT TO authenticated USING (
    requested_by = auth.uid() OR public.is_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.company_contacts cc WHERE cc.company_id = sponsor_company_id AND cc.user_id = auth.uid())
  );
CREATE POLICY "Admins and requesters can manage requests" ON public.requirement_sponsorship_requests
  FOR ALL TO authenticated USING (requested_by = auth.uid() OR public.is_admin(auth.uid()));

-- Triggers
CREATE TRIGGER update_requirement_items_updated_at BEFORE UPDATE ON public.requirement_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_requirement_lists_updated_at BEFORE UPDATE ON public.requirement_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_requirement_list_items_updated_at BEFORE UPDATE ON public.requirement_list_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_requirement_sponsorship_requests_updated_at BEFORE UPDATE ON public.requirement_sponsorship_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
