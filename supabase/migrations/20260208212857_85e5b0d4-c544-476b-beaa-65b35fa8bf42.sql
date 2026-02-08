-- Create membership tier enum
CREATE TYPE public.membership_tier AS ENUM ('basic', 'professional', 'enterprise');

-- Create membership status enum
CREATE TYPE public.membership_status AS ENUM ('active', 'expired', 'suspended', 'cancelled');

-- Create account status enum
CREATE TYPE public.account_status AS ENUM ('pending', 'active', 'suspended', 'banned');

-- Create sequence tables for role-prefixed account numbers
CREATE TABLE public.account_sequences (
  role public.app_role PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0
);

-- Initialize sequences for all roles
INSERT INTO public.account_sequences (role, last_number) VALUES
  ('chef', 0),
  ('judge', 0),
  ('student', 0),
  ('organizer', 0),
  ('volunteer', 0),
  ('sponsor', 0),
  ('assistant', 0),
  ('supervisor', 0);

-- Create invoice sequence table
CREATE TABLE public.invoice_sequences (
  year INTEGER PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0
);

-- Add new columns to profiles table for account management
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS account_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS account_status public.account_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS membership_tier public.membership_tier DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS membership_status public.membership_status DEFAULT 'active',
ADD COLUMN IF NOT EXISTS membership_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS suspended_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Create membership history table for tracking changes
CREATE TABLE public.membership_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  previous_tier public.membership_tier,
  new_tier public.membership_tier NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  description TEXT,
  status TEXT DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create admin actions log for audit trail
CREATE TABLE public.admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  target_user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create content reports table for moderation
CREATE TABLE public.content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id),
  content_type TEXT NOT NULL, -- 'post', 'comment', 'group', 'user'
  content_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'dismissed'
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Function to generate role-prefixed account number
CREATE OR REPLACE FUNCTION public.generate_account_number(p_role public.app_role)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix TEXT;
  v_number INTEGER;
BEGIN
  -- Map role to prefix
  CASE p_role
    WHEN 'chef' THEN v_prefix := 'CHF';
    WHEN 'judge' THEN v_prefix := 'JDG';
    WHEN 'student' THEN v_prefix := 'STD';
    WHEN 'organizer' THEN v_prefix := 'ORG';
    WHEN 'volunteer' THEN v_prefix := 'VOL';
    WHEN 'sponsor' THEN v_prefix := 'SPN';
    WHEN 'assistant' THEN v_prefix := 'AST';
    WHEN 'supervisor' THEN v_prefix := 'SPV';
    ELSE v_prefix := 'USR';
  END CASE;

  -- Get and increment sequence
  UPDATE public.account_sequences
  SET last_number = last_number + 1
  WHERE role = p_role
  RETURNING last_number INTO v_number;

  -- Return formatted account number (e.g., CHF-0001)
  RETURN v_prefix || '-' || LPAD(v_number::TEXT, 4, '0');
END;
$$;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year INTEGER;
  v_number INTEGER;
BEGIN
  v_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Upsert sequence for current year
  INSERT INTO public.invoice_sequences (year, last_number)
  VALUES (v_year, 1)
  ON CONFLICT (year) 
  DO UPDATE SET last_number = invoice_sequences.last_number + 1
  RETURNING last_number INTO v_number;

  -- Return formatted invoice number (e.g., INV-2026-0001)
  RETURN 'INV-' || v_year || '-' || LPAD(v_number::TEXT, 4, '0');
END;
$$;

-- Function to validate username format
CREATE OR REPLACE FUNCTION public.validate_username(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Username rules: 3-30 chars, alphanumeric + underscore, must start with letter
  RETURN p_username ~ '^[a-zA-Z][a-zA-Z0-9_]{2,29}$';
END;
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id 
    AND role IN ('organizer', 'supervisor')
  );
$$;

-- Trigger to auto-generate account number on role assignment
CREATE OR REPLACE FUNCTION public.assign_account_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update profile with account number if not already set
  UPDATE public.profiles
  SET account_number = public.generate_account_number(NEW.role),
      account_status = 'active'
  WHERE user_id = NEW.user_id
  AND account_number IS NULL;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_role_assigned
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_account_number();

-- Enable RLS on new tables
ALTER TABLE public.membership_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_sequences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for membership_history
CREATE POLICY "Users can view own membership history"
ON public.membership_history FOR SELECT
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert membership history"
ON public.membership_history FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- RLS Policies for invoices
CREATE POLICY "Users can view own invoices"
ON public.invoices FOR SELECT
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can create invoices"
ON public.invoices FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update invoices"
ON public.invoices FOR UPDATE
USING (public.is_admin(auth.uid()));

-- RLS Policies for admin_actions
CREATE POLICY "Admins can view admin actions"
ON public.admin_actions FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can log actions"
ON public.admin_actions FOR INSERT
WITH CHECK (public.is_admin(auth.uid()) AND auth.uid() = admin_id);

-- RLS Policies for content_reports
CREATE POLICY "Users can create reports"
ON public.content_reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
ON public.content_reports FOR SELECT
USING (public.is_admin(auth.uid()) OR auth.uid() = reporter_id);

CREATE POLICY "Admins can update reports"
ON public.content_reports FOR UPDATE
USING (public.is_admin(auth.uid()));

-- RLS Policies for sequences (admin only)
CREATE POLICY "Admins can view sequences"
ON public.account_sequences FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view invoice sequences"
ON public.invoice_sequences FOR SELECT
USING (public.is_admin(auth.uid()));