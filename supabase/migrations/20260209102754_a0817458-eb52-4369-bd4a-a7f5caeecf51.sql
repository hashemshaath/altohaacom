-- Add company_id and company_role to profiles table for company portal support
ALTER TABLE public.profiles ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN company_role TEXT DEFAULT 'member';

-- Create indexes for company queries
CREATE INDEX idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX idx_company_contacts_user_id ON public.company_contacts(user_id);