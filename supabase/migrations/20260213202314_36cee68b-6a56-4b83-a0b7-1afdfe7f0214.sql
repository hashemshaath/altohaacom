
-- Auto-create membership card when a profile is created
CREATE OR REPLACE FUNCTION public.auto_create_membership_card()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.membership_cards (user_id, membership_number, verification_code, is_trial, trial_ends_at)
  VALUES (
    NEW.user_id,
    public.generate_membership_number(),
    public.generate_membership_verification(),
    true,
    NOW() + INTERVAL '90 days'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Auto-create wallet when a profile is created
CREATE OR REPLACE FUNCTION public.auto_create_user_wallet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_wallets (user_id, wallet_number)
  VALUES (
    NEW.user_id,
    public.generate_wallet_number()
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create triggers on profiles table
CREATE TRIGGER trg_auto_membership_card
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_membership_card();

CREATE TRIGGER trg_auto_user_wallet
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_user_wallet();
