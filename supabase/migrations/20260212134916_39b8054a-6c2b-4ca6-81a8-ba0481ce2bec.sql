
-- Table for exhibition officials (team members, roles, contacts)
CREATE TABLE public.exhibition_officials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exhibition_id UUID NOT NULL REFERENCES public.exhibitions(id) ON DELETE CASCADE,
  user_id UUID,
  full_name TEXT NOT NULL,
  full_name_ar TEXT,
  role_title TEXT NOT NULL,
  role_title_ar TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exhibition_officials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exhibition officials"
  ON public.exhibition_officials FOR SELECT USING (true);

CREATE POLICY "Admins can manage exhibition officials"
  ON public.exhibition_officials FOR ALL
  USING (public.is_admin(auth.uid()));

-- Table for exhibition documents/files (rules, guides, AI knowledge)
CREATE TABLE public.exhibition_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exhibition_id UUID NOT NULL REFERENCES public.exhibitions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  category TEXT NOT NULL DEFAULT 'general',
  is_public BOOLEAN DEFAULT true,
  feed_to_ai BOOLEAN DEFAULT false,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exhibition_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public exhibition documents"
  ON public.exhibition_documents FOR SELECT USING (is_public = true);

CREATE POLICY "Admins can manage exhibition documents"
  ON public.exhibition_documents FOR ALL
  USING (public.is_admin(auth.uid()));

-- Table for exhibition media gallery
CREATE TABLE public.exhibition_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exhibition_id UUID NOT NULL REFERENCES public.exhibitions(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT DEFAULT 'image',
  title TEXT,
  title_ar TEXT,
  category TEXT NOT NULL DEFAULT 'gallery',
  sort_order INTEGER DEFAULT 0,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exhibition_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exhibition media"
  ON public.exhibition_media FOR SELECT USING (true);

CREATE POLICY "Admins can manage exhibition media"
  ON public.exhibition_media FOR ALL
  USING (public.is_admin(auth.uid()));

-- Storage bucket for exhibition files
INSERT INTO storage.buckets (id, name, public) VALUES ('exhibition-files', 'exhibition-files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view exhibition files"
  ON storage.objects FOR SELECT USING (bucket_id = 'exhibition-files');

CREATE POLICY "Authenticated users can upload exhibition files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'exhibition-files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update exhibition files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'exhibition-files' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete exhibition files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'exhibition-files' AND auth.role() = 'authenticated');
