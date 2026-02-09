-- Add foreign key from competition_registrations.participant_id to profiles.user_id
-- This enables PostgREST joins like: select("*, profiles:participant_id(full_name, ...)")
ALTER TABLE public.competition_registrations
  ADD CONSTRAINT competition_registrations_participant_id_fkey
  FOREIGN KEY (participant_id) REFERENCES public.profiles(user_id)
  ON DELETE CASCADE;