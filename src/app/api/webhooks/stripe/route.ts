import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Initialize Supabase client with service role for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = headers().get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
  }

  let event;

  try {
    // Verify the event came from Stripe
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // Handle the event
  try {
    // Handle subscription events
    if (event.type === 'customer.subscription.created' ||
        event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      
      // Get customer to find the user ID
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      const userId = customer.metadata.userId;
      
      if (!userId) {
        console.error('No userId found in customer metadata');
        return NextResponse.json({ error: 'No userId found' }, { status: 400 });
      }
      
      // Get the price details
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      
      // Determine plan type based on interval
      const planType = price.recurring?.interval === 'year' ? 'yearly' : 'monthly';
      
      // Format price for database
      const priceAmount = price.unit_amount ? price.unit_amount / 100 : 0;
      
      // Determine subscription status
      const status = subscription.status;
      
      // Calculate trial end date if applicable
      let trialEndsAt = null;
      if (subscription.trial_end) {
        trialEndsAt = new Date(subscription.trial_end * 1000).toISOString();
      }
      
      // Update or insert subscription record
      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          stripe_price_id: priceId,
          plan_type: planType,
          status: status,
          trial_ends_at: trialEndsAt,
          price: priceAmount,
          interval: price.recurring?.interval || 'month',
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error updating subscription in database:', error);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }
    }
    
    // Handle subscription deletion
    else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      
      // Get customer to find the user ID
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      const userId = customer.metadata.userId;
      
      if (!userId) {
        console.error('No userId found in customer metadata');
        return NextResponse.json({ error: 'No userId found' }, { status: 400 });
      }
      
      // Update subscription status to 'canceled'
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('stripe_subscription_id', subscription.id);
      
      if (error) {
        console.error('Error updating subscription status in database:', error);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
} 