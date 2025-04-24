'use client';

import Image from 'next/image';
import LanguageSwitcher from './LanguageSwitcher';

interface GuestHeaderProps {
  propertyName?: string;
}

export default function GuestHeader({ propertyName }: GuestHeaderProps) {
  return (
    <header className="bg-white shadow-sm py-3">
      <div className="w-full px-4 flex items-center justify-between">
        <div className="relative h-12 w-28">
          <Image 
            src="/images/logo_guest.png"
            alt="Guestify Logo"
            fill
            className="object-contain object-left"
          />
        </div>
        <div className="flex items-center space-x-4">
          {propertyName && <div className="text-gray-700 mr-4">{propertyName}</div>}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
} 