-- Company type enum
CREATE TYPE public.company_type AS ENUM ('sponsor', 'supplier', 'partner', 'vendor');

-- Company status enum
CREATE TYPE public.company_status AS ENUM ('active', 'inactive', 'pending', 'suspended');

-- Order status enum
CREATE TYPE public.order_status AS ENUM ('draft', 'pending', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled');

-- Order direction enum
CREATE TYPE public.order_direction AS ENUM ('outgoing', 'incoming');

-- Order category enum
CREATE TYPE public.order_category AS ENUM ('promotional', 'equipment', 'materials', 'services', 'catering', 'venue', 'transport', 'other');

-- Invitation status enum
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');

-- Transaction type enum
CREATE TYPE public.transaction_type AS ENUM ('invoice', 'payment', 'credit', 'debit', 'refund', 'adjustment');

-- Companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Basic info
  name TEXT NOT NULL,
  name_ar TEXT,
  type company_type NOT NULL,
  status company_status DEFAULT 'pending',
  registration_number TEXT,
  tax_number TEXT,
  -- Contact info
  email TEXT,
  phone TEXT,
  website TEXT,
  -- Address
  address TEXT,
  address_ar TEXT,
  city TEXT,
  country TEXT,
  postal_code TEXT,
  -- Description
  description TEXT,
  description_ar TEXT,
  -- Branding
  logo_url TEXT,
  cover_image_url TEXT,
  -- Working hours
  working_hours JSONB DEFAULT '{}',
  -- Classifications
  classifications TEXT[] DEFAULT '{}',
  -- Settings
  credit_limit DECIMAL(12,2) DEFAULT 0,
  payment_terms INTEGER DEFAULT 30, -- days
  currency TEXT DEFAULT 'SAR',
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Company contacts table
CREATE TABLE public.company_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  -- Contact type
  department TEXT NOT NULL, -- management, marketing, procurement, relations, operations
  is_primary BOOLEAN DEFAULT false,
  -- Personal info
  name TEXT NOT NULL,
  name_ar TEXT,
  title TEXT,
  title_ar TEXT,
  -- Contact details
  email TEXT,
  phone TEXT,
  mobile TEXT,
  whatsapp TEXT,
  -- Can login
  user_id UUID REFERENCES auth.users(id),
  can_login BOOLEAN DEFAULT false,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Company branches table
CREATE TABLE public.company_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  -- Branch info
  name TEXT NOT NULL,
  name_ar TEXT,
  is_headquarters BOOLEAN DEFAULT false,
  -- Address
  address TEXT,
  address_ar TEXT,
  city TEXT,
  country TEXT,
  postal_code TEXT,
  coordinates POINT,
  -- Contact
  phone TEXT,
  email TEXT,
  -- Manager
  manager_name TEXT,
  manager_phone TEXT,
  manager_email TEXT,
  -- Working hours
  working_hours JSONB DEFAULT '{}',
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Company drivers (temporary for orders)
CREATE TABLE public.company_drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES company_branches(id),
  -- Driver info
  name TEXT NOT NULL,
  name_ar TEXT,
  phone TEXT NOT NULL,
  vehicle_type TEXT,
  vehicle_plate TEXT,
  license_number TEXT,
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Orders table
CREATE TABLE public.company_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  -- Order type
  direction order_direction NOT NULL,
  category order_category NOT NULL,
  -- Related entities
  competition_id UUID REFERENCES competitions(id),
  branch_id UUID REFERENCES company_branches(id),
  driver_id UUID REFERENCES company_drivers(id),
  -- Order details
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  -- Items (JSONB for flexibility)
  items JSONB DEFAULT '[]',
  -- Financials
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'SAR',
  -- Dates
  order_date DATE DEFAULT CURRENT_DATE,
  delivery_date DATE,
  due_date DATE,
  -- Status workflow
  status order_status DEFAULT 'draft',
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  rejected_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  completed_at TIMESTAMPTZ,
  -- Communication
  notes TEXT,
  internal_notes TEXT,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Order communications
CREATE TABLE public.order_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES company_orders(id) ON DELETE CASCADE NOT NULL,
  -- Message
  message TEXT NOT NULL,
  message_ar TEXT,
  -- Sender
  sender_id UUID REFERENCES auth.users(id),
  sender_type TEXT NOT NULL, -- 'admin' or 'company'
  -- Attachments
  attachments JSONB DEFAULT '[]',
  -- Read status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Company invitations (for events/competitions)
CREATE TABLE public.company_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  competition_id UUID REFERENCES competitions(id),
  -- Invitation details
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  invitation_type TEXT NOT NULL, -- 'sponsorship', 'participation', 'partnership'
  -- Status
  status invitation_status DEFAULT 'pending',
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES auth.users(id),
  response_notes TEXT,
  -- Dates
  expires_at TIMESTAMPTZ,
  event_date DATE,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Company transactions (account statements)
CREATE TABLE public.company_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES company_orders(id),
  invoice_id UUID REFERENCES invoices(id),
  -- Transaction details
  transaction_number TEXT NOT NULL UNIQUE,
  type transaction_type NOT NULL,
  -- Amount
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'SAR',
  -- Balance tracking
  balance_before DECIMAL(12,2),
  balance_after DECIMAL(12,2),
  -- Details
  description TEXT,
  description_ar TEXT,
  reference TEXT,
  -- Payment details
  payment_method TEXT,
  payment_reference TEXT,
  -- Status
  is_reconciled BOOLEAN DEFAULT false,
  reconciled_at TIMESTAMPTZ,
  reconciled_by UUID REFERENCES auth.users(id),
  -- Metadata
  transaction_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Company evaluations
CREATE TABLE public.company_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  competition_id UUID REFERENCES competitions(id),
  order_id UUID REFERENCES company_orders(id),
  -- Ratings (1-5)
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  delivery_rating INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  overall_rating DECIMAL(3,2),
  -- Review
  review TEXT,
  review_ar TEXT,
  -- Visibility
  is_public BOOLEAN DEFAULT false,
  -- Metadata
  evaluated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Company media library
CREATE TABLE public.company_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  -- File info
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  -- Categorization
  category TEXT NOT NULL, -- 'logo', 'photo', 'document', 'certificate', 'license'
  -- Metadata
  title TEXT,
  title_ar TEXT,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  -- Ordering
  sort_order INTEGER DEFAULT 0,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id)
);

-- Company materials/equipment catalog
CREATE TABLE public.company_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  -- Item details
  name TEXT NOT NULL,
  name_ar TEXT,
  sku TEXT,
  category TEXT NOT NULL, -- 'equipment', 'material', 'service'
  subcategory TEXT,
  -- Description
  description TEXT,
  description_ar TEXT,
  -- Pricing
  unit_price DECIMAL(12,2),
  currency TEXT DEFAULT 'SAR',
  unit TEXT, -- 'piece', 'kg', 'hour', 'day'
  -- Stock
  in_stock BOOLEAN DEFAULT true,
  quantity_available INTEGER,
  -- Media
  image_url TEXT,
  -- Status
  is_active BOOLEAN DEFAULT true,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_catalog ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Companies: Admins can manage all, company contacts can view their own
CREATE POLICY "Admins can manage companies" ON public.companies FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Company contacts can view their company" ON public.companies FOR SELECT 
USING (id IN (SELECT company_id FROM company_contacts WHERE user_id = auth.uid()));

-- Company contacts
CREATE POLICY "Admins can manage contacts" ON public.company_contacts FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Users can view their company contacts" ON public.company_contacts FOR SELECT 
USING (company_id IN (SELECT company_id FROM company_contacts WHERE user_id = auth.uid()));

-- Branches
CREATE POLICY "Admins can manage branches" ON public.company_branches FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Company users can view branches" ON public.company_branches FOR SELECT 
USING (company_id IN (SELECT company_id FROM company_contacts WHERE user_id = auth.uid()));

-- Drivers
CREATE POLICY "Admins can manage drivers" ON public.company_drivers FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Company users can view drivers" ON public.company_drivers FOR SELECT 
USING (company_id IN (SELECT company_id FROM company_contacts WHERE user_id = auth.uid()));

-- Orders
CREATE POLICY "Admins can manage orders" ON public.company_orders FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Company users can view their orders" ON public.company_orders FOR SELECT 
USING (company_id IN (SELECT company_id FROM company_contacts WHERE user_id = auth.uid()));
CREATE POLICY "Company users can create incoming orders" ON public.company_orders FOR INSERT 
WITH CHECK (company_id IN (SELECT company_id FROM company_contacts WHERE user_id = auth.uid()) AND direction = 'incoming');
CREATE POLICY "Company users can update draft orders" ON public.company_orders FOR UPDATE 
USING (company_id IN (SELECT company_id FROM company_contacts WHERE user_id = auth.uid()) AND status = 'draft');

-- Communications
CREATE POLICY "Admins can manage communications" ON public.order_communications FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Company users can view order communications" ON public.order_communications FOR SELECT 
USING (order_id IN (SELECT id FROM company_orders WHERE company_id IN (SELECT company_id FROM company_contacts WHERE user_id = auth.uid())));
CREATE POLICY "Company users can send messages" ON public.order_communications FOR INSERT 
WITH CHECK (order_id IN (SELECT id FROM company_orders WHERE company_id IN (SELECT company_id FROM company_contacts WHERE user_id = auth.uid())));

-- Invitations
CREATE POLICY "Admins can manage invitations" ON public.company_invitations FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Company users can view invitations" ON public.company_invitations FOR SELECT 
USING (company_id IN (SELECT company_id FROM company_contacts WHERE user_id = auth.uid()));
CREATE POLICY "Company users can respond to invitations" ON public.company_invitations FOR UPDATE 
USING (company_id IN (SELECT company_id FROM company_contacts WHERE user_id = auth.uid()));

-- Transactions
CREATE POLICY "Admins can manage transactions" ON public.company_transactions FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Company users can view transactions" ON public.company_transactions FOR SELECT 
USING (company_id IN (SELECT company_id FROM company_contacts WHERE user_id = auth.uid()));

-- Evaluations
CREATE POLICY "Admins can manage evaluations" ON public.company_evaluations FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Company users can view their evaluations" ON public.company_evaluations FOR SELECT 
USING (company_id IN (SELECT company_id FROM company_contacts WHERE user_id = auth.uid()));

-- Media
CREATE POLICY "Admins can manage media" ON public.company_media FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Company users can manage their media" ON public.company_media FOR ALL 
USING (company_id IN (SELECT company_id FROM company_contacts WHERE user_id = auth.uid()));
CREATE POLICY "Public media is viewable" ON public.company_media FOR SELECT USING (is_public = true);

-- Catalog
CREATE POLICY "Admins can manage catalog" ON public.company_catalog FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Company users can manage catalog" ON public.company_catalog FOR ALL 
USING (company_id IN (SELECT company_id FROM company_contacts WHERE user_id = auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_contacts_updated_at BEFORE UPDATE ON public.company_contacts 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_orders_updated_at BEFORE UPDATE ON public.company_orders 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_catalog_updated_at BEFORE UPDATE ON public.company_catalog 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year INTEGER;
  v_count INTEGER;
BEGIN
  v_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  SELECT COUNT(*) + 1 INTO v_count
  FROM company_orders
  WHERE EXTRACT(YEAR FROM created_at) = v_year;
  
  RETURN 'ORD-' || v_year || '-' || LPAD(v_count::TEXT, 5, '0');
END;
$$;

-- Function to generate transaction number
CREATE OR REPLACE FUNCTION public.generate_transaction_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year INTEGER;
  v_count INTEGER;
BEGIN
  v_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  SELECT COUNT(*) + 1 INTO v_count
  FROM company_transactions
  WHERE EXTRACT(YEAR FROM created_at) = v_year;
  
  RETURN 'TXN-' || v_year || '-' || LPAD(v_count::TEXT, 6, '0');
END;
$$;

-- Function to calculate company balance
CREATE OR REPLACE FUNCTION public.get_company_balance(p_company_id UUID)
RETURNS DECIMAL
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance DECIMAL;
BEGIN
  SELECT COALESCE(SUM(
    CASE 
      WHEN type IN ('payment', 'credit') THEN amount
      WHEN type IN ('invoice', 'debit') THEN -amount
      WHEN type = 'refund' THEN amount
      WHEN type = 'adjustment' THEN amount
      ELSE 0
    END
  ), 0) INTO v_balance
  FROM company_transactions
  WHERE company_id = p_company_id;
  
  RETURN v_balance;
END;
$$;