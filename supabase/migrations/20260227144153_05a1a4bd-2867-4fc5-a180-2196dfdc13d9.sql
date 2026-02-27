-- Trigger: when a user upgrades membership, check if they were referred and award bonus points
CREATE OR REPLACE FUNCTION public.award_referral_upgrade_bonus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_code_id UUID;
  v_new_tier TEXT;
  v_prev_tier TEXT;
  v_upgrade_points_referrer INTEGER;
  v_upgrade_points_referred INTEGER;
  v_user_name TEXT;
BEGIN
  v_new_tier := NEW.membership_tier::TEXT;
  v_prev_tier := COALESCE(OLD.membership_tier::TEXT, 'basic');

  -- Only trigger on actual upgrades (not downgrades or same tier)
  IF v_new_tier = v_prev_tier THEN RETURN NEW; END IF;
  IF v_new_tier = 'basic' THEN RETURN NEW; END IF;
  
  -- Check tier ordering: basic < professional < enterprise
  IF v_prev_tier = 'enterprise' THEN RETURN NEW; END IF;
  IF v_prev_tier = 'professional' AND v_new_tier != 'enterprise' THEN RETURN NEW; END IF;

  -- Find if this user was referred
  SELECT rc.user_id, rc.id INTO v_referrer_id, v_referral_code_id
  FROM referral_conversions conv
  JOIN referral_codes rc ON rc.id = conv.referral_code_id
  WHERE conv.referred_user_id = NEW.user_id
    AND conv.conversion_type = 'signup'
  LIMIT 1;

  IF v_referrer_id IS NULL THEN RETURN NEW; END IF;

  -- Don't double-award for same upgrade
  IF EXISTS (
    SELECT 1 FROM referral_conversions
    WHERE referred_user_id = NEW.user_id
      AND conversion_type = 'membership_upgrade'
      AND (metadata->>'new_tier') = v_new_tier
  ) THEN RETURN NEW; END IF;

  -- Calculate points based on tier
  IF v_new_tier = 'professional' THEN
    v_upgrade_points_referrer := 500;
    v_upgrade_points_referred := 200;
  ELSIF v_new_tier = 'enterprise' THEN
    v_upgrade_points_referrer := 1000;
    v_upgrade_points_referred := 500;
  ELSE
    v_upgrade_points_referrer := 250;
    v_upgrade_points_referred := 100;
  END IF;

  SELECT COALESCE(full_name, username, 'A user') INTO v_user_name
  FROM profiles WHERE user_id = NEW.user_id;

  -- Record the upgrade conversion
  INSERT INTO referral_conversions (
    referral_code_id, referrer_id, referred_user_id,
    conversion_type, points_awarded_referrer, points_awarded_referred,
    metadata
  ) VALUES (
    v_referral_code_id, v_referrer_id, NEW.user_id,
    'membership_upgrade', v_upgrade_points_referrer, v_upgrade_points_referred,
    jsonb_build_object('new_tier', v_new_tier, 'previous_tier', v_prev_tier)
  );

  -- Award points to referrer
  PERFORM public.award_points(
    v_referrer_id,
    'referral_upgrade_bonus',
    v_upgrade_points_referrer,
    v_user_name || ' upgraded to ' || v_new_tier || ' — referral bonus!',
    v_user_name || ' ترقّى إلى ' || v_new_tier || ' — مكافأة إحالة!',
    'referral', v_referral_code_id
  );

  -- Award points to the upgrading user
  PERFORM public.award_points(
    NEW.user_id,
    'referral_upgrade_reward',
    v_upgrade_points_referred,
    'Upgrade bonus — you were referred!',
    'مكافأة الترقية — تمت إحالتك!',
    'referral', v_referral_code_id
  );

  -- Update referral code stats
  UPDATE referral_codes
  SET total_points_earned = COALESCE(total_points_earned, 0) + v_upgrade_points_referrer,
      total_conversions = COALESCE(total_conversions, 0) + 1,
      updated_at = now()
  WHERE id = v_referral_code_id;

  -- Notify referrer
  INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
  VALUES (
    v_referrer_id,
    '🎉 ' || v_user_name || ' upgraded — you earned ' || v_upgrade_points_referrer || ' points!',
    '🎉 ' || v_user_name || ' ترقّى — ربحت ' || v_upgrade_points_referrer || ' نقطة!',
    'Your referral upgraded to ' || v_new_tier || '. Keep referring!',
    'إحالتك ترقّت إلى ' || v_new_tier || '. استمر في الإحالة!',
    'referral_upgrade',
    '/profile?tab=referrals',
    jsonb_build_object('referred_user_id', NEW.user_id, 'new_tier', v_new_tier, 'points', v_upgrade_points_referrer)
  );

  RETURN NEW;
END;
$$;

-- Attach trigger to profiles table on membership_tier change
CREATE TRIGGER trg_referral_upgrade_bonus
AFTER UPDATE OF membership_tier ON public.profiles
FOR EACH ROW
WHEN (OLD.membership_tier IS DISTINCT FROM NEW.membership_tier)
EXECUTE FUNCTION public.award_referral_upgrade_bonus();
