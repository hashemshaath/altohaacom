
-- Fix start_membership_trial to use correct column names
CREATE OR REPLACE FUNCTION public.start_membership_trial(
  p_user_id UUID,
  p_tier TEXT DEFAULT 'professional',
  p_duration_days INTEGER DEFAULT 14
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_tier TEXT;
  v_existing_trial TEXT;
  v_trial_expired BOOLEAN;
  v_ends_at TIMESTAMPTZ;
BEGIN
  SELECT membership_tier, trial_tier, trial_expired
  INTO v_current_tier, v_existing_trial, v_trial_expired
  FROM profiles WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  IF v_current_tier = p_tier OR v_current_tier = 'enterprise' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already on this tier or higher');
  END IF;

  IF v_current_tier = 'professional' AND p_tier = 'professional' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already on professional tier');
  END IF;

  IF v_existing_trial = p_tier AND v_trial_expired = true THEN
    RETURN jsonb_build_object('success', false, 'error', 'Trial already used for this tier');
  END IF;

  IF v_existing_trial IS NOT NULL AND v_trial_expired = false THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already in an active trial');
  END IF;

  v_ends_at := now() + (p_duration_days || ' days')::INTERVAL;

  UPDATE profiles
  SET membership_tier = p_tier,
      trial_tier = p_tier,
      trial_started_at = now(),
      trial_ends_at = v_ends_at,
      trial_expired = false,
      updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO membership_history (user_id, previous_tier, new_tier, reason)
  VALUES (p_user_id, v_current_tier, p_tier, 'Free ' || p_duration_days || '-day trial started');

  INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link)
  VALUES (
    p_user_id,
    '🎉 Your ' || initcap(p_tier) || ' trial has started!',
    '🎉 بدأت تجربتك المجانية لـ ' || p_tier || '!',
    'Enjoy ' || p_duration_days || ' days of ' || initcap(p_tier) || ' features.',
    'استمتع بـ ' || p_duration_days || ' يوماً من ميزات ' || p_tier || '.',
    'membership_trial',
    '/membership'
  );

  RETURN jsonb_build_object('success', true, 'tier', p_tier, 'ends_at', v_ends_at);
END;
$$;

-- Fix expire_membership_trials to use correct column names
CREATE OR REPLACE FUNCTION public.expire_membership_trials()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER := 0;
  v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT user_id, trial_tier, membership_tier
    FROM profiles
    WHERE trial_expired = false
      AND trial_ends_at IS NOT NULL
      AND trial_ends_at <= now()
      AND trial_tier IS NOT NULL
  LOOP
    UPDATE profiles
    SET membership_tier = 'basic',
        trial_expired = true,
        updated_at = now()
    WHERE user_id = v_rec.user_id;

    INSERT INTO membership_history (user_id, previous_tier, new_tier, reason)
    VALUES (v_rec.user_id, v_rec.trial_tier, 'basic', 'Free trial expired — auto-downgraded');

    INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link)
    VALUES (
      v_rec.user_id,
      '⏰ Your ' || initcap(v_rec.trial_tier) || ' trial has ended',
      '⏰ انتهت تجربتك المجانية لـ ' || v_rec.trial_tier,
      'Upgrade now to keep your ' || initcap(v_rec.trial_tier) || ' features!',
      'قم بالترقية الآن للحفاظ على ميزات ' || v_rec.trial_tier || '!',
      'trial_expired',
      '/membership'
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;
