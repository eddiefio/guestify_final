'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import QRCode from 'qrcode';
import { toast } from 'react-hot-toast';

export default function QRCodePage() {
  const [propertyName, setPropertyName] = useState('');
  const [qrCodeDataURL, setQrCodeDataURL] = useState('');
  const [menuUrl, setMenuUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printingStatus, setPrintingStatus] = useState<'idle' | 'preparing' | 'ready' | 'error'>('idle');
  
  // Frame image path
  const frameImagePath = "/images/qr-frame.png";
  
  const params = useParams();
  const propertyId = params.propertyId as string;
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!propertyId) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch property details
        const { data: property, error: propError } = await supabase
          .from('properties')
          .select('name')
          .eq('id', propertyId)
          .single();

        if (propError) throw propError;

        setPropertyName(property.name);
        
        // Generate QR code
        const menuUrl = `${window.location.origin}/guest/${propertyId}`;
        setMenuUrl(menuUrl);
        
        const qrCode = await QRCode.toDataURL(menuUrl, {
          width: 300,
          margin: 1,
          color: {
            dark: '#5E2BFF',
            light: '#ffffff'
          }
        });
        setQrCodeDataURL(qrCode);
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [propertyId, supabase]);

  const handleDirectPrint = async () => {
    try {
      setPrintingStatus('preparing');
      
      // Create PDF content similar to direct print
      const printWindow = window.open('', '', 'height=500,width=500');
      if (!printWindow) {
        toast.error('Please allow pop-ups for this website to save as PDF');
        setPrintingStatus('error');
        return;
      }
      
      printWindow.document.write('<html><head><title>Guestify QR Code</title>');
      printWindow.document.write('</head><body>');
      printWindow.document.write('<div style="text-align:center; padding:20px;">');
      printWindow.document.write('<h1 style="font-family:Arial,sans-serif;color:#5E2BFF;">Guestify Menu</h1>');
      printWindow.document.write('<h2 style="font-family:Arial,sans-serif;color:#333;">' + propertyName + '</h2>');
      printWindow.document.write('<div style="margin:30px 0;">');
      printWindow.document.write('<img src="' + qrCodeDataURL + '" style="width:300px;height:300px;" />');
      printWindow.document.write('</div>');
      printWindow.document.write('<p style="font-family:Arial,sans-serif;color:#666;">Scan this QR code to access the property information</p>');
      printWindow.document.write('<p style="font-family:Arial,sans-serif;color:#999;font-size:12px;">' + menuUrl + '</p>');
      printWindow.document.write('</div>');
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      
      // Wait for content to load
      setTimeout(() => {
        printWindow.document.title = "guestify-qrcode.pdf";
        printWindow.print();
        setPrintingStatus('ready');
        printWindow.close();
      }, 250);

    } catch (err) {
      console.error('Error generating PDF:', err);
      setPrintingStatus('error');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">QR Code for {propertyName}</h1>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      ) : (
        <div className="max-w-md mx-auto text-center bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-6">Menu QR Code</h3>
          <p className="mb-6 text-gray-600">
            Place this QR code in your rental property so guests can easily access your property information.
          </p>

          {/* QR Code Display */}
          {qrCodeDataURL && (
            <div className="mb-8">
              <div className="text-[#5E2BFF] font-bold text-lg mb-2">Guestify Menu</div>
              {/* Container for the frame image and overlaid QR code */}
              <div className="relative w-full">
                {/* Frame image */}
                <Image 
                  src={frameImagePath} 
                  alt="QR Frame" 
                  width={500}
                  height={500}
                  className="w-full h-auto block"
                />
                
                {/* QR code overlaid, positioned on the arrow */}
                <div className="absolute top-[43%] left-[80%] transform -translate-x-1/2 -translate-y-1/2 w-[24%]">
                  <Image
                    src={qrCodeDataURL}
                    alt="QR Code"
                    width={300}
                    height={300}
                    className="w-full h-auto"
                  />
                </div>
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {propertyName}
              </div>
            </div>
          )}

          {/* Save as PDF button */}
          <button
            onClick={handleDirectPrint}
            className="bg-[#ffde59] text-black px-4 py-2 rounded-full hover:opacity-90 transition font-semibold flex items-center justify-center mx-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            Save as PDF
          </button>

          {/* Show status messages */}
          {printingStatus === 'preparing' && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                Preparing your PDF...
              </p>
            </div>
          )}

          {printingStatus === 'ready' && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700 mb-2">PDF generated successfully!</p>
              <p className="text-xs text-gray-600">
                If your download didn't start automatically, check your browser's download manager or popup blocker settings.
              </p>
            </div>
          )}

          {/* Error message */}
          {printingStatus === 'error' && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-700">
                There was an error generating the PDF. Please try again.
              </p>
            </div>
          )}

          {/* URL display */}
          <div className="mt-6">
            <p className="text-sm text-gray-500 mb-1">
              Or share this URL with your guests:
            </p>
            <div className="flex items-center justify-center">
              <input
                type="text"
                value={menuUrl}
                readOnly
                className="w-full text-sm text-gray-700 border rounded-l px-3 py-2 bg-gray-50"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(menuUrl);
                  toast.success('URL copied to clipboard!');
                }}
                className="bg-gray-200 px-3 py-2 rounded-r hover:bg-gray-300 transition-colors"
                title="Copy to clipboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 