"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode';
import { toast } from 'react-hot-toast';

export default function QRCodePage() {
  const [propertyName, setPropertyName] = useState('');
  const [qrCodeDataURL, setQrCodeDataURL] = useState('');
  const [menuUrl, setMenuUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printingStatus, setPrintingStatus] = useState<'idle' | 'preparing' | 'ready' | 'error'>('idle');
  const qrRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const propertyId = params.propertyId as string;
  const supabase = createClientComponentClient();
  
  // Frame image path
  const frameImagePath = "/images/qr-frame.png";

  useEffect(() => {
    if (!propertyId) return;

    const fetchPropertyAndGenerateQR = async () => {
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

    fetchPropertyAndGenerateQR();
  }, [propertyId, supabase]);

  const handlePrintQR = async () => {
    try {
      setPrintingStatus('preparing');
      
      // Create PDF content similar to direct print
      const printWindow = window.open('', '', 'height=500,width=500');
      if (!printWindow) {
        throw new Error('Could not open print window');
      }
      
      printWindow.document.write('<html><head><title>Print QR Code</title>');
      printWindow.document.write('</head><body>');
      printWindow.document.write('<div style="text-align:center; padding:20px;">');
      printWindow.document.write('<h1 style="font-family:Arial,sans-serif;color:#5E2BFF;">Guestify</h1>');
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

    } catch (error: any) {
      console.error('Error creating PDF:', error);
      setPrintingStatus('error');
      setError(error.message || 'Failed to generate PDF');
      toast.error('Failed to generate PDF');
    }
  };

  const handleDownloadPDF = () => {
    try {
      setPrintingStatus('preparing');
      
      // Use canvas element to capture QR code
      const canvas = document.createElement('canvas');
      canvas.width = 1000;
      canvas.height = 1400;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not create canvas context');
      }
      
      // Set background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw title
      ctx.font = 'bold 60px Arial';
      ctx.fillStyle = '#5E2BFF';
      ctx.textAlign = 'center';
      ctx.fillText('Guestify', canvas.width/2, 100);
      
      // Draw property name
      ctx.font = 'bold 40px Arial';
      ctx.fillStyle = '#333333';
      ctx.fillText(propertyName, canvas.width/2, 180);
      
      // Draw QR code
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, (canvas.width - 500) / 2, 250, 500, 500);
        
        // Draw text instructions
        ctx.font = '30px Arial';
        ctx.fillStyle = '#666666';
        ctx.fillText('Scan this QR code to access the property information', canvas.width/2, 850);
        
        ctx.font = '20px Arial';
        ctx.fillStyle = '#999999';
        ctx.fillText(menuUrl, canvas.width/2, 900);
        
        // Convert to PDF
        const dataUrl = canvas.toDataURL('image/png');
        
        // Create link to download
        const link = document.createElement('a');
        link.download = `guestify-qrcode-${propertyId}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setPrintingStatus('ready');
        toast.success('QR code downloaded successfully');
      };
      
      img.src = qrCodeDataURL;
      
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      setPrintingStatus('error');
      setError(error.message || 'Failed to download QR code');
      toast.error('Failed to download QR code');
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
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
        <div className="max-w-xl mx-auto text-center bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-6">QR Code for Your Property</h3>
          <p className="mb-6 text-gray-600">
            Place this QR code in your rental property so guests can easily access all information.
          </p>

          {/* QR Code Display */}
          <div className="mb-6 border p-4 rounded-lg bg-gray-50 mx-auto" ref={qrRef}>
            {qrCodeDataURL && (
              <div className="flex flex-col items-center">
                <div className="text-[#5E2BFF] font-bold text-lg mb-2">Guestify</div>
                
                <div className="w-full max-w-md relative mb-4">
                  {/* QR code centered */}
                  <div className="w-64 h-64 mx-auto">
                    <img
                      src={qrCodeDataURL}
                      alt="QR Code"
                      className="w-full h-full"
                    />
                  </div>
                </div>
                
                <div className="text-sm text-gray-500 mt-2">
                  {menuUrl}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={handlePrintQR}
              disabled={printingStatus === 'preparing'}
              className="px-4 py-2 bg-[#5E2BFF] text-white rounded hover:bg-purple-700 transition flex items-center justify-center"
            >
              {printingStatus === 'preparing' ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Preparing...
                </span>
              ) : (
                'Print QR Code'
              )}
            </button>
            
            <button
              onClick={handleDownloadPDF}
              disabled={printingStatus === 'preparing'}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition flex items-center justify-center"
            >
              {printingStatus === 'preparing' ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Preparing...
                </span>
              ) : (
                'Download QR Code'
              )}
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-8 text-left text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">How to use:</h4>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Print or download this QR code</li>
              <li>Place it in a visible location in your property</li>
              <li>Guests can scan it with their smartphone camera</li>
              <li>They will have instant access to all your property information</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
} 