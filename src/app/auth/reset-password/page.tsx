'use client';

import { useEffect, useState, Suspense } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Head from 'next/head';

// Componente che utilizza useSearchParams e deve essere avvolto in Suspense
function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [userSession, setUserSession] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  // Verifica se l'utente ha una sessione (dovrebbe essere creata quando clicca sul link nell'email)
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Aggiungiamo informazioni di debug
        setDebugInfo(prev => prev + '\nControllo sessione iniziato...');
        
        // Recupera la sessione dell'utente
        try {
          const { data, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            setDebugInfo(prev => prev + `\nErrore nel recupero della sessione: ${sessionError.message}`);
            throw sessionError;
          }
          
          const session = data?.session;
          
          // Verifica se abbiamo una sessione
          if (session && session.user) {
            setDebugInfo(prev => prev + `\nSessione trovata. User ID: ${session.user.id.slice(0, 8)}...`);
            setUserSession(session);
            // Se abbiamo una sessione, otteniamo anche l'email dell'utente
            setEmail(session.user?.email || null);
            return;
          } else {
            setDebugInfo(prev => prev + '\nNessuna sessione trovata nell\'oggetto data');
          }
        } catch (err: any) {
          setDebugInfo(prev => prev + `\nEccezione durante il recupero della sessione: ${err.message || 'Errore sconosciuto'}`);
        }
        
        // Se arriviamo qui, non abbiamo trovato una sessione, proviamo con getUser
        setDebugInfo(prev => prev + '\nProvo a recuperare l\'utente direttamente...');
        
        try {
          const { data, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            setDebugInfo(prev => prev + `\nErrore nel recupero dell'utente: ${userError.message}`);
            throw userError;
          }
          
          const user = data?.user;
          
          if (user) {
            setDebugInfo(prev => prev + `\nUtente trovato senza sessione. User ID: ${user.id.slice(0, 8)}...`);
            setEmail(user.email || null);
          } else {
            // Se non c'è né una sessione né un utente, visualizziamo un messaggio di errore
            setDebugInfo(prev => prev + '\nNessun utente trovato nell\'oggetto data');
            setError('Nessuna sessione attiva. Assicurati di aver cliccato sul link di recupero password nella tua email.');
          }
        } catch (err: any) {
          setDebugInfo(prev => prev + `\nEccezione durante il recupero dell'utente: ${err.message || 'Errore sconosciuto'}`);
        }
      } catch (error: any) {
        console.error('Errore non gestito nel recupero della sessione:', error);
        setDebugInfo(prev => prev + `\nErrore non gestito: ${error.message || 'Errore sconosciuto'}`);
        setError('Si è verificato un errore nel recupero della sessione: ' + (error.message || 'Errore sconosciuto'));
      }
    };
    
    // Recupera il token hash e il tipo dall'URL
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type');
    
    if (token_hash && type) {
      setDebugInfo(`Parametri URL trovati: token_hash=${token_hash.slice(0, 8)}... type=${type}`);
      
      // Verifica l'OTP direttamente
      const verifyOtp = async () => {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any,
          });
          
          if (error) {
            setDebugInfo(prev => prev + `\nErrore nella verifica OTP: ${error.message}`);
            setError(`Errore nella verifica del token: ${error.message}`);
          } else {
            setDebugInfo(prev => prev + '\nToken OTP verificato con successo!');
            // Dopo aver verificato l'OTP, controlla la sessione
            checkSession();
          }
        } catch (err: any) {
          setDebugInfo(prev => prev + `\nEccezione durante la verifica OTP: ${err.message || 'Errore sconosciuto'}`);
          setError(`Eccezione durante la verifica del token: ${err.message || 'Errore sconosciuto'}`);
        }
      };
      
      verifyOtp();
    } else {
      // Se non ci sono parametri di query, controlla comunque la sessione
      setDebugInfo('Nessun parametro token_hash trovato nell\'URL');
      checkSession();
    }
  }, [supabase, searchParams]);

  // Funzione per tentare di acquisire manualmente la sessione
  const handleManualVerify = async () => {
    setDebugInfo(prev => prev + '\n\n--- TENTATIVO MANUALE DI VERIFICA ---');
    
    // Recupera il token hash e il tipo dall'URL
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type');
    
    if (!token_hash || !type) {
      setDebugInfo(prev => prev + '\nNessun token_hash o type trovato nell\'URL');
      setError('Link non valido. Assicurati di utilizzare il link di recupero password completo dalla tua email.');
      return;
    }
    
    setDebugInfo(prev => prev + `\nParametri URL: token_hash=${token_hash.slice(0, 8)}... type=${type}`);
    
    try {
      // Tenta di verificare il token OTP
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as any,
      });
      
      if (error) {
        setDebugInfo(prev => prev + `\nErrore nella verifica manuale OTP: ${error.message}`);
        setError(`Errore nella verifica del token: ${error.message}`);
        return;
      }
      
      setDebugInfo(prev => prev + '\nVerifica manuale OTP completata con successo!');
      
      // Prova a recuperare la sessione
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setDebugInfo(prev => prev + `\nErrore nel recupero della sessione dopo verifica manuale: ${sessionError.message}`);
          throw sessionError;
        }
        
        if (data?.session) {
          setDebugInfo(prev => prev + `\nSessione acquisita manualmente! User ID: ${data.session.user.id.slice(0, 8)}...`);
          setUserSession(data.session);
          setEmail(data.session.user?.email || null);
        } else {
          setDebugInfo(prev => prev + '\nNessuna sessione trovata dopo verifica manuale');
          
          // Ultimo tentativo: recupera direttamente l'utente
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            setDebugInfo(prev => prev + `\nErrore nel recupero dell'utente dopo verifica manuale: ${userError.message}`);
          } else if (userData?.user) {
            setDebugInfo(prev => prev + `\nUtente recuperato manualmente! User ID: ${userData.user.id.slice(0, 8)}...`);
            setEmail(userData.user.email || null);
          } else {
            setDebugInfo(prev => prev + '\nNessun utente trovato dopo verifica manuale');
            setError('Impossibile acquisire la sessione. Prova a richiedere un nuovo link di reset password.');
          }
        }
      } catch (err: any) {
        setDebugInfo(prev => prev + `\nEccezione durante la verifica manuale: ${err.message || 'Errore sconosciuto'}`);
      }
    } catch (err: any) {
      setDebugInfo(prev => prev + `\nEccezione durante la verifica manuale OTP: ${err.message || 'Errore sconosciuto'}`);
      setError(`Eccezione durante la verifica del token: ${err.message || 'Errore sconosciuto'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setError('Entrambi i campi sono necessari');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Le password non corrispondono');
      return;
    }
    
    if (password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri');
      return;
    }
    
    setLoading(true);
    setError(null);
    setDebugInfo(prev => prev + '\nTentativo di aggiornamento password...');
    
    try {
      // Recupera il token hash e il tipo dall'URL
      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      
      if (!token_hash || !type) {
        throw new Error('Token mancante. Impossibile aggiornare la password.');
      }
      
      // Prima rieffettua la verifica OTP (per essere sicuri che la sessione sia attiva)
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as any,
      });
      
      if (verifyError) {
        throw verifyError;
      }
      
      // Poi aggiorna la password
      const { data, error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        setDebugInfo(prev => prev + `\nErrore nell'aggiornamento: ${error.message}`);
        throw error;
      }
      
      setDebugInfo(prev => prev + `\nPassword aggiornata con successo! Dati utente: ${JSON.stringify(data).slice(0, 100)}...`);
      setSuccess(true);
      
      // Reindirizza alla pagina di login dopo 3 secondi
      setTimeout(() => {
        router.push('/auth/signin');
      }, 3000);
    } catch (error: any) {
      console.error('Errore durante l\'aggiornamento della password:', error);
      setDebugInfo(prev => prev + `\nErrore durante l'aggiornamento: ${error.message || 'Errore sconosciuto'}`);
      setError(error.message || 'Si è verificato un errore durante l\'aggiornamento della password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <meta name="next-router-prefetch" content="false" />
      </Head>
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Reimposta la tua password</h1>
            {email && (
              <p className="mt-2 text-gray-600">
                Per l'account: {email}
              </p>
            )}
          </div>

          {success ? (
            <div className="text-center">
              <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-700">
                La tua password è stata reimpostata con successo! Verrai reindirizzato alla pagina di login...
              </div>
              <Link 
                href="/auth/signin"
                className="text-indigo-600 hover:text-indigo-500"
                prefetch={false}
              >
                Torna alla pagina di login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}
              
              {!email ? (
                <div className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-700">
                  Sessione non rilevata. Assicurati di aver cliccato sul link nell'email di recupero password.
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={handleManualVerify}
                      className="mt-2 inline-flex items-center rounded-md border border-indigo-600 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                    >
                      Tenta verifica manuale
                    </button>
                    <div className="mt-3">
                      <Link 
                        href="/auth/forgot-password" 
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                        prefetch={false}
                      >
                        Richiedi un nuovo link di recupero password
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Nuova Password
                    </label>
                    <div className="mt-1">
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Conferma Nuova Password
                    </label>
                    <div className="mt-1">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400"
                    >
                      {loading ? 'Aggiornamento in corso...' : 'Aggiorna Password'}
                    </button>
                  </div>
                </>
              )}

              <div className="text-center text-sm">
                <Link 
                  href="/auth/signin" 
                  className="text-indigo-600 hover:text-indigo-500"
                  prefetch={false}
                >
                  Torna alla pagina di login
                </Link>
              </div>
              
              {/* Area di debug - sempre visibile */}
              <div className="mt-6 border-t pt-4">
                <details>
                  <summary className="cursor-pointer text-sm text-gray-500">Informazioni di Debug</summary>
                  <pre className="mt-2 max-h-64 overflow-auto rounded bg-gray-100 p-2 text-xs text-gray-800">
                    {debugInfo || 'Nessuna informazione di debug disponibile'}
                  </pre>
                </details>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

// Componente di caricamento semplice
function LoadingState() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="text-gray-600">Caricamento in corso...</p>
      </div>
    </div>
  );
}

// Componente principale che avvolge il contenuto in Suspense
export default function ResetPassword() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ResetPasswordContent />
    </Suspense>
  );
} 