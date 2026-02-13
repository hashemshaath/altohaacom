-- Add admin_notes column for organizer communication on requests
ALTER TABLE public.order_item_requests ADD COLUMN IF NOT EXISTS admin_notes text;

-- Add dish_template_id to track which template a request came from
ALTER TABLE public.order_item_requests ADD COLUMN IF NOT EXISTS dish_template_id text;