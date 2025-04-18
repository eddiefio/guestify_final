'use client'

import Link from 'next/link'

interface ButtonLayoutProps {
  cancelHref: string
  submitText?: string
  cancelText?: string
  loading?: boolean
  loadingText?: string
  danger?: boolean
}

export default function ButtonLayout({
  cancelHref,
  submitText = 'Save',
  cancelText = 'Cancel',
  loading = false,
  loadingText = 'Loading...',
  danger = false,
}: ButtonLayoutProps) {
  return (
    <div className="flex justify-end space-x-4">
      <Link href={cancelHref}>
        <span className="inline-block px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition cursor-pointer">
          {cancelText}
        </span>
      </Link>
      <button
        type="submit"
        disabled={loading}
        className={`inline-block px-4 py-2 ${
          danger
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-[#ffde59] text-black hover:opacity-90'
        } rounded transition font-semibold`}
      >
        {loading ? loadingText : submitText}
      </button>
    </div>
  )
}