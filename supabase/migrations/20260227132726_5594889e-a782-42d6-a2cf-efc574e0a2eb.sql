-- Change default account_type from 'professional' to 'fan' so new users start as followers
ALTER TABLE public.profiles ALTER COLUMN account_type SET DEFAULT 'fan'::account_type;