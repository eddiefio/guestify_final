'use client'

import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ReactNode } from 'react'
import BackButton from '@/components/BackButton'

interface LayoutProps {
  children: ReactNode
  title?: string
  hasBackButton?: boolean
  backUrl?: string
  backLabel?: string
}

export default function Layout({ 
  children, 
  title = 'Guestify', 
  hasBackButton = false,
  backUrl,
  backLabel = 'Back'
}: LayoutProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  
  const handleSignOut = async () => {
    try {
      // Preveniamo il comportamento di default e aggiungiamo un effetto visivo
      const btn = document.getElementById('logout-btn')
      if (btn) {
        btn.setAttribute('disabled', 'true')
        btn.classList.add('opacity-50')
      }
      
      // Chiamata alla funzione di logout con un minimo ritardo
      setTimeout(() => {
        signOut().then(() => {
          router.push('/auth/signin')
        })
      }, 50)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800 font-spartan">
      {/* Header */}
      <header className="bg-[#5E2BFF] py-2 px-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            {user ? (
              <Link href="/dashboard">
                <span className="cursor-pointer">
                  <Image 
                    src="/images/guestify_logo.png" 
                    alt="Guestify" 
                    width={140}
                    height={80}
                    quality={100}
                    priority
                    className="w-36 h-16"
                    style={{ objectFit: 'contain' }}
                  />
                </span>
              </Link>
            ) : (
              <span>
                <Image 
                  src="/images/guestify_logo.png" 
                  alt="Guestify" 
                  width={140}
                  height={80}
                  quality={100}
                  priority
                  className="w-36 h-16"
                  style={{ objectFit: 'contain' }}
                />
              </span>
            )}
          </div>
          <nav className="flex items-center space-x-6">
            {user ? (
              <>
                <Link href="/dashboard">
                  <span className="text-white font-medium hover:opacity-80 transition-colors text-sm sm:text-base cursor-pointer">
                    Dashboard
                  </span>
                </Link>
                <button 
                  id="logout-btn"
                  onClick={handleSignOut}
                  className="text-white font-medium hover:opacity-80 transition-colors text-sm sm:text-base bg-transparent border-none cursor-pointer"
                >
                  Logout
                </button>
                <Link href="/dashboard/profile">
                  <span className="cursor-pointer flex items-center">
                    <div className="h-10 w-10 rounded-full bg-white text-[#5E2BFF] flex items-center justify-center shadow-md">
                      <i className="fas fa-user-circle text-xl"></i>
                    </div>
                  </span>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <span className="text-white font-medium hover:opacity-80 transition-colors text-sm sm:text-base cursor-pointer">
                    Login
                  </span>
                </Link>
                <Link href="/auth/signup">
                  <span className="bg-[#ffde59] text-black px-4 py-2 rounded-lg hover:bg-[#f8c70a] transition-colors text-sm sm:text-base font-medium cursor-pointer shadow-sm">
                    Sign Up
                  </span>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-6xl w-full mx-auto my-6 p-4 sm:p-6 flex-grow">
        {hasBackButton && (
          <div className="mb-6">
            <BackButton label={backLabel} url={backUrl} />
          </div>
        )}
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-[#5E2BFF] p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-center text-white">
            {/* Telegram Button and Description */}
            <div className="mb-6 md:mb-0 flex flex-col md:flex-row items-center justify-center md:space-x-4 text-center md:text-left">
              <a 
                href="https://t.me/+vXtjk7jYyhI1YjY0" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-[#0088cc] hover:bg-[#0077b5] text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center space-x-2 shadow-md mb-2 md:mb-0"
              >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.4 6.9l-1.477 7.52c-.123.678-.483.826-1.02.507l-2.77-2.14-1.344 1.35c-.153.156-.28.28-.574.28l.217-2.752 4.644-4.423c.324-.282-.05-.42-.43-.282L7.365 11.113l-2.573-.841c-.6-.175-.612-.6.124-.887l9.98-4.015c.6-.175 1.1.175.903.602l.002-.072z" />
                </svg>
                <span>Join Now</span>
              </a>
              <p className="text-white text-sm md:text-base max-w-md">
                Join our Telegram group for hosts to get advice, share opinions and receive support
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-center">
            <Image 
              src="/images/guestify_logo.png" 
              alt="Guestify" 
              width={120}
              height={60}
              quality={100}
              className="w-24 h-12"
              style={{ objectFit: 'contain' }}
            />
          </div>
          
          <div className="mt-6 pt-6 border-t border-white border-opacity-20 text-center text-white text-opacity-80 text-sm font-medium">
            <p>&copy; {new Date().getFullYear()} Guestify. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}