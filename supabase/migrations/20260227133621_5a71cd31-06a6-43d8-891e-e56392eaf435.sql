-- Add missing membership_started_at column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS membership_started_at timestamptz;