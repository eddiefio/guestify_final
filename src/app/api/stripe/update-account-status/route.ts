import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    const { userId, accountId, status } = await request.json()
    
    // Validate required fields
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    if (!accountId) {
      return NextResponse.json({ error: 'Stripe account ID is required' }, { status: 400 })
    }
    
    if (!status || !['not_connected', 'pending', 'active', 'error'].includes(status)) {
      return NextResponse.json({ error: 'Valid account status is required' }, { status: 400 })
    }

    // Update the account status in the database
    const { error } = await supabaseAdmin
      .from('host_stripe_accounts')
      .update({
        stripe_account_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('host_id', userId)
      .eq('stripe_account_id', accountId)
    
    if (error) {
      console.error('Error updating Stripe account status:', error)
      return NextResponse.json({ error: 'Failed to update account status' }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Account status updated successfully'
    })
    
  } catch (error: any) {
    console.error('Error in update Stripe account status handler:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to update account status'
    }, { status: 500 })
  }
} 