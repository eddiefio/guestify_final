import { ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

interface PropertyLayoutProps {
  children: ReactNode;
  params: {
    propertyId: string;
  };
}

export default function PropertyLayout({ children, params }: PropertyLayoutProps) {
  const links = [
    { name: 'House Info', href: `/dashboard/property/${params.propertyId}/house-info` },
    { name: 'House Rules', href: `/dashboard/property/${params.propertyId}/house-rules` },
    { name: 'WiFi Connection', href: `/dashboard/property/${params.propertyId}/wifi-connection` },
    { name: 'City Guide', href: `/dashboard/property/${params.propertyId}/city-guide` },
    { name: 'Extra Services', href: `/dashboard/property/${params.propertyId}/extra-services` },
    { name: 'QR Code', href: `/dashboard/property/${params.propertyId}/qr-code` },
    { name: 'Checkin Information', href: `/dashboard/property/${params.propertyId}/checkin-information` },
    { name: 'Checkout Information', href: `/dashboard/property/${params.propertyId}/checkout-information` },
    { name: 'Before You Leave', href: `/dashboard/property/${params.propertyId}/before-you-leave` },
    { name: 'Useful Contacts', href: `/dashboard/property/${params.propertyId}/useful-contacts` },
    { name: 'Book Again', href: `/dashboard/property/${params.propertyId}/book-again` },
    { name: 'How Things Work', href: `/dashboard/property/${params.propertyId}/how-things-work` },
  ];

  return (
    <div className="space-y-4 p-6">
      <div className="overflow-x-auto pb-2">
        <Tabs defaultValue="house-info" className="w-full">
          <TabsList className="w-max">
            {links.map((link) => {
              const isActive = link.href.includes(
                params.propertyId + '/' + link.href.split('/').pop()
              );
              return (
                <TabsTrigger
                  key={link.href}
                  value={link.href.split('/').pop() || ''}
                  className={`${isActive ? 'bg-primary text-primary-foreground' : ''}`}
                  asChild
                >
                  <Link href={link.href}>{link.name}</Link>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>
      {children}
    </div>
  );
} 