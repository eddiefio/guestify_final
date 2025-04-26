'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [userSession, setUserSession] = useState<any>(null);
  
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Verifica se l'utente ha una sessione (dovrebbe essere creata quando clicca sul link nell'email)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (session) {
          setUserSession(session);
          // Se abbiamo una sessione, otteniamo anche l'email dell'utente
          setEmail(session.user?.email || null);
        } else {
          // Se non c'è una sessione, l'utente non ha usato correttamente il link
          setError('Nessuna sessione attiva. Assicurati di aver cliccato sul link di recupero password nella tua email.');
        }
      } catch (error: any) {
        console.error('Errore nel recupero della sessione:', error);
        setError('Si è verificato un errore nel recupero della sessione: ' + error.message);
      }
    };
    
    checkSession();
  }, [supabase]);

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
    
    try {
      // Aggiorniamo la password tramite Supabase
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        throw error;
      }
      
      setSuccess(true);
      
      // Reindirizza alla pagina di login dopo 3 secondi
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (error: any) {
      console.error('Errore durante l\'aggiornamento della password:', error);
      setError(error.message || 'Si è verificato un errore durante l\'aggiornamento della password');
    } finally {
      setLoading(false);
    }
  };

  return (
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
              href="/auth/login"
              className="text-indigo-600 hover:text-indigo-500"
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
            
            {!userSession ? (
              <div className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-700">
                Sessione non rilevata. Assicurati di aver cliccato sul link nell'email di recupero password.
                <div className="mt-2">
                  <Link 
                    href="/auth/forgot-password" 
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Richiedi un nuovo link di recupero password
                  </Link>
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
                href="/auth/login" 
                className="text-indigo-600 hover:text-indigo-500"
              >
                Torna alla pagina di login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 