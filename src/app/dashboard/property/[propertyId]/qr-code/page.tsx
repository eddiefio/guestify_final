'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import QRCode from 'qrcode'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Layout from '@/components/layout/Layout'
import toast from 'react-hot-toast'
import Image from 'next/image'

export default function PrintQR() {
  const [propertyName, setPropertyName] = useState('')
  const [qrCodeDataURL, setQrCodeDataURL] = useState('')
  const [menuUrl, setMenuUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [printingStatus, setPrintingStatus] = useState<'idle' | 'preparing' | 'ready' | 'error'>('idle')
  const qrRef = useRef<HTMLDivElement>(null)
  const params = useParams()
  const propertyId = params.propertyId as string
  const { user } = useAuth()
  
  // Frame image path
  const frameImagePath = "/images/qr-frame.png"

  useEffect(() => {
    if (!user || !propertyId) return

    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch property details
        const { data: property, error: propError } = await supabase
          .from('properties')
          .select('name')
          .eq('id', propertyId)
          .single()

        if (propError) throw propError

        setPropertyName(property.name)
        
        // Generate QR code URL
        const guestUrl = `${window.location.origin}/guest/${propertyId}`
        setMenuUrl(guestUrl)
        
        const qrCode = await QRCode.toDataURL(guestUrl, {
          width: 300,
          margin: 1,
          color: {
            dark: '#5e2bff',
            light: '#ffffff'
          }
        })
        setQrCodeDataURL(qrCode)
        
        setLoading(false)
      } catch (error: any) {
        console.error('Error:', error)
        setError(error.message)
        setLoading(false)
      }
    }

    fetchData()
  }, [propertyId, user])

  const handlePrintQR = async () => {
    try {
      setPrintingStatus('preparing')
      
      // Create PDF content similar to direct print
      const printWindow = window.open('', '', 'height=500,width=500')
      if (!printWindow) {
        throw new Error("Couldn't open print window")
      }
      
      printWindow.document.write('<html><head><title>Print QR Code</title>')
      printWindow.document.write('</head><body>')
      printWindow.document.write('<div style="text-align:center; padding:20px;">')
      printWindow.document.write('<h1 style="font-family:Arial,sans-serif;color:#5e2bff;">Guestify</h1>')
      printWindow.document.write('<h2 style="font-family:Arial,sans-serif;color:#333;">' + propertyName + '</h2>')
      printWindow.document.write('<div style="margin:30px 0;">')
      printWindow.document.write('<img src="' + qrCodeDataURL + '" style="width:300px;height:300px;" />')
      printWindow.document.write('</div>')
      printWindow.document.write('<p style="font-family:Arial,sans-serif;color:#666;">Scansiona questo QR code per accedere alle informazioni</p>')
      printWindow.document.write('<p style="font-family:Arial,sans-serif;color:#999;font-size:12px;">' + menuUrl + '</p>')
      printWindow.document.write('</div>')
      printWindow.document.write('</body></html>')
      printWindow.document.close()
      
      // Wait for content to load
      setTimeout(() => {
        printWindow.document.title = "guestify-qrcode.pdf"
        printWindow.print()
        setPrintingStatus('ready')
        printWindow.close()
      }, 250)

    } catch (error: any) {
      console.error('Error creating PDF:', error)
      setPrintingStatus('error')
      setError(error.message || 'Failed to generate PDF')
    }
  }

  const downloadQRCode = () => {
    try {
      if (!qrCodeDataURL) {
        throw new Error('QR code not generated yet')
      }
      
      const link = document.createElement('a')
      link.href = qrCodeDataURL
      link.download = `guestify-qr-${propertyName.replace(/\s+/g, '-').toLowerCase()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('QR Code scaricato con successo')
    } catch (error: any) {
      console.error('Error downloading QR code:', error)
      toast.error('Errore nel download del QR code')
    }
  }

  return (
    <Layout title={`QR Code - ${propertyName}`}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center mb-6">
          <Link href={`/dashboard/property/${propertyId}/house-info`} className="text-indigo-600 hover:text-indigo-800 mr-4">
            &larr; Torna alla Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">QR Code per {propertyName}</h1>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="w-12 h-12 border-4 border-t-[#5E2BFF] border-b-[#5E2BFF] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Caricamento QR code...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-8">
            <div className="max-w-md mx-auto">
              <h2 className="text-xl font-semibold mb-6 text-center">QR Code per Guestify</h2>
              <p className="mb-6 text-gray-600 text-center">
                Posiziona questo QR code nella tua proprietà in modo che gli ospiti possano facilmente accedere alle informazioni.
              </p>

              {/* QR Code Display */}
              <div className="mb-6 border p-4 rounded-lg bg-gray-50 mx-auto" ref={qrRef}>
                {qrCodeDataURL && (
                  <div className="text-center">
                    <div className="text-[#5e2bff] font-bold text-lg mb-2">Guestify</div>
                    <div className="relative w-full max-w-xs mx-auto">
                      <img 
                        src={qrCodeDataURL} 
                        alt="QR Code" 
                        className="w-full"
                      />
                    </div>
                    <div className="mt-2 text-sm text-gray-600">{propertyName}</div>
                    <div className="mt-1 text-xs text-gray-500 break-all">{menuUrl}</div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handlePrintQR}
                  disabled={printingStatus === 'preparing'}
                  className={`flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg flex items-center justify-center ${
                    printingStatus === 'preparing' ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700'
                  }`}
                >
                  {printingStatus === 'preparing' ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Preparazione...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                      </svg>
                      Stampa QR Code
                    </>
                  )}
                </button>
                
                <button
                  onClick={downloadQRCode}
                  className="flex-1 bg-[#ffde59] text-black py-2 px-4 rounded-lg hover:bg-[#f8c70a] transition flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                  </svg>
                  Scarica QR Code
                </button>
              </div>

              <div className="mt-8">
                <h3 className="font-semibold text-lg mb-3">Cosa include la pagina del QR code?</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  <li>Informazioni sulla casa</li>
                  <li>Servizi extra</li>
                  <li>Regole della casa</li>
                  <li>Connessione WiFi</li>
                  <li>Guide della città</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
} 