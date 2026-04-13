-- Add Stripe payment columns to bookings table
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS stripe_customer_id text DEFAULT '',
  ADD COLUMN IF NOT EXISTS stripe_payment_method_id text DEFAULT '',
  ADD COLUMN IF NOT EXISTS setup_intent_id text DEFAULT '',
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS attendance_status text DEFAULT NULL;