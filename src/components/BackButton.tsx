'use client'

import { useRouter } from 'next/navigation'

interface BackButtonProps {
  label?: string;
  url?: string;
}

export default function BackButton({ label = 'Back', url }: BackButtonProps) {
  const router = useRouter()
  
  const handleClick = () => {
    if (url) {
      // When we have a specific URL, always use push for consistent behavior
      router.push(url)
    } else {
      // Use router.back() for generic back navigation
      router.back()
    }
  }
  
  return (
    <button
      onClick={handleClick}
      className="flex items-center px-4 py-2 rounded-lg bg-white shadow-sm text-[#5E2BFF] font-bold transition-all hover:bg-gray-50 hover:shadow-md"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 mr-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 19l-7-7 7-7"
        />
      </svg>
      {label}
    </button>
  )
}