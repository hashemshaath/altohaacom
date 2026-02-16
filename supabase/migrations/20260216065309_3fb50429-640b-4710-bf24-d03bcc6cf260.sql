
-- ═══════════════════════════════════════════════════════════
-- ADVANCED COMPETITION FEATURES — Phase A: Core Schema
-- ═══════════════════════════════════════════════════════════

-- 1. TOURNAMENT ROUNDS
CREATE TABLE public.competition_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  name_ar TEXT,
  round_type TEXT NOT NULL DEFAULT 'preliminary',
  format TEXT NOT NULL DEFAULT 'scored',
  max_participants INTEGER,
  advancement_count INTEGER,
  advancement_rule TEXT DEFAULT 'top_scores',
  threshold_score NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(competition_id, round_number)
);

CREATE TABLE public.round_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES public.competition_rounds(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES public.competition_registrations(id) ON DELETE CASCADE,
  seed_position INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  total_score NUMERIC,
  rank INTEGER,
  advanced_to_round_id UUID REFERENCES public.competition_rounds(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(round_id, registration_id)
);

-- 2. GLOBAL CHEF RANKINGS
CREATE TABLE public.chef_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ranking_period TEXT NOT NULL DEFAULT 'all_time',
  period_value TEXT,
  total_points INTEGER NOT NULL DEFAULT 0,
  competitions_entered INTEGER NOT NULL DEFAULT 0,
  competitions_won INTEGER NOT NULL DEFAULT 0,
  gold_medals INTEGER NOT NULL DEFAULT 0,
  silver_medals INTEGER NOT NULL DEFAULT 0,
  bronze_medals INTEGER NOT NULL DEFAULT 0,
  average_score NUMERIC,
  rank INTEGER,
  previous_rank INTEGER,
  rank_change INTEGER DEFAULT 0,
  country_code CHAR(2),
  specialty TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, ranking_period, period_value)
);

CREATE INDEX idx_chef_rankings_rank ON public.chef_rankings(ranking_period, period_value, rank);
CREATE INDEX idx_chef_rankings_country ON public.chef_rankings(country_code, ranking_period);

CREATE TABLE public.ranking_points_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  competition_id UUID REFERENCES public.competitions(id) ON DELETE SET NULL,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reason_ar TEXT,
  competition_name TEXT,
  competition_name_ar TEXT,
  awarded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ranking_points_user ON public.ranking_points_log(user_id, awarded_at DESC);

-- 3. BLIND JUDGING
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS blind_judging_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS blind_code_prefix TEXT DEFAULT 'ENTRY';

CREATE TABLE public.blind_judging_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES public.competition_registrations(id) ON DELETE CASCADE,
  blind_code TEXT NOT NULL,
  round_id UUID REFERENCES public.competition_rounds(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(competition_id, blind_code),
  UNIQUE(competition_id, registration_id, round_id)
);

-- 4. MULTI-STAGE EVALUATION
CREATE TABLE public.evaluation_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  stage_type TEXT NOT NULL DEFAULT 'visual',
  weight_percentage NUMERIC DEFAULT 100,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.stage_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID NOT NULL REFERENCES public.evaluation_stages(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES public.competition_registrations(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL,
  score NUMERIC NOT NULL DEFAULT 0,
  max_score NUMERIC NOT NULL DEFAULT 100,
  notes TEXT,
  notes_ar TEXT,
  evidence_urls TEXT[],
  scored_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(stage_id, registration_id, judge_id)
);

-- 5. JUDGE PERFORMANCE ANALYTICS
CREATE TABLE public.judge_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_id UUID NOT NULL,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  avg_score_given NUMERIC,
  score_std_deviation NUMERIC,
  scores_count INTEGER DEFAULT 0,
  completion_rate NUMERIC,
  avg_scoring_time_seconds INTEGER,
  bias_indicator NUMERIC,
  consistency_score NUMERIC,
  computed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(judge_id, competition_id)
);

-- 6. JUDGE DELIBERATION
CREATE TABLE public.judge_deliberations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  round_id UUID REFERENCES public.competition_rounds(id),
  topic TEXT NOT NULL,
  topic_ar TEXT,
  status TEXT DEFAULT 'open',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE public.deliberation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliberation_id UUID NOT NULL REFERENCES public.judge_deliberations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  message_ar TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. COMPETITION PORTFOLIO
CREATE TABLE public.competition_portfolio_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES public.competition_registrations(id),
  final_rank INTEGER,
  final_score NUMERIC,
  medal TEXT,
  certificate_id UUID REFERENCES public.certificates(id),
  dish_photos TEXT[],
  personal_notes TEXT,
  personal_notes_ar TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, competition_id)
);

CREATE INDEX idx_portfolio_user ON public.competition_portfolio_entries(user_id, created_at DESC);

-- 8. PREPARATION CHECKLIST
CREATE TABLE public.preparation_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  progress_percentage NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(competition_id, user_id)
);

-- 9. POST-COMPETITION FEEDBACK
CREATE TABLE public.competition_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES public.competition_registrations(id) ON DELETE CASCADE,
  judge_id UUID,
  category TEXT DEFAULT 'general',
  comment TEXT,
  comment_ar TEXT,
  score_breakdown JSONB,
  is_visible BOOLEAN DEFAULT false,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. TEAM COLLABORATION
CREATE TABLE public.team_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES public.competition_registrations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  recipe_plan JSONB,
  task_board JSONB DEFAULT '[]'::jsonb,
  practice_schedule JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(competition_id, registration_id)
);

-- 11. COMPETITION SCHEDULING
CREATE TABLE public.competition_schedule_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  round_id UUID REFERENCES public.competition_rounds(id),
  category_id UUID REFERENCES public.competition_categories(id),
  title TEXT NOT NULL,
  title_ar TEXT,
  slot_type TEXT DEFAULT 'competition',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  station_number TEXT,
  location TEXT,
  location_ar TEXT,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.kitchen_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  station_number TEXT NOT NULL,
  station_name TEXT,
  station_name_ar TEXT,
  equipment_list JSONB DEFAULT '[]'::jsonb,
  assigned_registration_id UUID REFERENCES public.competition_registrations(id),
  assigned_slot_id UUID REFERENCES public.competition_schedule_slots(id),
  status TEXT DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(competition_id, station_number)
);

-- ═══ ENABLE RLS ═══
ALTER TABLE public.competition_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chef_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranking_points_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blind_judging_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judge_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judge_deliberations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliberation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_portfolio_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preparation_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_schedule_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_stations ENABLE ROW LEVEL SECURITY;

-- ═══ RLS POLICIES ═══

-- Competition rounds
CREATE POLICY "Anyone can view rounds" ON public.competition_rounds FOR SELECT USING (true);
CREATE POLICY "Admins manage rounds" ON public.competition_rounds FOR ALL USING (public.is_admin_user());

-- Round participants
CREATE POLICY "Anyone can view round participants" ON public.round_participants FOR SELECT USING (true);
CREATE POLICY "Admins manage round participants" ON public.round_participants FOR ALL USING (public.is_admin_user());

-- Chef rankings
CREATE POLICY "Anyone can view rankings" ON public.chef_rankings FOR SELECT USING (true);
CREATE POLICY "Admins manage rankings" ON public.chef_rankings FOR ALL USING (public.is_admin_user());

-- Ranking points
CREATE POLICY "Users view own points" ON public.ranking_points_log FOR SELECT USING (auth.uid() = user_id OR public.is_admin_user());
CREATE POLICY "Admins manage points" ON public.ranking_points_log FOR ALL USING (public.is_admin_user());

-- Blind codes: admin only
CREATE POLICY "Admins manage blind codes" ON public.blind_judging_codes FOR ALL USING (public.is_admin_user());

-- Evaluation stages
CREATE POLICY "Anyone can view stages" ON public.evaluation_stages FOR SELECT USING (true);
CREATE POLICY "Admins manage stages" ON public.evaluation_stages FOR ALL USING (public.is_admin_user());

-- Stage scores
CREATE POLICY "Judges insert own scores" ON public.stage_scores FOR INSERT WITH CHECK (auth.uid() = judge_id);
CREATE POLICY "Judges update own scores" ON public.stage_scores FOR UPDATE USING (auth.uid() = judge_id);
CREATE POLICY "Admins manage stage scores" ON public.stage_scores FOR ALL USING (public.is_admin_user());
CREATE POLICY "View stage scores" ON public.stage_scores FOR SELECT USING (auth.uid() IS NOT NULL);

-- Judge analytics
CREATE POLICY "Judges view own analytics" ON public.judge_analytics FOR SELECT USING (auth.uid() = judge_id OR public.is_admin_user());
CREATE POLICY "Admins manage analytics" ON public.judge_analytics FOR ALL USING (public.is_admin_user());

-- Judge deliberations
CREATE POLICY "View deliberations" ON public.judge_deliberations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Create deliberations" ON public.judge_deliberations FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins manage deliberations" ON public.judge_deliberations FOR ALL USING (public.is_admin_user());

CREATE POLICY "View deliberation messages" ON public.deliberation_messages FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Send deliberation messages" ON public.deliberation_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Portfolio
CREATE POLICY "Public portfolios visible" ON public.competition_portfolio_entries FOR SELECT USING (is_public = true OR auth.uid() = user_id OR public.is_admin_user());
CREATE POLICY "Users manage own portfolio" ON public.competition_portfolio_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own portfolio" ON public.competition_portfolio_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own portfolio" ON public.competition_portfolio_entries FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage portfolios" ON public.competition_portfolio_entries FOR ALL USING (public.is_admin_user());

-- Checklists
CREATE POLICY "Users view own checklists" ON public.preparation_checklists FOR SELECT USING (auth.uid() = user_id OR public.is_admin_user());
CREATE POLICY "Users create own checklists" ON public.preparation_checklists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own checklists" ON public.preparation_checklists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage checklists" ON public.preparation_checklists FOR ALL USING (public.is_admin_user());

-- Feedback
CREATE POLICY "View feedback" ON public.competition_feedback FOR SELECT USING (
  EXISTS (SELECT 1 FROM competition_registrations cr WHERE cr.id = registration_id AND cr.participant_id = auth.uid() AND is_visible = true)
  OR auth.uid() = judge_id
  OR public.is_admin_user()
);
CREATE POLICY "Judges create feedback" ON public.competition_feedback FOR INSERT WITH CHECK (auth.uid() = judge_id OR public.is_admin_user());
CREATE POLICY "Admins manage feedback" ON public.competition_feedback FOR ALL USING (public.is_admin_user());

-- Team workspaces
CREATE POLICY "Team members view workspace" ON public.team_workspaces FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM competition_registrations cr
    LEFT JOIN registration_team_members tm ON tm.registration_id = cr.id
    WHERE cr.id = team_workspaces.registration_id
    AND (cr.participant_id = auth.uid() OR tm.user_id = auth.uid())
  )
  OR public.is_admin_user()
);
CREATE POLICY "Team leads create workspace" ON public.team_workspaces FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM competition_registrations cr WHERE cr.id = registration_id AND cr.participant_id = auth.uid())
);
CREATE POLICY "Team leads update workspace" ON public.team_workspaces FOR UPDATE USING (
  EXISTS (SELECT 1 FROM competition_registrations cr WHERE cr.id = registration_id AND cr.participant_id = auth.uid())
  OR public.is_admin_user()
);
CREATE POLICY "Admins manage workspaces" ON public.team_workspaces FOR ALL USING (public.is_admin_user());

-- Schedule & stations: public read
CREATE POLICY "Anyone can view schedule" ON public.competition_schedule_slots FOR SELECT USING (true);
CREATE POLICY "Admins manage schedule" ON public.competition_schedule_slots FOR ALL USING (public.is_admin_user());

CREATE POLICY "Anyone can view stations" ON public.kitchen_stations FOR SELECT USING (true);
CREATE POLICY "Admins manage stations" ON public.kitchen_stations FOR ALL USING (public.is_admin_user());

-- Triggers
CREATE TRIGGER update_competition_rounds_updated_at BEFORE UPDATE ON public.competition_rounds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_portfolio_updated_at BEFORE UPDATE ON public.competition_portfolio_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_checklists_updated_at BEFORE UPDATE ON public.preparation_checklists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_team_workspaces_updated_at BEFORE UPDATE ON public.team_workspaces FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
