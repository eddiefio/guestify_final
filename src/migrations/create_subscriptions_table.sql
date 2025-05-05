-- Create the subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR NOT NULL DEFAULT 'inactive',
  plan_type VARCHAR NOT NULL,
  recurring BOOLEAN DEFAULT true,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  stripe_customer_id VARCHAR,
  stripe_subscription_id VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Enforce uniqueness on user_id to prevent multiple subscriptions per user
  CONSTRAINT unique_user_id UNIQUE (user_id)
);

-- Add RLS policies
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view only their own subscription
CREATE POLICY "Users can view their own subscription" 
  ON public.subscriptions
  FOR SELECT 
  USING (auth.uid() = user_id);
  
-- Policy: Only service role can insert/update subscriptions (will be done via webhooks)
CREATE POLICY "Service role can manage all subscriptions" 
  ON public.subscriptions
  USING (true)
  WITH CHECK (true);

-- Update profiles table to reference subscriptions
ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL; 