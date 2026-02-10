
-- Establishments registry (restaurants, hotels, food establishments)
CREATE TABLE public.establishments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  type TEXT NOT NULL DEFAULT 'restaurant' CHECK (type IN ('restaurant', 'hotel', 'cafe', 'catering', 'bakery', 'food_truck', 'training_center', 'other')),
  description TEXT,
  description_ar TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  country_code CHAR(2),
  city TEXT,
  city_ar TEXT,
  address TEXT,
  address_ar TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  cuisine_type TEXT,
  cuisine_type_ar TEXT,
  star_rating INTEGER CHECK (star_rating BETWEEN 1 AND 5),
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chef-establishment associations (work history, training, etc.)
CREATE TABLE public.chef_establishment_associations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  association_type TEXT NOT NULL DEFAULT 'employment' CHECK (association_type IN ('employment', 'training', 'internship', 'consulting', 'ownership', 'freelance')),
  role_title TEXT,
  role_title_ar TEXT,
  department TEXT,
  department_ar TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  description_ar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Qualifications obtained at establishments
CREATE TABLE public.chef_establishment_qualifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  association_id UUID NOT NULL REFERENCES public.chef_establishment_associations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  qualification_name TEXT NOT NULL,
  qualification_name_ar TEXT,
  qualification_type TEXT DEFAULT 'certificate' CHECK (qualification_type IN ('certificate', 'diploma', 'license', 'award', 'training_completion', 'other')),
  issued_date DATE,
  expiry_date DATE,
  credential_id TEXT,
  description TEXT,
  description_ar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chef_establishment_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chef_establishment_qualifications ENABLE ROW LEVEL SECURITY;

-- Establishments: public read, authenticated create, owner/admin update
CREATE POLICY "Anyone can view active establishments" ON public.establishments
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can create establishments" ON public.establishments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creators can update their establishments" ON public.establishments
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage all establishments" ON public.establishments
  FOR ALL USING (public.is_admin(auth.uid()));

-- Associations: own data + public read
CREATE POLICY "Anyone can view associations" ON public.chef_establishment_associations
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own associations" ON public.chef_establishment_associations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own associations" ON public.chef_establishment_associations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own associations" ON public.chef_establishment_associations
  FOR DELETE USING (auth.uid() = user_id);

-- Qualifications: own data + public read
CREATE POLICY "Anyone can view qualifications" ON public.chef_establishment_qualifications
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own qualifications" ON public.chef_establishment_qualifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own qualifications" ON public.chef_establishment_qualifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own qualifications" ON public.chef_establishment_qualifications
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_establishments_country ON public.establishments(country_code);
CREATE INDEX idx_establishments_type ON public.establishments(type);
CREATE INDEX idx_chef_assoc_user ON public.chef_establishment_associations(user_id);
CREATE INDEX idx_chef_assoc_establishment ON public.chef_establishment_associations(establishment_id);
CREATE INDEX idx_chef_qual_user ON public.chef_establishment_qualifications(user_id);

-- Triggers
CREATE TRIGGER update_establishments_updated_at
  BEFORE UPDATE ON public.establishments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chef_assoc_updated_at
  BEFORE UPDATE ON public.chef_establishment_associations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
