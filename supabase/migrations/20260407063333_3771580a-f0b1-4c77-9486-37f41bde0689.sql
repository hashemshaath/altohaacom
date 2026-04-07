-- Fix 1: membership_gifts - remove blanket public SELECT
DROP POLICY IF EXISTS "Anyone can view gift by code" ON public.membership_gifts;

-- Fix 2: password_recovery_tokens - remove client SELECT access
DROP POLICY IF EXISTS "Users can view own recovery tokens" ON public.password_recovery_tokens;

-- Fix 3: phone_verifications - remove client SELECT of OTP codes
DROP POLICY IF EXISTS "Users can view own phone verification" ON public.phone_verifications;

-- Fix 4: email_verifications - remove client SELECT of verification codes
DROP POLICY IF EXISTS "Users can view own email verification" ON public.email_verifications;