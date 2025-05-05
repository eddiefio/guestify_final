import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function POST(req: NextRequest) {
  try {
    // Parse the request body to get the plan type
    const { planType } = await req.json();
    
    // Create a Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the user from the session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get user profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();
    
    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }
    
    // Determine the price ID based on the plan type
    let priceId;
    let trialPeriodDays = 7; // 7 days trial period
    
    if (planType === 'monthly') {
      priceId = process.env.STRIPE_MONTHLY_PRICE_ID;
    } else if (planType === 'yearly') {
      priceId = process.env.STRIPE_YEARLY_PRICE_ID;
    } else {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }
    
    // Check if the user already has a Stripe customer ID
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();
    
    let customerId;
    
    if (existingSubscription?.stripe_customer_id) {
      customerId = existingSubscription.stripe_customer_id;
    } else {
      // Create a new customer in Stripe
      const customer = await stripe.customers.create({
        email: profile.email,
        name: profile.full_name || undefined,
        metadata: {
          userId: userId
        }
      });
      
      customerId = customer.id;
    }
    
    // Create a payment link for the subscription
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: priceId as string,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: trialPeriodDays
      },
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?subscription=success`,
        },
      },
      customer: customerId,
      automatic_tax: { enabled: true },
    });
    
    return NextResponse.json({ url: paymentLink.url });
  } catch (error) {
    console.error('Error creating payment link:', error);
    return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 });
  }
} 