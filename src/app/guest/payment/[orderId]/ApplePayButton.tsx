'use client'

import { useState, useEffect } from 'react'
import { useStripe } from '@stripe/react-stripe-js'
import Image from 'next/image'

interface ApplePayButtonProps {
  clientSecret: string
  amount: number
  onSuccess: (paymentIntent: any) => void
  onError: (error: any) => void
}

export default function ApplePayButton({ 
  clientSecret, 
  amount, 
  onSuccess, 
  onError 
}: ApplePayButtonProps) {
  const stripe = useStripe()
  const [isApplePayAvailable, setIsApplePayAvailable] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Verifica se Apple Pay è disponibile sul dispositivo
    if (stripe) {
      const checkApplePaySupport = async () => {
        try {
          // Crea un oggetto paymentRequest per verificare la disponibilità di Apple Pay
          const paymentRequest = stripe.paymentRequest({
            country: 'IT',
            currency: 'eur',
            total: {
              label: 'Guestify Order',
              amount: Math.round(amount * 100), // Converti in centesimi
            },
            requestPayerName: true,
            requestPayerEmail: true,
          })

          // Controlla se Apple Pay è supportato
          const result = await paymentRequest.canMakePayment()
          
          if (result?.applePay) {
            setIsApplePayAvailable(true)
            
            // Aggiungiamo un event listener per l'evento paymentmethod
            paymentRequest.on('paymentmethod', async (event) => {
              setIsLoading(true)
              
              try {
                // Conferma il pagamento
                const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                  payment_method: event.paymentMethod.id,
                })

                if (error) {
                  event.complete('fail')
                  onError(error)
                } else {
                  event.complete('success')
                  onSuccess(paymentIntent)
                }
              } catch (err) {
                event.complete('fail')
                onError(err)
              } finally {
                setIsLoading(false)
              }
            })
          }
        } catch (error) {
          console.error('Errore nella verifica di Apple Pay:', error)
        }
      }

      checkApplePaySupport()
    }
  }, [stripe, clientSecret, amount, onSuccess, onError])

  const handleApplePayClick = async () => {
    if (!stripe) return
    
    setIsLoading(true)
    
    try {
      // Crea un nuovo paymentRequest per avviare la sessione Apple Pay
      const paymentRequest = stripe.paymentRequest({
        country: 'IT',
        currency: 'eur',
        total: {
          label: 'Guestify Order',
          amount: Math.round(amount * 100), // Converti in centesimi
        },
        requestPayerName: true,
        requestPayerEmail: true,
      })
      
      // Mostra l'interfaccia di Apple Pay
      paymentRequest.show()
    } catch (error) {
      console.error('Errore nell\'avvio di Apple Pay:', error)
      onError(error)
    } finally {
      setIsLoading(false)
    }
  }

  // Se Apple Pay non è disponibile, non mostrare il pulsante
  if (!isApplePayAvailable) {
    return null
  }

  return (
    <button
      onClick={handleApplePayClick}
      disabled={isLoading}
      className="w-full h-12 mb-4 flex items-center justify-center rounded-md bg-black text-white relative"
      type="button"
    >
      {isLoading ? (
        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
      ) : (
        <>
          <Image 
            src="/apple-pay-mark.svg" 
            alt="Apple Pay" 
            width={45} 
            height={28} 
            className="mr-2"
          />
          <span className="font-medium">Paga con Apple Pay</span>
        </>
      )}
    </button>
  )
} 