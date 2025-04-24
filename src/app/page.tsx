'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  // Reindirizza immediatamente alla pagina di login
  useEffect(() => {
    router.replace('/auth/signin')
  }, [router])

  // Non mostrare alcun contenuto, solo un div vuoto
  return null
}
