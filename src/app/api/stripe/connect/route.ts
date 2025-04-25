import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    const { userId, userEmail } = await request.json()
    
    // Validate required fields
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 })
    }

    // Initialize Stripe with the secret key
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe secret key not configured' }, { status: 500 })
    }
    
    const stripe = new Stripe(stripeSecretKey)

    // Check if the user already has a Stripe account in the host_stripe_accounts table
    const { data: existingAccount, error: accountError } = await supabaseAdmin
      .from('host_stripe_accounts')
      .select('stripe_account_id, stripe_account_status')
      .eq('host_id', userId)
      .single()
    
    let stripeAccountId
    
    if (existingAccount && existingAccount.stripe_account_id) {
      // If the user already has an account, use that one
      stripeAccountId = existingAccount.stripe_account_id
      console.log('User already has Stripe account ID:', stripeAccountId)
    } else {
      // Create a new Stripe account for the user
      const account = await stripe.accounts.create({
        type: 'standard',
        email: userEmail,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      })
      
      stripeAccountId = account.id
      console.log('Created new Stripe account:', stripeAccountId)
      
      // Insert the new account into the host_stripe_accounts table
      const { error: insertError } = await supabaseAdmin
        .from('host_stripe_accounts')
        .insert({
          host_id: userId,
          stripe_account_id: stripeAccountId,
          stripe_account_status: 'pending',
          updated_at: new Date().toISOString()
        })
      
      if (insertError) {
        console.error('Error inserting Stripe account:', insertError)
        return NextResponse.json({ error: 'Failed to save Stripe account' }, { status: 500 })
      }
    }

    // Create an account link for onboarding
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin') || 'http://localhost:3000'
    
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${baseUrl}/dashboard/stripe-redirect?error=true&account_id=${stripeAccountId}`,
      return_url: `${baseUrl}/dashboard/stripe-redirect?success=true&account_id=${stripeAccountId}`,
      type: 'account_onboarding',
    })
    
    console.log('Created Stripe account link')
    return NextResponse.json({ url: accountLink.url })
    
  } catch (error: any) {
    console.error('Error in Stripe connect handler:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
} 