
-- Create phone verification table for OTP flow
CREATE TABLE IF NOT EXISTS public.phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,
  locked_until TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create email verification table
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,
  locked_until TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create password recovery table
CREATE TABLE IF NOT EXISTS public.password_recovery_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL UNIQUE,
  recovery_method TEXT NOT NULL, -- 'email' or 'sms'
  contact_value TEXT NOT NULL, -- email or phone number
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 hour'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create company registration requests table
CREATE TABLE IF NOT EXISTS public.company_registration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  company_name_ar TEXT,
  company_type TEXT NOT NULL,
  country_code CHAR(2) NOT NULL,
  registration_number TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_name_ar TEXT,
  business_license_url TEXT,
  additional_documents JSONB,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Update profiles table to support login_method and secondary_email
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS login_method TEXT DEFAULT 'phone'; -- 'phone', 'email', or 'both'
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS secondary_email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_last_changed TIMESTAMP WITH TIME ZONE;

-- Enable RLS on new tables
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_recovery_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_registration_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for phone_verifications
CREATE POLICY "Users can view own phone verification" ON public.phone_verifications
  FOR SELECT USING (user_id = auth.uid() OR auth.uid() IS NULL);

CREATE POLICY "Users can create phone verification" ON public.phone_verifications
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update own phone verification" ON public.phone_verifications
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for email_verifications
CREATE POLICY "Users can view own email verification" ON public.email_verifications
  FOR SELECT USING (user_id = auth.uid() OR auth.uid() IS NULL);

CREATE POLICY "Users can create email verification" ON public.email_verifications
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update own email verification" ON public.email_verifications
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for password_recovery_tokens
CREATE POLICY "Users can view own recovery tokens" ON public.password_recovery_tokens
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create recovery tokens" ON public.password_recovery_tokens
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for company_registration_requests
CREATE POLICY "Anyone can create company registration" ON public.company_registration_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all requests" ON public.company_registration_requests
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view own requests" ON public.company_registration_requests
  FOR SELECT USING (submitted_by = auth.uid());

CREATE POLICY "Admins can update requests" ON public.company_registration_requests
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- Create trigger for updating updated_at on verification tables
CREATE TRIGGER update_phone_verifications_updated_at
  BEFORE UPDATE ON public.phone_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_verifications_updated_at
  BEFORE UPDATE ON public.email_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_phone_verifications_phone ON public.phone_verifications(phone_number);
CREATE INDEX idx_email_verifications_email ON public.email_verifications(email);
CREATE INDEX idx_password_recovery_token ON public.password_recovery_tokens(token);
CREATE INDEX idx_company_requests_status ON public.company_registration_requests(status);
