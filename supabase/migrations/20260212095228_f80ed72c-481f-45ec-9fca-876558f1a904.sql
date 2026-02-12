-- Create table for system-approved global awards with logos
CREATE TABLE public.global_awards_system (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  logo_url TEXT,
  award_type TEXT NOT NULL DEFAULT 'certification', -- 'certification', 'rating', 'honor'
  category TEXT, -- 'michelin', 'tabakh', 'international', 'regional', etc.
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(name)
);

-- Create table for user's global awards (linked to system awards)
CREATE TABLE public.user_global_awards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  award_id UUID NOT NULL REFERENCES public.global_awards_system(id),
  level TEXT, -- 'one_star', 'two_stars', 'three_stars', 'gold', 'silver', 'bronze', etc.
  year_awarded INTEGER,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(user_id, award_id, level)
);

-- Enable RLS
ALTER TABLE public.global_awards_system ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_global_awards ENABLE ROW LEVEL SECURITY;

-- Policies for global_awards_system (public read, admin write)
CREATE POLICY "System awards are viewable by everyone"
  ON public.global_awards_system FOR SELECT USING (true);

-- Policies for user_global_awards
CREATE POLICY "Users can view their own global awards"
  ON public.user_global_awards FOR SELECT 
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert their own global awards"
  ON public.user_global_awards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own global awards"
  ON public.user_global_awards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own global awards"
  ON public.user_global_awards FOR DELETE
  USING (auth.uid() = user_id);

-- Insert some predefined system awards
INSERT INTO public.global_awards_system (name, name_ar, description, description_ar, category, award_type, logo_url, sort_order) VALUES
  ('Michelin Star', 'نجمة ميشلان', 'Michelin Guide star recognition for culinary excellence', 'اعتراف نجمة ميشلان بالتميز الطهوي', 'michelin', 'certification', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Michelin_Guide_2009_logo.svg/1200px-Michelin_Guide_2009_logo.svg.png', 1),
  ('Tabakh Star', 'نجمة طابخ', 'Tabakh Star award for culinary achievement in Gulf region', 'جائزة نجمة طابخ للتميز الطهوي بمنطقة الخليج', 'tabakh', 'certification', 'https://images.unsplash.com/photo-1551632786-4e2b3b63b504?w=200&h=200&fit=crop', 2),
  ('World Association of Chefs Societies Member', 'عضو جمعية الطهاة العالمية', 'WACS international recognition', 'اعتراف دولي من جمعية الطهاة العالمية', 'international', 'honor', 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=200&h=200&fit=crop', 3),
  ('Award of Excellence', 'جائزة التميز', 'International culinary excellence award', 'جائزة التميز الطهوي الدولية', 'international', 'honor', 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=200&h=200&fit=crop', 4);