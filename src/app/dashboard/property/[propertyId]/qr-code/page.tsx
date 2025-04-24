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
import { jsPDF } from 'jspdf'

export default function PrintQR() {
  const [propertyName, setPropertyName] = useState('')
  const [qrCodeDataURL, setQrCodeDataURL] = useState('')
  const [wifiQrCodeURL, setWifiQrCodeURL] = useState('')
  const [menuUrl, setMenuUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [printingStatus, setPrintingStatus] = useState<'idle' | 'preparing' | 'ready' | 'error'>('idle')
  const [isCopied, setIsCopied] = useState(false)
  const [wifiCredentials, setWifiCredentials] = useState<{ network_name: string, password: string } | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
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
        
        // Define color options for QR codes
        const qrColorOptions = {
          width: 300,
          margin: 1,
          color: {
            dark: '#5e2bff',
            light: '#ffffff'
          }
        }
        
        const qrCode = await QRCode.toDataURL(guestUrl, qrColorOptions)
        setQrCodeDataURL(qrCode)
        
        // Fetch WiFi credentials
        const { data: wifiData, error: wifiError } = await supabase
          .from('wifi_credentials')
          .select('network_name, password')
          .eq('property_id', propertyId)
          .single()
        
        if (!wifiError && wifiData) {
          setWifiCredentials(wifiData)
          
          // Generate WiFi QR code with same color scheme
          const wifiString = `WIFI:T:WPA;S:${wifiData.network_name};P:${wifiData.password};;`
          const wifiQrCode = await QRCode.toDataURL(wifiString, {
            ...qrColorOptions,
            errorCorrectionLevel: 'H'
          })
          setWifiQrCodeURL(wifiQrCode)
        }
        
        setLoading(false)
      } catch (error: any) {
        console.error('Error:', error)
        setError(error.message)
        setLoading(false)
      }
    }

    fetchData()
  }, [propertyId, user])

  // Generate preview when required data is loaded
  useEffect(() => {
    if (qrCodeDataURL && propertyName) {
      generatePreview()
    }
  }, [qrCodeDataURL, wifiQrCodeURL, propertyName])

  const generatePreview = async () => {
    try {
      if (!qrCodeDataURL) return
      
      // Load all necessary images first
      const frameImg = new window.Image()
      const qrImg = new window.Image()
      let wifiImg = null
      
      // Make sure the QR code and frame are loaded
      await new Promise((resolve, reject) => {
        let loadedCount = 0
        const totalImages = wifiQrCodeURL ? 3 : 2
        
        const onLoad = () => {
          loadedCount++
          if (loadedCount === totalImages) resolve(true)
        }
        
        frameImg.onload = onLoad
        qrImg.onload = onLoad
        frameImg.onerror = reject
        qrImg.onerror = reject
        
        frameImg.src = frameImagePath
        qrImg.src = qrCodeDataURL
        
        // Load WiFi QR code if available
        if (wifiQrCodeURL) {
          wifiImg = new window.Image()
          wifiImg.onload = onLoad
          wifiImg.onerror = reject
          wifiImg.src = wifiQrCodeURL
        }
      })
      
      // Create canvas with the same dimensions as the frame
      const canvas = document.createElement('canvas')
      canvas.width = frameImg.width 
      canvas.height = frameImg.height
      const ctx = canvas.getContext('2d')
      
      if (!ctx) return
      
      // Draw the frame first
      ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height)
      
      // Draw the main QR code positioned in the center of the designated area
      const qrSize = Math.min(canvas.width, canvas.height) * 0.42 // Reduced to 40% of the smallest dimension
      const qrX = (canvas.width - qrSize) / 2
      const qrY = canvas.height * 0.36 // Positioned at 40% from the top
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)
      
      // Draw the WiFi QR code if available
      if (wifiImg && wifiQrCodeURL) {
        const wifiQrSize = qrSize * 0.6 // WiFi QR is 40% the size of the main QR
        const wifiQrX = canvas.width * 0.6 // Moved more to the left (was 0.65)
        const wifiQrY = canvas.height * 0.75 // Moved more to the top (was 0.85)
        ctx.drawImage(wifiImg, wifiQrX, wifiQrY, wifiQrSize, wifiQrSize)
      }
      
      // Get the preview image URL
      setPreviewUrl(canvas.toDataURL('image/png'))
    } catch (error) {
      console.error('Error generating preview:', error)
    }
  }

  const handlePrintQR = async () => {
    try {
      setPrintingStatus('preparing')
      
      // Create a canvas to combine QR code with frame
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error("Could not get canvas context")
      }
      
      // Set canvas size to match the frame
      canvas.width = 600
      canvas.height = 600
      
      // Load the frame image and QR code
      const frameImg = new window.Image()
      const qrImg = new window.Image()
      
      // Create a promise to wait for both images to load
      const loadImages = new Promise((resolve, reject) => {
        let loadedCount = 0
        
        const onLoad = () => {
          loadedCount++
          if (loadedCount === 2) resolve(true)
        }
        
        frameImg.onload = onLoad
        qrImg.onload = onLoad
        frameImg.onerror = reject
        qrImg.onerror = reject
        
        frameImg.src = frameImagePath
        qrImg.src = qrCodeDataURL
      })
      
      await loadImages
      
      // Draw frame first
      ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height)
      
      // Draw QR code in the center
      const qrSize = 300
      const qrX = (canvas.width - qrSize) / 2
      const qrY = (canvas.height - qrSize) / 2
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)
      
      // Get the combined image URL
      const combinedQrDataUrl = canvas.toDataURL('image/png')
      
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
      printWindow.document.write('<img src="' + combinedQrDataUrl + '" style="width:400px;height:400px;" />')
      printWindow.document.write('</div>')
      printWindow.document.write('<p style="font-family:Arial,sans-serif;color:#666;">Scan this QR code to access information</p>')
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

  const downloadQRCode = async () => {
    try {
      if (!previewUrl) {
        throw new Error('Preview not generated yet')
      }
      
      console.log("Starting download with preview image")
      
      // Create a PDF document in A4 format
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      // Load the preview image
      const img = new window.Image()
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = previewUrl
      })
      
      // Calculate dimensions to fit A4 keeping aspect ratio
      const a4Width = 210 // A4 width in mm
      const a4Height = 297 // A4 height in mm
      
      // Calculate the scaling ratio
      const aspectRatio = img.width / img.height
      
      // Determine dimensions based on aspect ratio
      let imgWidth, imgHeight
      
      if (aspectRatio > a4Width / a4Height) {
        // Image is wider than A4 proportionally
        imgWidth = a4Width
        imgHeight = a4Width / aspectRatio
      } else {
        // Image is taller than A4 proportionally
        imgHeight = a4Height
        imgWidth = a4Height * aspectRatio
      }
      
      // Center the image on the page
      const x = (a4Width - imgWidth) / 2
      const y = (a4Height - imgHeight) / 2
      
      // Add image to PDF
      doc.addImage(previewUrl, 'PNG', x, y, imgWidth, imgHeight)
      
      // Save the PDF
      doc.save(`guestify-qr-${propertyName.replace(/\s+/g, '-').toLowerCase()}.pdf`)
      
      toast.success('QR Code downloaded successfully')
    } catch (error: any) {
      console.error('Error downloading QR code:', error)
      toast.error('Error downloading QR code')
    }
  }

  const copyUrlToClipboard = () => {
    navigator.clipboard.writeText(menuUrl)
      .then(() => {
        setIsCopied(true)
        toast.success('URL copied to clipboard')
        setTimeout(() => setIsCopied(false), 2000)
      })
      .catch((err) => {
        console.error('Failed to copy URL: ', err)
        toast.error('Failed to copy URL')
      })
  }

  return (
    <Layout title={`QR Code - ${propertyName}`}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center mb-6">
          <Link href={`/dashboard/property/${propertyId}/house-info`} className="text-indigo-600 hover:text-indigo-800 mr-4">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">QR Code for {propertyName}</h1>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="w-12 h-12 border-4 border-t-[#5E2BFF] border-b-[#5E2BFF] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading QR code...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-8">
            <div className="max-w-md mx-auto">
              <h2 className="text-xl font-semibold mb-6 text-center">QR Code for Guestify</h2>
              <p className="mb-6 text-gray-600 text-center">
                Place this QR code in your property so guests can easily access information.
              </p>

              {/* Frame Preview Display */}
              <div className="mb-6 mx-auto overflow-hidden flex justify-center" ref={qrRef}>
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="QR Code Preview" 
                    className="w-full max-w-md object-contain"
                  />
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <p>Generazione anteprima...</p>
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
                      Preparing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                      </svg>
                      Print QR Code
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
                  Download QR Code
                </button>
              </div>

              <div className="mt-8">
                <h3 className="font-semibold text-lg mb-3">What's included in the QR code page?</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  <li>House Information</li>
                  <li>Extra Services</li>
                  <li>House Rules</li>
                  <li>WiFi Connection</li>
                  <li>City Guides</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}