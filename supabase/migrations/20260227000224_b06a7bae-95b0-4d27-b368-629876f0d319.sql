
-- Create account type enum
CREATE TYPE public.account_type AS ENUM ('professional', 'fan');

-- Add account_type column to profiles with default 'professional' for existing users
ALTER TABLE public.profiles 
ADD COLUMN account_type public.account_type NOT NULL DEFAULT 'professional';
