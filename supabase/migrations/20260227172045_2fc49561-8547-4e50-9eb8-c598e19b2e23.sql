
-- 1. Notify user on membership tier change
CREATE OR REPLACE FUNCTION public.notify_membership_tier_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tier_labels JSONB := '{"basic":["Basic","أساسية"],"professional":["Professional","احترافية"],"enterprise":["Enterprise","مؤسسية"]}';
  v_old_label TEXT;
  v_new_label TEXT;
  v_old_label_ar TEXT;
  v_new_label_ar TEXT;
  v_is_upgrade BOOLEAN;
  v_tier_order JSONB := '{"basic":0,"professional":1,"enterprise":2}';
BEGIN
  IF OLD.membership_tier IS DISTINCT FROM NEW.membership_tier AND NEW.membership_tier IS NOT NULL THEN
    v_old_label := v_tier_labels->OLD.membership_tier->>0;
    v_new_label := v_tier_labels->NEW.membership_tier->>0;
    v_old_label_ar := v_tier_labels->OLD.membership_tier->>1;
    v_new_label_ar := v_tier_labels->NEW.membership_tier->>1;
    v_is_upgrade := (v_tier_order->>NEW.membership_tier)::INT > (v_tier_order->>COALESCE(OLD.membership_tier,'basic'))::INT;

    INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
    VALUES (
      NEW.user_id,
      CASE WHEN v_is_upgrade THEN '🎉 Upgraded to ' || v_new_label ELSE '📋 Changed to ' || v_new_label END,
      CASE WHEN v_is_upgrade THEN '🎉 تمت الترقية إلى ' || v_new_label_ar ELSE '📋 تم التغيير إلى ' || v_new_label_ar END,
      'Your membership has been changed from ' || COALESCE(v_old_label, 'None') || ' to ' || v_new_label || '.',
      'تم تغيير عضويتك من ' || COALESCE(v_old_label_ar, 'لا شيء') || ' إلى ' || v_new_label_ar || '.',
      'membership',
      '/profile?tab=membership',
      jsonb_build_object('old_tier', OLD.membership_tier, 'new_tier', NEW.membership_tier, 'is_upgrade', v_is_upgrade)
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_notify_membership_tier_change ON profiles;
CREATE TRIGGER trg_notify_membership_tier_change
AFTER UPDATE ON profiles
FOR EACH ROW
WHEN (OLD.membership_tier IS DISTINCT FROM NEW.membership_tier)
EXECUTE FUNCTION notify_membership_tier_change();

-- 2. Notify user when membership status changes (expired, suspended, active)
CREATE OR REPLACE FUNCTION public.notify_membership_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.membership_status IS DISTINCT FROM NEW.membership_status AND NEW.membership_status IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
    VALUES (
      NEW.user_id,
      CASE NEW.membership_status
        WHEN 'expired' THEN '⚠️ Membership expired'
        WHEN 'suspended' THEN '🚫 Membership suspended'
        WHEN 'active' THEN '✅ Membership activated'
        WHEN 'grace_period' THEN '⏳ Membership grace period'
        ELSE 'Membership status: ' || NEW.membership_status
      END,
      CASE NEW.membership_status
        WHEN 'expired' THEN '⚠️ انتهت العضوية'
        WHEN 'suspended' THEN '🚫 تم تعليق العضوية'
        WHEN 'active' THEN '✅ تم تفعيل العضوية'
        WHEN 'grace_period' THEN '⏳ فترة السماح للعضوية'
        ELSE 'حالة العضوية: ' || NEW.membership_status
      END,
      CASE NEW.membership_status
        WHEN 'expired' THEN 'Your membership has expired. Renew now to keep your benefits.'
        WHEN 'suspended' THEN 'Your membership has been suspended. Contact support for details.'
        WHEN 'active' THEN 'Your membership is now active. Enjoy your benefits!'
        WHEN 'grace_period' THEN 'Your membership is in a grace period. Renew soon to avoid losing benefits.'
        ELSE 'Your membership status changed to ' || NEW.membership_status
      END,
      CASE NEW.membership_status
        WHEN 'expired' THEN 'انتهت عضويتك. جدد الآن للاحتفاظ بالمزايا.'
        WHEN 'suspended' THEN 'تم تعليق عضويتك. تواصل مع الدعم للتفاصيل.'
        WHEN 'active' THEN 'عضويتك الآن نشطة. استمتع بالمزايا!'
        WHEN 'grace_period' THEN 'عضويتك في فترة السماح. جدد قريباً لتفادي فقدان المزايا.'
        ELSE 'تم تغيير حالة عضويتك إلى ' || NEW.membership_status
      END,
      'membership',
      '/profile?tab=membership',
      jsonb_build_object('old_status', OLD.membership_status, 'new_status', NEW.membership_status)
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_notify_membership_status_change ON profiles;
CREATE TRIGGER trg_notify_membership_status_change
AFTER UPDATE ON profiles
FOR EACH ROW
WHEN (OLD.membership_status IS DISTINCT FROM NEW.membership_status)
EXECUTE FUNCTION notify_membership_status_change();

-- 3. Notify when auto-renewal is toggled
CREATE OR REPLACE FUNCTION public.notify_auto_renew_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.auto_renew IS DISTINCT FROM NEW.auto_renew THEN
    INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
    VALUES (
      NEW.user_id,
      CASE WHEN NEW.auto_renew THEN '🔄 Auto-renewal enabled' ELSE '⏸️ Auto-renewal disabled' END,
      CASE WHEN NEW.auto_renew THEN '🔄 تم تفعيل التجديد التلقائي' ELSE '⏸️ تم إيقاف التجديد التلقائي' END,
      CASE WHEN NEW.auto_renew 
        THEN 'Your membership will renew automatically at the end of the billing period.'
        ELSE 'Your membership will NOT auto-renew. Remember to renew manually before it expires.'
      END,
      CASE WHEN NEW.auto_renew 
        THEN 'سيتم تجديد عضويتك تلقائياً عند نهاية فترة الفوترة.'
        ELSE 'لن يتم تجديد عضويتك تلقائياً. تذكر التجديد يدوياً قبل انتهاء الصلاحية.'
      END,
      'membership',
      '/profile?tab=membership',
      jsonb_build_object('auto_renew', NEW.auto_renew)
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_notify_auto_renew_change ON membership_cards;
CREATE TRIGGER trg_notify_auto_renew_change
AFTER UPDATE ON membership_cards
FOR EACH ROW
WHEN (OLD.auto_renew IS DISTINCT FROM NEW.auto_renew)
EXECUTE FUNCTION notify_auto_renew_change();

-- 4. Function to send expiry reminder notifications (to be called by cron)
CREATE OR REPLACE FUNCTION public.notify_membership_expiry_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_rec RECORD;
  v_days INTEGER;
BEGIN
  FOR v_rec IN
    SELECT user_id, membership_tier, membership_expires_at
    FROM profiles
    WHERE membership_status = 'active'
      AND membership_tier IN ('professional', 'enterprise')
      AND membership_expires_at IS NOT NULL
      AND membership_expires_at BETWEEN now() AND now() + INTERVAL '7 days'
  LOOP
    v_days := GREATEST(0, EXTRACT(DAY FROM v_rec.membership_expires_at - now())::INTEGER);
    
    -- Skip if already notified today for this type
    IF NOT EXISTS (
      SELECT 1 FROM notifications
      WHERE user_id = v_rec.user_id
        AND type = 'membership_expiry'
        AND created_at > now() - INTERVAL '24 hours'
    ) THEN
      INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
      VALUES (
        v_rec.user_id,
        '⏰ Membership expires in ' || v_days || ' days',
        '⏰ تنتهي العضوية خلال ' || v_days || ' يوم',
        'Your ' || v_rec.membership_tier || ' membership expires soon. Renew now to keep your benefits.',
        'عضويتك تنتهي قريباً. جدد الآن للاحتفاظ بالمزايا.',
        'membership_expiry',
        '/profile?tab=membership',
        jsonb_build_object('days_remaining', v_days, 'tier', v_rec.membership_tier, 'expires_at', v_rec.membership_expires_at)
      );
    END IF;
  END LOOP;
END;
$function$;

-- 5. Function to send trial expiry reminders (to be called by cron)
CREATE OR REPLACE FUNCTION public.notify_trial_expiry_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_rec RECORD;
  v_days INTEGER;
BEGIN
  FOR v_rec IN
    SELECT user_id, trial_tier, trial_ends_at
    FROM profiles
    WHERE trial_expired = false
      AND trial_tier IS NOT NULL
      AND trial_ends_at IS NOT NULL
      AND trial_ends_at BETWEEN now() AND now() + INTERVAL '3 days'
  LOOP
    v_days := GREATEST(0, EXTRACT(DAY FROM v_rec.trial_ends_at - now())::INTEGER);
    
    IF NOT EXISTS (
      SELECT 1 FROM notifications
      WHERE user_id = v_rec.user_id
        AND type = 'trial_expiry'
        AND created_at > now() - INTERVAL '24 hours'
    ) THEN
      INSERT INTO notifications (user_id, title, title_ar, body, body_ar, type, link, metadata)
      VALUES (
        v_rec.user_id,
        '🕐 Trial expires in ' || v_days || ' days',
        '🕐 تنتهي الفترة التجريبية خلال ' || v_days || ' يوم',
        'Your free trial ends soon. Upgrade now to keep your premium features.',
        'تنتهي فترتك التجريبية قريباً. قم بالترقية الآن للاحتفاظ بالمزايا المميزة.',
        'trial_expiry',
        '/membership',
        jsonb_build_object('days_remaining', v_days, 'trial_tier', v_rec.trial_tier, 'ends_at', v_rec.trial_ends_at)
      );
    END IF;
  END LOOP;
END;
$function$;
