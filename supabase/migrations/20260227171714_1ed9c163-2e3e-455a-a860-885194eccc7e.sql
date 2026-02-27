-- Add auto-renewal and billing fields to membership_cards
ALTER TABLE public.membership_cards
ADD COLUMN IF NOT EXISTS auto_renew boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS billing_cycle text NOT NULL DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS next_billing_date timestamptz,
ADD COLUMN IF NOT EXISTS last_payment_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_method text;