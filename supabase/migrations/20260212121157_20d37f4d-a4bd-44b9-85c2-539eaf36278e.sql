
-- Add user_id foreign key to profiles
ALTER TABLE public.entity_positions
  ADD CONSTRAINT entity_positions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add unique constraint
ALTER TABLE public.entity_positions
  ADD CONSTRAINT entity_positions_entity_user_position_unique UNIQUE (entity_id, user_id, position_type);
