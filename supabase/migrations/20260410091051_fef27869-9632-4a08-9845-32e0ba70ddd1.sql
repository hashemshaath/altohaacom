-- 1. FIX: Remove conflicting organizers policy
DROP POLICY IF EXISTS "Organizers are publicly readable" ON public.organizers;

-- 2. FIX: membership_cards - restrict user updates to card_orientation only
DROP POLICY IF EXISTS "Users can update their own card orientation" ON public.membership_cards;

CREATE OR REPLACE FUNCTION public.update_card_orientation(p_orientation text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE membership_cards
  SET card_orientation = p_orientation, updated_at = now()
  WHERE user_id = auth.uid();
END;
$$;
