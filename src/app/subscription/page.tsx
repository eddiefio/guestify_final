import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import SubscriptionPlans from '@/components/SubscriptionPlans';

export default async function SubscriptionPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  
  // Controlla se l'utente è autenticato
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    // Reindirizza alla pagina di login se l'utente non è autenticato
    redirect('/login');
  }
  
  // Ottieni le informazioni sull'abbonamento dell'utente
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .maybeSingle();
  
  const hasActiveSubscription = !!subscription;
  
  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-6">
          Il tuo abbonamento
        </h1>
        
        {hasActiveSubscription ? (
          <div className="bg-white shadow rounded-lg p-6 mb-10">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Abbonamento Attivo</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2">Informazioni sull'abbonamento</h3>
                <p className="text-gray-600 mb-1">
                  <span className="font-medium">Piano:</span> {subscription.plan_type === 'monthly' ? 'Mensile' : 'Annuale'}
                </p>
                <p className="text-gray-600 mb-1">
                  <span className="font-medium">Prezzo:</span> €{subscription.price} per {subscription.interval === 'month' ? 'mese' : 'anno'}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Stato:</span> {subscription.status === 'active' ? 'Attivo' : subscription.status === 'trialing' ? 'In prova' : 'Scaduto'}
                </p>
                
                {subscription.trial_ends_at && (
                  <p className="text-gray-600 mt-2">
                    <span className="font-medium">La prova gratuita termina il:</span> {new Date(subscription.trial_ends_at).toLocaleDateString('it-IT')}
                  </p>
                )}
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2">Gestisci abbonamento</h3>
                <p className="text-gray-600 mb-4">
                  Puoi gestire il tuo abbonamento, modificare il metodo di pagamento o annullarlo attraverso il portale cliente.
                </p>
                <a 
                  href="https://billing.stripe.com/p/login/test_aEU5kMehX20g2fSeUU"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#5E2BFF] hover:bg-[#4a22cc] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5E2BFF]"
                >
                  Gestisci abbonamento
                </a>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-600 text-center mb-8">
            Non hai un abbonamento attivo. Scegli uno dei piani sottostanti per accedere a tutte le funzionalità.
          </p>
        )}
        
        <SubscriptionPlans userHasActiveSubscription={hasActiveSubscription} />
      </div>
    </main>
  );
} 