
-- Add visibility column to certificates for profile display control
-- Options: 'public' (visible to all), 'followers' (visible to followers), 'private' (only visible to recipient)
ALTER TABLE public.certificates 
ADD COLUMN visibility text NOT NULL DEFAULT 'public';

-- Add comment for documentation
COMMENT ON COLUMN public.certificates.visibility IS 'Controls who can see this certificate on the recipient profile: public, followers, private';
