
-- Chef Schedule Events table
CREATE TABLE public.chef_schedule_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_id UUID NOT NULL,
  
  -- Event classification
  event_type TEXT NOT NULL DEFAULT 'personal',
  -- Types: competition, chefs_table, exhibition, tv_interview, conference, 
  --        training, consultation, visit, personal, travel, unavailable, other
  
  -- Core details
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  
  -- Timing
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  timezone TEXT DEFAULT 'Asia/Riyadh',
  
  -- Location
  location TEXT,
  location_ar TEXT,
  city TEXT,
  country_code CHAR(2),
  venue TEXT,
  venue_ar TEXT,
  
  -- Linked platform entities (polymorphic)
  linked_entity_type TEXT, -- competition, chefs_table_session, exhibition, etc.
  linked_entity_id UUID,
  
  -- TV/Media specific fields
  channel_name TEXT,
  channel_name_ar TEXT,
  program_name TEXT,
  program_name_ar TEXT,
  broadcast_type TEXT, -- live, recorded, rerun
  media_url TEXT,
  
  -- Participation details
  participation_type TEXT, -- speaker, judge, competitor, guest, host, trainer, consultant
  participation_type_ar TEXT,
  organizer TEXT,
  organizer_ar TEXT,
  
  -- Contract & availability
  is_contracted BOOLEAN DEFAULT false,
  contract_status TEXT DEFAULT 'none', -- none, pending, confirmed, completed
  fee_amount NUMERIC(12,2),
  fee_currency TEXT DEFAULT 'SAR',
  
  -- Visibility & sharing
  visibility TEXT NOT NULL DEFAULT 'private', 
  -- private: only chef sees, management: shared with admin, public: visible on profile
  show_details_publicly BOOLEAN DEFAULT false, -- if public, show full details or just "busy"
  
  -- Status
  status TEXT NOT NULL DEFAULT 'confirmed', -- tentative, confirmed, cancelled
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  color TEXT, -- optional custom color for calendar display
  
  -- Recurrence (simple)
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT, -- daily, weekly, monthly
  recurrence_end_date TIMESTAMPTZ,
  parent_event_id UUID REFERENCES public.chef_schedule_events(id) ON DELETE SET NULL,
  
  -- Notes
  notes TEXT,
  notes_ar TEXT,
  internal_notes TEXT, -- admin-only notes
  
  -- Metadata
  tags TEXT[],
  attachments TEXT[],
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_chef_schedule_chef_id ON public.chef_schedule_events(chef_id);
CREATE INDEX idx_chef_schedule_dates ON public.chef_schedule_events(start_date, end_date);
CREATE INDEX idx_chef_schedule_type ON public.chef_schedule_events(event_type);
CREATE INDEX idx_chef_schedule_visibility ON public.chef_schedule_events(visibility);
CREATE INDEX idx_chef_schedule_linked ON public.chef_schedule_events(linked_entity_type, linked_entity_id);

-- Enable RLS
ALTER TABLE public.chef_schedule_events ENABLE ROW LEVEL SECURITY;

-- Policies
-- Chefs can view their own events
CREATE POLICY "Chefs can view own schedule"
ON public.chef_schedule_events FOR SELECT
TO authenticated
USING (chef_id = auth.uid());

-- Chefs can manage their own events
CREATE POLICY "Chefs can insert own events"
ON public.chef_schedule_events FOR INSERT
TO authenticated
WITH CHECK (chef_id = auth.uid());

CREATE POLICY "Chefs can update own events"
ON public.chef_schedule_events FOR UPDATE
TO authenticated
USING (chef_id = auth.uid());

CREATE POLICY "Chefs can delete own events"
ON public.chef_schedule_events FOR DELETE
TO authenticated
USING (chef_id = auth.uid());

-- Admins can view all schedules
CREATE POLICY "Admins can view all schedules"
ON public.chef_schedule_events FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can manage all schedules
CREATE POLICY "Admins can insert any schedule"
ON public.chef_schedule_events FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update any schedule"
ON public.chef_schedule_events FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete any schedule"
ON public.chef_schedule_events FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Public can view public events
CREATE POLICY "Public can view public schedule events"
ON public.chef_schedule_events FOR SELECT
TO authenticated
USING (visibility = 'public');

-- Management can view management-shared events
CREATE POLICY "Management can view shared schedules"
ON public.chef_schedule_events FOR SELECT
TO authenticated
USING (
  visibility = 'management' 
  AND public.has_role(auth.uid(), 'supervisor')
);

-- Chef schedule sharing preferences
CREATE TABLE public.chef_schedule_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_id UUID NOT NULL UNIQUE,
  share_with_management BOOLEAN DEFAULT false,
  share_publicly BOOLEAN DEFAULT false,
  default_visibility TEXT DEFAULT 'private',
  show_availability_on_profile BOOLEAN DEFAULT false,
  auto_sync_competitions BOOLEAN DEFAULT true,
  auto_sync_chefs_table BOOLEAN DEFAULT true,
  auto_sync_exhibitions BOOLEAN DEFAULT true,
  working_hours_start TEXT DEFAULT '09:00',
  working_hours_end TEXT DEFAULT '18:00',
  working_days INTEGER[] DEFAULT ARRAY[0,1,2,3,4], -- Sun-Thu for Middle East
  unavailable_message TEXT DEFAULT 'Not available',
  unavailable_message_ar TEXT DEFAULT 'غير متاح',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chef_schedule_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chefs manage own settings"
ON public.chef_schedule_settings FOR ALL
TO authenticated
USING (chef_id = auth.uid())
WITH CHECK (chef_id = auth.uid());

CREATE POLICY "Admins manage all settings"
ON public.chef_schedule_settings FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Updated_at trigger
CREATE TRIGGER update_chef_schedule_events_updated_at
BEFORE UPDATE ON public.chef_schedule_events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chef_schedule_settings_updated_at
BEFORE UPDATE ON public.chef_schedule_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
