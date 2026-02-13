
-- Add fulfillment tracking columns to order_item_requests
ALTER TABLE public.order_item_requests
  ADD COLUMN IF NOT EXISTS assigned_vendor TEXT,
  ADD COLUMN IF NOT EXISTS assigned_vendor_ar TEXT,
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.companies(id),
  ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS delivery_deadline DATE,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_by UUID,
  ADD COLUMN IF NOT EXISTS delivery_notes TEXT,
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS fulfilled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fulfilled_by UUID;

-- Add index for delivery status queries
CREATE INDEX IF NOT EXISTS idx_order_item_requests_delivery_status ON public.order_item_requests(delivery_status);
CREATE INDEX IF NOT EXISTS idx_order_item_requests_vendor ON public.order_item_requests(vendor_id);
