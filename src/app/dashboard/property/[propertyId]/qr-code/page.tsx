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
        
        const qrCode = await QRCode.toDataURL(guestUrl, {
          width: 300,
          margin: 1,
          color: {
            dark: '#5e2bff',
            light: '#ffffff'
          }
        })
        setQrCodeDataURL(qrCode)
        
        // Fetch WiFi credentials
        const { data: wifiData, error: wifiError } = await supabase
          .from('wifi_credentials')
          .select('network_name, password')
          .eq('property_id', propertyId)
          .single()
        
        if (!wifiError && wifiData) {
          setWifiCredentials(wifiData)
          
          // Generate WiFi QR code
          const wifiString = `WIFI:T:WPA;S:${wifiData.network_name};P:${wifiData.password};;`
          const wifiQrCode = await QRCode.toDataURL(wifiString, {
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 150
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
      
      // Create a canvas for the preview
      const canvas = document.createElement('canvas')
      // Set the canvas to A4 proportions (210×297mm = 794×1123px at 96 DPI)
      const scale = 1.0 // Aumentato per riempire meglio lo spazio
      canvas.width = 794 * scale
      canvas.height = 1123 * scale
      const ctx = canvas.getContext('2d')
      
      if (!ctx) return
      
      // Fill with white background
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // A4 dimensions in px
      const pageWidth = canvas.width
      const pageHeight = canvas.height
      
      // Draw title
      ctx.font = `bold ${28 * scale}px Arial`
      ctx.fillStyle = '#5E2BFF'
      ctx.textAlign = 'center'
      ctx.fillText('Guestify', pageWidth / 2, 60 * scale)
      
      // Draw property name
      ctx.font = `bold ${22 * scale}px Arial`
      ctx.fillStyle = '#000000'
      ctx.fillText(propertyName, pageWidth / 2, 100 * scale)
      
      // Load the frame image and QR code
      const frameImg = new window.Image()
      const qrImg = new window.Image()
      
      // Create a promise to wait for both images to load
      await new Promise((resolve, reject) => {
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
      
      // Create QR code with frame on a separate canvas
      const qrCanvas = document.createElement('canvas')
      qrCanvas.width = 600
      qrCanvas.height = 600
      const qrCtx = qrCanvas.getContext('2d')
      
      if (!qrCtx) return
      
      // Draw frame first
      qrCtx.drawImage(frameImg, 0, 0, qrCanvas.width, qrCanvas.height)
      
      // Draw QR code in the center (make it slightly smaller)
      const qrSize = 280 // Reduced from 300
      const qrX = (qrCanvas.width - qrSize) / 2
      const qrY = (qrCanvas.height - qrSize) / 2
      qrCtx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)
      
      // Add the framed QR code to the preview
      const qrWidth = 320 * scale // Increased size
      const qrHeight = 320 * scale // Increased size
      const qrX1 = (pageWidth - qrWidth) / 2
      const qrY1 = 140 * scale
      ctx.drawImage(qrCanvas, 0, 0, qrCanvas.width, qrCanvas.height, qrX1, qrY1, qrWidth, qrHeight)
      
      // Add description
      ctx.font = `${16 * scale}px Arial`
      ctx.fillStyle = '#000000'
      ctx.textAlign = 'center'
      ctx.fillText('Scan this QR code to access all information about this property', pageWidth / 2, qrY1 + qrHeight + 30 * scale)
      
      // Add info about what's included
      ctx.font = `bold ${18 * scale}px Arial`
      ctx.fillStyle = '#5E2BFF'
      ctx.textAlign = 'left'
      ctx.fillText("What's included:", 60 * scale, qrY1 + qrHeight + 70 * scale)
      
      // Add list of features
      ctx.font = `${16 * scale}px Arial`
      ctx.fillStyle = '#000000'
      const features = [
        'House Information',
        'Extra Services',
        'House Rules',
        'WiFi Connection',
        'City Guides'
      ]
      
      features.forEach((feature, index) => {
        ctx.fillText(`• ${feature}`, 70 * scale, qrY1 + qrHeight + 100 * scale + (index * 30 * scale))
      })
      
      // Add WiFi QR code if available
      if (wifiQrCodeURL && wifiCredentials) {
        // Add WiFi QR code to bottom right
        const wifiQrSize = 100 * scale // Increased size
        const wifiQrX = pageWidth - wifiQrSize - 60 * scale
        const wifiQrY = pageHeight - wifiQrSize - 80 * scale
        
        const wifiImg = new window.Image()
        wifiImg.src = wifiQrCodeURL
        
        await new Promise((resolve) => {
          wifiImg.onload = resolve
        })
        
        ctx.drawImage(wifiImg, wifiQrX, wifiQrY, wifiQrSize, wifiQrSize)
        
        // Add WiFi details
        ctx.font = `bold ${14 * scale}px Arial`
        ctx.textAlign = 'right'
        ctx.fillText('WiFi Connection', wifiQrX - 10 * scale, wifiQrY - 15 * scale)
        ctx.font = `${12 * scale}px Arial`
        ctx.fillText(`Network: ${wifiCredentials.network_name}`, wifiQrX - 10 * scale, wifiQrY - 0 * scale)
        ctx.fillText(`Password: ${wifiCredentials.password}`, wifiQrX - 10 * scale, wifiQrY + 15 * scale)
      }
      
      // Add footer
      ctx.font = `${12 * scale}px Arial`
      ctx.fillStyle = '#808080'
      ctx.textAlign = 'center'
      ctx.fillText('Powered by Guestify', pageWidth / 2, pageHeight - 30 * scale)
      ctx.font = `${10 * scale}px Arial`
      ctx.fillText(menuUrl, pageWidth / 2, pageHeight - 15 * scale)
      
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
      if (!qrCodeDataURL) {
        throw new Error('QR code not generated yet')
      }
      
      // Create a PDF document (A4 format)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      // A4 dimensions in mm
      const pageWidth = 210
      const pageHeight = 297
      
      // Add title
      doc.setFontSize(24)
      doc.setTextColor(94, 43, 255) // #5E2BFF
      doc.text('Guestify', pageWidth / 2, 30, { align: 'center' })
      
      // Add property name
      doc.setFontSize(18)
      doc.setTextColor(0, 0, 0)
      doc.text(propertyName, pageWidth / 2, 45, { align: 'center' })
      
      // Load the frame image
      const frameImg = new window.Image()
      frameImg.src = frameImagePath
      
      // Wait for the frame to load
      await new Promise((resolve, reject) => {
        frameImg.onload = resolve
        frameImg.onerror = reject
      })
      
      // Create a canvas to combine QR code with frame
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error("Could not get canvas context")
      }
      
      // Set canvas size to match the frame
      canvas.width = 600
      canvas.height = 600
      
      // Draw frame first
      ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height)
      
      // Draw QR code in the center (make it slightly smaller)
      const qrSize = 280 // Reduced from 300
      const qrX = (canvas.width - qrSize) / 2
      const qrY = (canvas.height - qrSize) / 2
      
      const qrImg = new window.Image()
      qrImg.src = qrCodeDataURL
      
      // Wait for QR code to load
      await new Promise((resolve, reject) => {
        qrImg.onload = resolve
        qrImg.onerror = reject
      })
      
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)
      
      // Get the combined image URL
      const combinedQrDataUrl = canvas.toDataURL('image/png')
      
      // Add the main QR code to the PDF (centered)
      const qrWidth = 150
      const qrHeight = 150
      const qrX1 = (pageWidth - qrWidth) / 2
      const qrY1 = 70
      doc.addImage(combinedQrDataUrl, 'PNG', qrX1, qrY1, qrWidth, qrHeight)
      
      // Add description
      doc.setFontSize(12)
      doc.text('Scan this QR code to access all information about this property', pageWidth / 2, qrY1 + qrHeight + 15, { align: 'center' })
      
      // Add info about what's included
      doc.setFontSize(14)
      doc.setTextColor(94, 43, 255)
      doc.text("What's included:", 20, qrY1 + qrHeight + 35)
      
      // Add list of features
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      const features = [
        'House Information',
        'Extra Services',
        'House Rules',
        'WiFi Connection',
        'City Guides'
      ]
      
      features.forEach((feature, index) => {
        doc.text(`• ${feature}`, 25, qrY1 + qrHeight + 50 + (index * 8))
      })
      
      // Add WiFi QR code if available
      if (wifiQrCodeURL && wifiCredentials) {
        // Add WiFi QR code to bottom right
        const wifiQrSize = 50
        const wifiQrX = pageWidth - wifiQrSize - 20
        const wifiQrY = pageHeight - wifiQrSize - 40
        
        doc.addImage(wifiQrCodeURL, 'PNG', wifiQrX, wifiQrY, wifiQrSize, wifiQrSize)
        
        // Add WiFi details
        doc.setFontSize(10)
        doc.text('WiFi Connection', wifiQrX - 10, wifiQrY - 8, { align: 'right' })
        doc.setFontSize(8)
        doc.text(`Network: ${wifiCredentials.network_name}`, wifiQrX - 10, wifiQrY - 3, { align: 'right' })
        doc.text(`Password: ${wifiCredentials.password}`, wifiQrX - 10, wifiQrY + 2, { align: 'right' })
      }
      
      // Add footer
      doc.setFontSize(10)
      doc.setTextColor(128, 128, 128)
      doc.text('Powered by Guestify', pageWidth / 2, pageHeight - 10, { align: 'center' })
      doc.text(menuUrl, pageWidth / 2, pageHeight - 5, { align: 'center' })
      
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

              {/* A4 Preview Display */}
              <div className="mb-6 border border-gray-300 rounded-lg bg-gray-50 mx-auto overflow-hidden" ref={qrRef}>
                {previewUrl ? (
                  <div>
                    <img 
                      src={previewUrl} 
                      alt="PDF Preview" 
                      className="w-full"
                    />
                  </div>
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