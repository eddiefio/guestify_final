import { loadStripe } from '@stripe/stripe-js'
import Stripe from 'stripe'

// Assicurati che questa chiamata venga eseguita una sola volta
let stripePromise: Promise<any> | null = null

// Funzione per ottenere l'istanza del client Stripe lato client
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

// Inizializza il client Stripe lato server
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-07-09',
})

// Funzione per creare un intent di pagamento per servizi extra
export const createPaymentIntent = async ({
  amount,
  hostStripeAccountId,
  description,
  metadata = {},
}: {
  amount: number
  hostStripeAccountId: string
  description: string
  metadata?: Record<string, string>
}) => {
  // Calcola la commissione dell'applicazione (es. 10%)
  const applicationFeeAmount = Math.round(amount * 0.1)

  return stripe.paymentIntents.create({
    amount,
    currency: 'eur',
    automatic_payment_methods: { enabled: true },
    description,
    metadata,
    application_fee_amount: applicationFeeAmount,
    transfer_data: {
      destination: hostStripeAccountId,
    },
  })
} 