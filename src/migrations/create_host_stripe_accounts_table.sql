-- Create the host_stripe_accounts table
CREATE TABLE IF NOT EXISTS public.host_stripe_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL,
  stripe_account_status TEXT NOT NULL CHECK (stripe_account_status IN ('not_connected', 'pending', 'active', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  connected_at TIMESTAMPTZ,
  
  -- Enforce uniqueness on both columns
  CONSTRAINT unique_host_id UNIQUE (host_id),
  CONSTRAINT unique_stripe_account_id UNIQUE (stripe_account_id)
);

-- Add RLS policiess
ALTER TABLE public.host_stripe_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view only their own Stripe account
CREATE POLICY "Users can view their own stripe account" 
  ON public.host_stripe_accounts
  FOR SELECT 
  USING (auth.uid() = host_id);
  
-- Policy: Users can insert their own Stripe account
CREATE POLICY "Users can insert their own stripe account" 
  ON public.host_stripe_accounts
  FOR INSERT 
  WITH CHECK (auth.uid() = host_id);
  
-- Policy: Users can update their own Stripe account
CREATE POLICY "Users can update their own stripe account" 
  ON public.host_stripe_accounts
  FOR UPDATE 
  USING (auth.uid() = host_id); 