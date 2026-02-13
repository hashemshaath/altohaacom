
-- Make competition_id nullable on requirement_lists so lists can be drafted without a competition
ALTER TABLE public.requirement_lists ALTER COLUMN competition_id DROP NOT NULL;

-- Also make competition_id nullable on order_item_requests for standalone requests
ALTER TABLE public.order_item_requests ALTER COLUMN competition_id DROP NOT NULL;
