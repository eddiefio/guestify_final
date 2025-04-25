import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    const { userId, accountId } = await request.json()
    
    // Validate required fields
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    if (!accountId) {
      return NextResponse.json({ error: 'Stripe account ID is required' }, { status: 400 })
    }

    // Initialize Stripe with the secret key
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe secret key not configured' }, { status: 500 })
    }
    
    const stripe = new Stripe(stripeSecretKey)

    // Verify that the Stripe account belongs to this user
    const { data: accountData, error: accountError } = await supabaseAdmin
      .from('host_stripe_accounts')
      .select('*')
      .eq('host_id', userId)
      .eq('stripe_account_id', accountId)
      .single()
      
    if (accountError || !accountData) {
      console.error('Error verifying account ownership:', accountError)
      return NextResponse.json({
        isValid: false,
        message: 'Could not verify account ownership'
      }, { status: 403 })
    }
    
    // Retrieve the Stripe account to check its details and status
    const account = await stripe.accounts.retrieve(accountId)
    
    // Check if the account is properly set up
    const isDetailsSubmitted = account.details_submitted
    const isChargesEnabled = account.charges_enabled
    const isPayoutsEnabled = account.payouts_enabled
    
    if (!isDetailsSubmitted) {
      return NextResponse.json({
        isValid: false,
        message: 'Account setup is not complete. Please provide all required information.'
      })
    }
    
    if (!isChargesEnabled) {
      return NextResponse.json({
        isValid: false,
        message: 'Your account is not yet enabled for charges. Please complete the verification process.'
      })
    }
    
    // Account is valid!
    return NextResponse.json({
      isValid: true,
      message: 'Account verified successfully',
      accountDetails: {
        isDetailsSubmitted,
        isChargesEnabled,
        isPayoutsEnabled
      }
    })
    
  } catch (error: any) {
    console.error('Error in verify Stripe account handler:', error)
    return NextResponse.json({ 
      isValid: false,
      message: error.message || 'Failed to verify Stripe account'
    }, { status: 500 })
  }
} 