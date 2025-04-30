'use client';

import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { PaymentRequestButtonElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!, {
  apiVersion: '2023-10-16'
});

interface ApplePayButtonProps {
  amount: number;
  currency?: string;
  onPaymentSuccess: (paymentIntent: any) => void;
  onPaymentError: (error: any) => void;
  stripeAccountId: string;
}

function ApplePayButtonContent({
  amount,
  currency = 'EUR',
  onPaymentSuccess,
  onPaymentError,
  stripeAccountId
}: ApplePayButtonProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);

  useEffect(() => {
    if (!stripe || !elements) return;

    const pr = stripe.paymentRequest({
      country: 'IT',
      currency: currency.toLowerCase(),
      total: {
        label: 'Pagamento Guestify',
        amount: Math.round(amount * 100), // Stripe richiede il prezzo in centesimi
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    pr.on('paymentmethod', async (e) => {
      try {
        // Crea un payment intent sul server
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            currency,
            stripeAccountId
          }),
        });

        if (!response.ok) {
          throw new Error('Errore nella creazione del payment intent');
        }

        const { clientSecret } = await response.json();

        // Conferma il pagamento
        const { error, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: e.paymentMethod.id,
          },
          { handleActions: false }
        );

        if (error) {
          e.complete('fail');
          onPaymentError(error);
        } else {
          e.complete('success');
          if (paymentIntent.status === 'requires_action') {
            // Gestisci il 3D Secure se necessario
            const { error, paymentIntent: updatedPaymentIntent } = 
              await stripe.confirmCardPayment(clientSecret);
            
            if (error) {
              onPaymentError(error);
            } else {
              onPaymentSuccess(updatedPaymentIntent);
            }
          } else {
            onPaymentSuccess(paymentIntent);
          }
        }
      } catch (error) {
        e.complete('fail');
        onPaymentError(error);
      }
    });

    // Verifica se Apple Pay è disponibile
    pr.canMakePayment().then((result) => {
      if (result && result.applePay) {
        setCanMakePayment(true);
        setPaymentRequest(pr);
      } else {
        console.log('Apple Pay non è disponibile su questo dispositivo');
      }
    });

    return () => {
      // Pulizia
      pr.off('paymentmethod');
    };
  }, [stripe, elements, amount, currency, onPaymentSuccess, onPaymentError, stripeAccountId]);

  if (!canMakePayment || !paymentRequest) {
    return null;
  }

  return (
    <div className="apple-pay-button-container">
      <PaymentRequestButtonElement
        options={{
          paymentRequest,
          style: {
            paymentRequestButton: {
              theme: 'dark',
              height: '48px',
              type: 'buy',
            },
          },
        }}
      />
    </div>
  );
}

export default function ApplePayButton(props: ApplePayButtonProps) {
  const options = {
    appearance: {
      theme: 'stripe',
    },
    stripeAccount: props.stripeAccountId
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <ApplePayButtonContent {...props} />
    </Elements>
  );
} 