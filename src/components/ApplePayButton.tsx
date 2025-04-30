'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useRouter } from 'next/navigation';

// Funzione migliorata per verificare se Apple Pay è supportato
const isApplePaySupported = async () => {
  try {
    if (typeof window === 'undefined' || !window.ApplePaySession) {
      return false;
    }
    
    // Verifica che il browser supporti Apple Pay
    if (!ApplePaySession.canMakePayments()) {
      return false;
    }
    
    // Verifica che sia possibile effettuare pagamenti con le carte
    const canMakePaymentsWithActiveCard = await new Promise<boolean>((resolve) => {
      try {
        // Verificare se ci sono carte configurate (con un ritardo di 2 secondi massimo)
        const timeout = setTimeout(() => resolve(false), 2000);
        ApplePaySession.canMakePaymentsWithActiveCard().then((result: boolean) => {
          clearTimeout(timeout);
          resolve(result);
        }).catch(() => {
          clearTimeout(timeout);
          resolve(ApplePaySession.canMakePayments());
        });
      } catch (e) {
        resolve(ApplePaySession.canMakePayments());
      }
    });
    
    return canMakePaymentsWithActiveCard;
  } catch (e) {
    console.error('Errore nella verifica del supporto Apple Pay:', e);
    return false;
  }
};

interface ApplePayButtonProps {
  orderId: string;
  amount: number;
  stripeAccountId: string;
  clientSecret: string;
  onSuccess?: () => void;
}

const ApplePayButton = ({ 
  orderId, 
  amount, 
  stripeAccountId, 
  clientSecret,
  onSuccess 
}: ApplePayButtonProps) => {
  const router = useRouter();
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingSupport, setCheckingSupport] = useState(true);

  useEffect(() => {
    const checkApplePaySupport = async () => {
      try {
        setCheckingSupport(true);
        const supported = await isApplePaySupported();
        setIsSupported(supported);
      } catch (error) {
        console.error('Errore durante la verifica del supporto Apple Pay:', error);
        setIsSupported(false);
      } finally {
        setCheckingSupport(false);
      }
    };

    checkApplePaySupport();
  }, []);

  const handleApplePayClick = async () => {
    if (!clientSecret || !stripeAccountId) {
      console.error('Dettagli di pagamento mancanti');
      return;
    }

    setIsLoading(true);

    try {
      // Carica Stripe con l'account dell'host
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!, {
        stripeAccount: stripeAccountId
      });

      if (!stripe) {
        throw new Error('Impossibile inizializzare Stripe');
      }

      // Crea la richiesta di pagamento Apple Pay
      const paymentRequest = stripe.paymentRequest({
        country: 'IT',
        currency: 'eur',
        total: {
          label: `Ordine #${orderId}`,
          amount: Math.round(amount * 100), // Stripe richiede centesimi
        },
        requestPayerName: true,
        requestPayerEmail: true,
        requestPayerPhone: false,
        // Specificare le reti di pagamento supportate
        paymentMethodTypes: ['card', 'apple_pay'],
      });

      // Verifica se Apple Pay è supportato
      const result = await paymentRequest.canMakePayment();
      
      if (!result || !result.applePay) {
        console.error('Apple Pay non è supportato su questo dispositivo o browser');
        alert('Apple Pay non è supportato su questo dispositivo o browser. Prova ad utilizzare Safari su un dispositivo Apple.');
        setIsLoading(false);
        return;
      }

      // Gestisce l'evento di pagamento completato
      paymentRequest.on('paymentmethod', async (ev) => {
        try {
          // Conferma il pagamento con il PaymentIntent
          const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
            clientSecret,
            { payment_method: ev.paymentMethod.id },
            { handleActions: false }
          );

          if (confirmError) {
            ev.complete('fail');
            console.error('Errore durante la conferma del pagamento:', confirmError);
            alert('Si è verificato un errore durante il pagamento. Riprova.');
          } else {
            ev.complete('success');
            
            if (paymentIntent.status === 'requires_action') {
              // Gestione dell'autenticazione a due fattori se necessario
              const { error, paymentIntent: updatedIntent } = await stripe.confirmCardPayment(clientSecret);
              if (error) {
                console.error('Errore durante l\'autenticazione:', error);
                alert('Si è verificato un errore durante l\'autenticazione. Riprova.');
              } else if (updatedIntent.status === 'succeeded') {
                // Aggiorna lo stato dell'ordine
                await updateOrderStatus(orderId);
                // Reindirizza alla pagina di successo
                if (onSuccess) {
                  onSuccess();
                } else {
                  router.push(`/guest/checkout/success?orderId=${orderId}`);
                }
              }
            } else if (paymentIntent.status === 'succeeded') {
              // Aggiorna lo stato dell'ordine
              await updateOrderStatus(orderId);
              // Reindirizza alla pagina di successo
              if (onSuccess) {
                onSuccess();
              } else {
                router.push(`/guest/checkout/success?orderId=${orderId}`);
              }
            }
          }
        } catch (error) {
          console.error('Errore durante il processo di pagamento:', error);
          ev.complete('fail');
          alert('Si è verificato un errore durante il pagamento. Riprova.');
        }
        
        setIsLoading(false);
      });

      // Gestisce errori/annullamenti
      paymentRequest.on('cancel', () => {
        console.log('Pagamento con Apple Pay annullato dall\'utente');
        setIsLoading(false);
      });

      // Richiedi il pagamento
      paymentRequest.show();
    } catch (error) {
      console.error('Errore nell\'inizializzazione del pagamento:', error);
      alert('Si è verificato un errore nell\'inizializzazione del pagamento. Riprova.');
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string) => {
    try {
      console.log("Aggiornamento stato ordine a PAID:", orderId);
      const response = await fetch(`/api/orders/${orderId}/update-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ status: 'PAID' }),
      });
      
      if (!response.ok) {
        console.error('Errore nell\'aggiornamento dello stato dell\'ordine:', response.status);
        const errorText = await response.text();
        console.error('Dettagli errore:', errorText);
      } else {
        const result = await response.json();
        console.log('Stato ordine aggiornato con successo:', result);
      }
    } catch (error) {
      console.error('Errore nella richiesta di aggiornamento:', error);
    }
  };

  // Durante il controllo mostro uno spinner
  if (checkingSupport) {
    return (
      <div className="w-full h-12 flex items-center justify-center mt-4">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Non mostrare nulla se Apple Pay non è supportato
  if (!isSupported) return null;

  return (
    <button
      onClick={handleApplePayClick}
      disabled={isLoading}
      className="apple-pay-button"
      aria-label="Paga con Apple Pay"
      type="button"
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-md">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
        </div>
      )}
    </button>
  );
};

export default ApplePayButton; 