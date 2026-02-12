
-- Reset all sequences to start from 1
ALTER SEQUENCE IF EXISTS public.entity_number_seq RESTART WITH 1;

-- Reset account sequences table
TRUNCATE TABLE public.account_sequences RESTART IDENTITY CASCADE;

-- Re-insert default sequences for all roles
INSERT INTO public.account_sequences (role, last_number) 
VALUES 
  ('chef', 0),
  ('judge', 0),
  ('organizer', 0),
  ('supervisor', 0);
