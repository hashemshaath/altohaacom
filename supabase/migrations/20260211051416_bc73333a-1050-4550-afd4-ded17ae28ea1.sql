
-- Verification requests table
CREATE TABLE public.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  culinary_entity_id UUID REFERENCES public.culinary_entities(id) ON DELETE CASCADE,
  
  entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'company', 'culinary_entity')),
  verification_level TEXT NOT NULL DEFAULT 'basic' CHECK (verification_level IN ('basic', 'identity', 'professional', 'organization')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'ai_review', 'approved', 'rejected', 'revoked', 'expired')),
  
  applicant_name TEXT NOT NULL,
  applicant_name_ar TEXT,
  applicant_role TEXT,
  applicant_position TEXT,
  applicant_position_ar TEXT,
  
  documents JSONB DEFAULT '[]'::jsonb,
  
  ai_analysis JSONB,
  ai_risk_score DECIMAL(3,2) CHECK (ai_risk_score >= 0 AND ai_risk_score <= 1),
  ai_flags TEXT[],
  ai_reviewed_at TIMESTAMPTZ,
  
  reviewed_by UUID REFERENCES auth.users(id),
  reviewer_notes TEXT,
  reviewer_notes_ar TEXT,
  reviewed_at TIMESTAMPTZ,
  
  rejection_reason TEXT,
  rejection_reason_ar TEXT,
  revoked_reason TEXT,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),
  
  expires_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  submission_metadata JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT chk_one_entity CHECK (
    (user_id IS NOT NULL AND company_id IS NULL AND culinary_entity_id IS NULL) OR
    (user_id IS NULL AND company_id IS NOT NULL AND culinary_entity_id IS NULL) OR
    (user_id IS NULL AND company_id IS NULL AND culinary_entity_id IS NOT NULL)
  )
);

-- Verification documents
CREATE TABLE public.verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.verification_requests(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'national_id', 'passport', 'driving_license', 'business_license',
    'trade_registration', 'tax_certificate', 'professional_certificate',
    'association_membership', 'accreditation', 'utility_bill',
    'bank_statement', 'selfie', 'video_verification', 'other'
  )),
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  
  ai_document_valid BOOLEAN,
  ai_document_type_match BOOLEAN,
  ai_extracted_data JSONB,
  ai_confidence DECIMAL(3,2),
  ai_flags TEXT[],
  
  manually_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Verification audit log
CREATE TABLE public.verification_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.verification_requests(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  action_by UUID REFERENCES auth.users(id),
  action_by_system BOOLEAN DEFAULT false,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add verified columns to profiles, companies, culinary_entities
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_level TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_badge TEXT;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_level TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

ALTER TABLE public.culinary_entities
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_level TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- RLS
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own verification" ON public.verification_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own verification" ON public.verification_requests FOR INSERT WITH CHECK (auth.uid() = user_id AND entity_type = 'user');
CREATE POLICY "Company contacts view company verification" ON public.verification_requests FOR SELECT USING (company_id IN (SELECT public.get_user_company_id(auth.uid())));
CREATE POLICY "Company contacts create company verification" ON public.verification_requests FOR INSERT WITH CHECK (company_id IN (SELECT public.get_user_company_id(auth.uid())) AND entity_type = 'company');
CREATE POLICY "Admins view all verifications" ON public.verification_requests FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins update verifications" ON public.verification_requests FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Users view own docs" ON public.verification_documents FOR SELECT USING (request_id IN (SELECT id FROM public.verification_requests WHERE user_id = auth.uid()));
CREATE POLICY "Users upload docs" ON public.verification_documents FOR INSERT WITH CHECK (request_id IN (SELECT id FROM public.verification_requests WHERE user_id = auth.uid()));
CREATE POLICY "Company contacts view docs" ON public.verification_documents FOR SELECT USING (request_id IN (SELECT id FROM public.verification_requests WHERE company_id IN (SELECT public.get_user_company_id(auth.uid()))));
CREATE POLICY "Admins manage docs" ON public.verification_documents FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins view audit" ON public.verification_audit_log FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Insert audit" ON public.verification_audit_log FOR INSERT WITH CHECK (true);

-- Private storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-documents', 'verification-documents', false) ON CONFLICT DO NOTHING;
CREATE POLICY "Upload verification docs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'verification-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "View own verification docs" ON storage.objects FOR SELECT USING (bucket_id = 'verification-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins view verification docs" ON storage.objects FOR SELECT USING (bucket_id = 'verification-documents' AND public.is_admin(auth.uid()));

CREATE TRIGGER update_verification_requests_updated_at BEFORE UPDATE ON public.verification_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_vr_user ON public.verification_requests(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_vr_company ON public.verification_requests(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_vr_entity ON public.verification_requests(culinary_entity_id) WHERE culinary_entity_id IS NOT NULL;
CREATE INDEX idx_vr_status ON public.verification_requests(status);
CREATE INDEX idx_vd_request ON public.verification_documents(request_id);
