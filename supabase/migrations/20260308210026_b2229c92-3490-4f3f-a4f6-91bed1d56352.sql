
-- Atomic function to deduct points for reward redemptions
CREATE OR REPLACE FUNCTION public.redeem_points(
  p_user_id UUID,
  p_points INTEGER,
  p_description TEXT DEFAULT NULL,
  p_description_ar TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT COALESCE(points_balance, 0) INTO v_current_balance
  FROM user_wallets WHERE user_id = p_user_id FOR UPDATE;

  IF v_current_balance < p_points THEN
    RAISE EXCEPTION 'Insufficient points: have %, need %', v_current_balance, p_points;
  END IF;

  v_new_balance := v_current_balance - p_points;

  -- Update wallet
  UPDATE user_wallets SET points_balance = v_new_balance, updated_at = now()
  WHERE user_id = p_user_id;

  -- Sync profile
  UPDATE profiles SET loyalty_points = v_new_balance
  WHERE user_id = p_user_id;

  -- Ledger entry
  INSERT INTO points_ledger (user_id, action_type, points, balance_after, description, description_ar, reference_type, reference_id)
  VALUES (p_user_id, 'redemption', -p_points, v_new_balance, p_description, p_description_ar, p_reference_type, p_reference_id);

  RETURN v_new_balance;
END;
$$;

-- Atomic function to credit wallet balance (for membership prorated credits etc.)
CREATE OR REPLACE FUNCTION public.wallet_credit(
  p_user_id UUID,
  p_amount NUMERIC,
  p_currency TEXT DEFAULT 'SAR',
  p_description TEXT DEFAULT NULL,
  p_description_ar TEXT DEFAULT NULL
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id UUID;
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  SELECT id, COALESCE(balance, 0) INTO v_wallet_id, v_current_balance
  FROM user_wallets WHERE user_id = p_user_id FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for user %', p_user_id;
  END IF;

  v_new_balance := v_current_balance + p_amount;

  UPDATE user_wallets SET balance = v_new_balance, updated_at = now()
  WHERE id = v_wallet_id;

  INSERT INTO wallet_transactions (wallet_id, transaction_number, type, amount, currency, description, description_ar, status)
  VALUES (v_wallet_id, '', 'credit', p_amount, p_currency, p_description, p_description_ar, 'completed');

  RETURN v_new_balance;
END;
$$;
