
-- ============================================================
-- 1. MEMBERSHIP CARDS TABLE
-- ============================================================
CREATE TABLE public.membership_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_number TEXT NOT NULL UNIQUE,
  verification_code TEXT NOT NULL,
  card_status TEXT NOT NULL DEFAULT 'active' CHECK (card_status IN ('active', 'suspended', 'expired', 'revoked')),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '1 year'),
  trial_ends_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '90 days'),
  is_trial BOOLEAN NOT NULL DEFAULT true,
  renewed_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  suspended_reason TEXT,
  card_orientation TEXT NOT NULL DEFAULT 'horizontal' CHECK (card_orientation IN ('horizontal', 'vertical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.membership_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own membership card"
  ON public.membership_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own card orientation"
  ON public.membership_cards FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all membership cards"
  ON public.membership_cards FOR ALL
  USING (public.is_admin_user());

-- Generate membership number function
CREATE OR REPLACE FUNCTION public.generate_membership_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year TEXT;
  v_count INTEGER;
  v_number TEXT;
BEGIN
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  SELECT COUNT(*) + 1 INTO v_count FROM membership_cards;
  v_number := 'MBR' || v_year || LPAD(v_count::TEXT, 6, '0');
  RETURN v_number;
END;
$$;

-- Generate encrypted verification code for membership
CREATE OR REPLACE FUNCTION public.generate_membership_verification()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
BEGIN
  -- Generate a cryptographically secure code using multiple UUID hashes
  v_code := UPPER(
    SUBSTRING(encode(digest(gen_random_uuid()::TEXT || now()::TEXT || random()::TEXT, 'sha256'), 'hex') FROM 1 FOR 16)
  );
  RETURN v_code;
END;
$$;

-- Trigger to auto-assign membership number and verification code
CREATE OR REPLACE FUNCTION public.trigger_assign_membership_details()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.membership_number IS NULL OR NEW.membership_number = '' THEN
    NEW.membership_number := public.generate_membership_number();
  END IF;
  IF NEW.verification_code IS NULL OR NEW.verification_code = '' THEN
    NEW.verification_code := public.generate_membership_verification();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_membership_details
  BEFORE INSERT ON public.membership_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_assign_membership_details();

-- ============================================================
-- 2. USER WALLETS TABLE
-- ============================================================
CREATE TABLE public.user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  wallet_number TEXT NOT NULL UNIQUE,
  balance NUMERIC NOT NULL DEFAULT 0,
  points_balance INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'SAR',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR company_id IS NOT NULL)
);

ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet"
  ON public.user_wallets FOR SELECT
  USING (auth.uid() = user_id OR company_id IN (SELECT public.get_user_company_id(auth.uid())));

CREATE POLICY "Admins can manage all wallets"
  ON public.user_wallets FOR ALL
  USING (public.is_admin_user());

-- Generate wallet number
CREATE OR REPLACE FUNCTION public.generate_wallet_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count FROM user_wallets;
  RETURN 'W' || LPAD(v_count::TEXT, 10, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_assign_wallet_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.wallet_number IS NULL OR NEW.wallet_number = '' THEN
    NEW.wallet_number := public.generate_wallet_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_wallet_number
  BEFORE INSERT ON public.user_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_assign_wallet_number();

-- ============================================================
-- 3. WALLET TRANSACTIONS TABLE
-- ============================================================
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.user_wallets(id) ON DELETE CASCADE,
  transaction_number TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'transfer', 'refund', 'points_earned', 'points_redeemed', 'fee', 'settlement')),
  amount NUMERIC NOT NULL DEFAULT 0,
  points INTEGER DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'SAR',
  balance_before NUMERIC NOT NULL DEFAULT 0,
  balance_after NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  description_ar TEXT,
  reference_type TEXT CHECK (reference_type IN ('invoice', 'order', 'competition', 'membership', 'transfer', 'manual', 'refund')),
  reference_id UUID,
  payment_method TEXT,
  payment_reference TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet transactions"
  ON public.wallet_transactions FOR SELECT
  USING (
    wallet_id IN (SELECT id FROM public.user_wallets WHERE user_id = auth.uid())
    OR wallet_id IN (SELECT id FROM public.user_wallets WHERE company_id IN (SELECT public.get_user_company_id(auth.uid())))
  );

CREATE POLICY "Admins can manage all wallet transactions"
  ON public.wallet_transactions FOR ALL
  USING (public.is_admin_user());

-- Generate wallet transaction number
CREATE OR REPLACE FUNCTION public.generate_wallet_txn_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date TEXT;
  v_count INTEGER;
BEGIN
  v_date := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO v_count FROM wallet_transactions WHERE created_at::date = CURRENT_DATE;
  RETURN 'WTX' || v_date || LPAD(v_count::TEXT, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_assign_wallet_txn_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.transaction_number IS NULL OR NEW.transaction_number = '' THEN
    NEW.transaction_number := public.generate_wallet_txn_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_wallet_txn_number
  BEFORE INSERT ON public.wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_assign_wallet_txn_number();

-- ============================================================
-- 4. TAX REPORTS TABLE
-- ============================================================
CREATE TABLE public.tax_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL CHECK (report_type IN ('vat', 'zakat', 'income_tax', 'comprehensive')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  total_expenses NUMERIC NOT NULL DEFAULT 0,
  taxable_amount NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  zakat_base NUMERIC DEFAULT 0,
  zakat_amount NUMERIC DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'SAR',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'submitted', 'archived')),
  generated_by UUID,
  company_id UUID REFERENCES public.companies(id),
  user_id UUID REFERENCES auth.users(id),
  data_snapshot JSONB,
  notes TEXT,
  notes_ar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tax_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tax reports"
  ON public.tax_reports FOR SELECT
  USING (auth.uid() = user_id OR company_id IN (SELECT public.get_user_company_id(auth.uid())));

CREATE POLICY "Admins can manage all tax reports"
  ON public.tax_reports FOR ALL
  USING (public.is_admin_user());

-- ============================================================
-- 5. ACCOUNT STATEMENTS TABLE
-- ============================================================
CREATE TABLE public.account_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.user_wallets(id) ON DELETE CASCADE,
  statement_number TEXT NOT NULL UNIQUE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  closing_balance NUMERIC NOT NULL DEFAULT 0,
  total_credits NUMERIC NOT NULL DEFAULT 0,
  total_debits NUMERIC NOT NULL DEFAULT 0,
  total_points_earned INTEGER NOT NULL DEFAULT 0,
  total_points_redeemed INTEGER NOT NULL DEFAULT 0,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.account_statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own statements"
  ON public.account_statements FOR SELECT
  USING (
    wallet_id IN (SELECT id FROM public.user_wallets WHERE user_id = auth.uid())
    OR wallet_id IN (SELECT id FROM public.user_wallets WHERE company_id IN (SELECT public.get_user_company_id(auth.uid())))
  );

CREATE POLICY "Admins can manage all statements"
  ON public.account_statements FOR ALL
  USING (public.is_admin_user());

-- Generate statement number
CREATE OR REPLACE FUNCTION public.generate_statement_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month TEXT;
  v_count INTEGER;
BEGIN
  v_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
  SELECT COUNT(*) + 1 INTO v_count FROM account_statements WHERE TO_CHAR(created_at, 'YYYYMM') = v_month;
  RETURN 'STM' || v_month || LPAD(v_count::TEXT, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_assign_statement_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.statement_number IS NULL OR NEW.statement_number = '' THEN
    NEW.statement_number := public.generate_statement_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_statement_number
  BEFORE INSERT ON public.account_statements
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_assign_statement_number();

-- Enable pgcrypto for sha256 if not already
CREATE EXTENSION IF NOT EXISTS pgcrypto;
