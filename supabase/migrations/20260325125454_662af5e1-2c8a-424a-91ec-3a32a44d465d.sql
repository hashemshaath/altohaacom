
-- 1. Add is_chef_visible flag to profiles (defaults false for existing users)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_chef_visible boolean NOT NULL DEFAULT false;

-- 2. Create a function to determine if a user qualifies as a visible chef
CREATE OR REPLACE FUNCTION public.is_valid_chef(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = 'chef'
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = p_user_id
      AND account_type = 'professional'
      AND membership_tier IN ('professional', 'enterprise')
      AND account_status = 'active'
  );
$$;

-- 3. Create a function to sync the is_chef_visible flag for a user
CREATE OR REPLACE FUNCTION public.sync_chef_visibility(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET is_chef_visible = public.is_valid_chef(p_user_id)
  WHERE user_id = p_user_id;
END;
$$;

-- 4. Trigger: auto-sync when profiles change (account_type, membership_tier, account_status)
CREATE OR REPLACE FUNCTION public.trg_sync_chef_visibility_on_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.account_type IS DISTINCT FROM NEW.account_type
     OR OLD.membership_tier IS DISTINCT FROM NEW.membership_tier
     OR OLD.account_status IS DISTINCT FROM NEW.account_status
     OR OLD.is_chef_visible IS DISTINCT FROM NEW.is_chef_visible THEN
    -- Recalculate (avoid infinite loop by checking computed value)
    NEW.is_chef_visible := public.is_valid_chef(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_chef_visibility_profile ON public.profiles;
CREATE TRIGGER trg_chef_visibility_profile
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.account_type IS DISTINCT FROM NEW.account_type
     OR OLD.membership_tier IS DISTINCT FROM NEW.membership_tier
     OR OLD.account_status IS DISTINCT FROM NEW.account_status)
  EXECUTE FUNCTION public.trg_sync_chef_visibility_on_profile();

-- 5. Trigger: auto-sync when user_roles change (chef role added/removed)
CREATE OR REPLACE FUNCTION public.trg_sync_chef_visibility_on_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.role = 'chef' THEN
    PERFORM public.sync_chef_visibility(NEW.user_id);
  ELSIF TG_OP = 'DELETE' AND OLD.role = 'chef' THEN
    PERFORM public.sync_chef_visibility(OLD.user_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_chef_visibility_role ON public.user_roles;
CREATE TRIGGER trg_chef_visibility_role
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sync_chef_visibility_on_role();

-- 6. Backfill: set is_chef_visible for all existing users
UPDATE public.profiles p
SET is_chef_visible = public.is_valid_chef(p.user_id);
