'use client';

import { useState, useEffect } from 'react';
import { useStripe } from '@stripe/react-stripe-js';
import Image from 'next/image';

interface ApplePayButtonProps {
  amount: number;
  clientSecret: string;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: any) => void;
}

const ApplePayButton = ({ amount, clientSecret, onSuccess, onError }: ApplePayButtonProps) => {
  const stripe = useStripe();
  const [isApplePayAvailable, setIsApplePayAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe) return;

    // Crea un oggetto PaymentRequest per verificare se Apple Pay è disponibile
    const paymentRequest = stripe.paymentRequest({
      country: 'IT',
      currency: 'eur',
      total: {
        label: 'Guestify Order',
        amount: Math.round(amount * 100), // Stripe richiede l'importo in centesimi
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    // Controlla se il cliente può pagare con Apple Pay
    paymentRequest.canMakePayment().then(result => {
      if (result && result.applePay) {
        setIsApplePayAvailable(true);
      } else {
        setIsApplePayAvailable(false);
      }
    });
  }, [stripe, amount]);

  const handleApplePayClick = async () => {
    if (!stripe || !clientSecret) return;

    setIsLoading(true);
    
    try {
      // Crea un nuovo oggetto PaymentRequest
      const paymentRequest = stripe.paymentRequest({
        country: 'IT',
        currency: 'eur',
        total: {
          label: 'Guestify Order',
          amount: Math.round(amount * 100),
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      // Gestisce l'evento paymentmethod quando il cliente completa il pagamento con Apple Pay
      paymentRequest.on('paymentmethod', async (ev) => {
        try {
          // Conferma il pagamento con il payment method da Apple Pay
          const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(
            clientSecret,
            { payment_method: ev.paymentMethod.id },
            { handleActions: false }
          );

          if (confirmError) {
            // Comunica all'interfaccia Apple Pay che il pagamento è fallito
            ev.complete('fail');
            onError(confirmError);
          } else {
            // Comunica all'interfaccia Apple Pay che il pagamento è andato a buon fine
            ev.complete('success');

            // Verifica se il PaymentIntent richiede ulteriori azioni
            if (paymentIntent.status === 'requires_action') {
              // Lascia che Stripe.js gestisca il resto del flusso di pagamento
              const { error, paymentIntent: updatedIntent } = await stripe.confirmCardPayment(clientSecret);
              
              if (error) {
                onError(error);
              } else {
                onSuccess(updatedIntent);
              }
            } else {
              // Il pagamento è andato a buon fine
              onSuccess(paymentIntent);
            }
          }
        } catch (error) {
          ev.complete('fail');
          onError(error);
        }
      });

      // Mostra l'interfaccia di pagamento Apple Pay
      paymentRequest.show();
    } catch (error) {
      onError(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isApplePayAvailable) {
    return null;
  }

  return (
    <button
      onClick={handleApplePayClick}
      disabled={isLoading}
      className="w-full px-4 py-3 bg-black text-white font-medium rounded-md mb-4 flex items-center justify-center"
      style={{ height: '50px' }}
    >
      {isLoading ? (
        <span>Attendere...</span>
      ) : (
        <>
          <span className="mr-2">Paga con</span>
          {/* Apple Pay logo (si può sostituire con un'immagine SVG o PNG) */}
          <svg height="24" width="40" fill="white" role="img" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M 5.6209912,8.8341372 C 5.5001362,10.830304 7.0940182,11.960947 7.1578022,12.001841 7.0921832,12.042736 6.6137262,13.479414 5.7208702,14.928155 5.0012282,16.133502 4.2402372,17.341899 3.0332772,17.341899 1.8263172,17.341899 1.4865442,16.537981 0.10157617,16.537981 -1.2834288,16.537981 -1.7188248,17.341899 -2.8441028,17.341899 -3.9693808,17.341899 -4.6890238,16.19533 -5.4519148,14.992033 -6.6998548,13.232765 -7.6350988,10.136386 -7.5275708,7.2053199 -7.4219778,4.280142 -5.6864438,2.740299 -3.9263208,2.740299 c 1.153971,0 2.115873,0.785606 2.781387,0.785606 0.665515,0 1.9188128,-0.8468 3.2333498,-0.8468 -0.04281,0 2.7191624,0 0,0 z M 3.3730502,0 C 3.4993722,1.619237 2.7184162,3.225423 1.9554232,4.329116 1.1924302,5.433734 0.13606417,6.317213 -1.0708958,6.317213 c -0.081541,-1.606174 0.6543282,-3.198309 1.39029197,-4.268975 0.7790518,-1.1721522 2.06255983,-2.0454621 3.05364403,-2.048238 z"></path>
          </svg>
        </>
      )}
    </button>
  );
};

export default ApplePayButton; 