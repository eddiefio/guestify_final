'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/layout/Layout'
import Link from 'next/link'
import toast from 'react-hot-toast'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useForm } from 'react-hook-form'
import QRCode from 'qrcode'
import { jsPDF } from 'jspdf'

type WifiCredentials = {
  id: string
  property_id: string
  network_name: string
  password: string
  created_at: string
}

type FormValues = {
  network_name: string
  password: string
}

export default function WifiConnection() {
  const { propertyId } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [wifiCredentials, setWifiCredentials] = useState<WifiCredentials | null>(null)
  const [propertyName, setPropertyName] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>()

  useEffect(() => {
    if (!user || !propertyId) return
    
    const fetchWifiCredentials = async () => {
      try {
        setLoading(true)
        
        // Fetch property details to verify ownership and get name
        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select('name, host_id')
          .eq('id', propertyId)
          .single()
        
        if (propertyError) throw propertyError
        
        if (propertyData.host_id !== user.id) {
          toast.error('Unauthorized access')
          router.push('/dashboard')
          return
        }
        
        setPropertyName(propertyData.name)
        
        // Fetch wifi credentials
        const { data, error } = await supabase
          .from('wifi_credentials')
          .select('*')
          .eq('property_id', propertyId)
          .single()
        
        if (error) {
          if (error.code !== 'PGRST116') { // Record not found error
            throw error
          }
        } else {
          setWifiCredentials(data)
          setValue('network_name', data.network_name)
          setValue('password', data.password)
          
          // Generate QR code for existing credentials
          await generateQRCode(data.network_name, data.password)
        }
        
      } catch (error) {
        console.error('Error fetching wifi credentials:', error)
        toast.error('Failed to load wifi credentials')
      } finally {
        setLoading(false)
      }
    }
    
    fetchWifiCredentials()
  }, [user, propertyId, router, setValue])
  
  const onSubmit = async (data: FormValues) => {
    if (!user || !propertyId) return
    
    try {
      setSaving(true)
      
      const wifiData = {
        property_id: propertyId as string,
        network_name: data.network_name,
        password: data.password
      }
      
      if (wifiCredentials) {
        // Update existing credentials
        const { error } = await supabase
          .from('wifi_credentials')
          .update(wifiData)
          .eq('id', wifiCredentials.id)
        
        if (error) throw error
      } else {
        // Insert new credentials
        const { error } = await supabase
          .from('wifi_credentials')
          .insert([wifiData])
        
        if (error) throw error
      }
      
      // Fetch the updated data
      const { data: updatedData, error: fetchError } = await supabase
        .from('wifi_credentials')
        .select('*')
        .eq('property_id', propertyId)
        .single()
      
      if (fetchError) throw fetchError
      setWifiCredentials(updatedData)
      
      // Generate QR code for the saved credentials
      await generateQRCode(data.network_name, data.password)
      
      toast.success('WiFi credentials saved successfully')
    } catch (error) {
      console.error('Error saving wifi credentials:', error)
      toast.error('Failed to save wifi credentials')
    } finally {
      setSaving(false)
    }
  }
  
  const generateQRCode = async (networkName: string, password: string) => {
    try {
      // Format for WiFi QR code: WIFI:T:WPA;S:SSID;P:PASSWORD;;
      const wifiString = `WIFI:T:WPA;S:${networkName};P:${password};;`
      
      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(wifiString, {
        errorCorrectionLevel: 'H',
        margin: 4,
        width: 300
      })
      
      setQrCodeUrl(qrCodeDataUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
      toast.error('Failed to generate QR code')
    }
  }
  
  const downloadQRCodePDF = () => {
    if (!qrCodeUrl || !propertyName) return
    
    try {
      // Create PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      // Add title
      doc.setFontSize(20)
      doc.setTextColor(94, 43, 255) // #5E2BFF
      doc.text(`WiFi for ${propertyName}`, 105, 30, { align: 'center' })
      
      // Add network info
      doc.setFontSize(14)
      doc.setTextColor(0, 0, 0)
      doc.text(`Network: ${wifiCredentials?.network_name || ''}`, 105, 45, { align: 'center' })
      doc.text(`Password: ${wifiCredentials?.password || ''}`, 105, 55, { align: 'center' })
      
      // Add instruction
      doc.setFontSize(12)
      doc.text('Scan this QR code to connect automatically to the WiFi network', 105, 70, { align: 'center' })
      
      // Add QR code
      doc.addImage(qrCodeUrl, 'PNG', 65, 80, 80, 80)
      
      // Add footer
      doc.setFontSize(10)
      doc.setTextColor(128, 128, 128)
      doc.text('Powered by Guestify', 105, 180, { align: 'center' })
      
      // Save PDF
      doc.save(`WiFi-${propertyName}.pdf`)
      
      toast.success('PDF downloaded successfully')
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Failed to download PDF')
    }
  }

  return (
    <ProtectedRoute>
      <Layout title={`WiFi Connection - ${propertyName}`}>
        <div className="container mx-auto px-4 py-6 font-spartan">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8">
            <div>
              <Link 
                href="/dashboard" 
                className="inline-flex items-center text-[#5E2BFF] hover:underline mb-4"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Back to Dashboard
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">WiFi Connection for {propertyName}</h1>
              <p className="text-gray-600 mt-1">Manage WiFi credentials for your property</p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-[#5E2BFF] border-t-[#ffde59] rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">Loading WiFi credentials...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* WiFi Form */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">WiFi Credentials</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label htmlFor="network_name" className="block text-sm font-medium text-gray-700 mb-1">Network Name (SSID)</label>
                    <input
                      id="network_name"
                      type="text"
                      {...register('network_name', { required: 'Network name is required' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                      placeholder="Enter WiFi network name"
                    />
                    {errors.network_name && (
                      <p className="mt-1 text-sm text-red-500">{errors.network_name.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      id="password"
                      type="text"
                      {...register('password', { required: 'Password is required' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E2BFF]"
                      placeholder="Enter WiFi password"
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-[#5E2BFF] text-white px-4 py-2 rounded-lg hover:bg-[#4c22cc] transition duration-200 font-bold shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <span className="inline-flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      'Save WiFi Credentials'
                    )}
                  </button>
                </form>
              </div>
              
              {/* QR Code Display and Download */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">WiFi QR Code</h2>
                
                {qrCodeUrl ? (
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                      <img src={qrCodeUrl} alt="WiFi QR Code" className="w-full max-w-[250px]" />
                    </div>
                    
                    <div className="mb-6 text-center">
                      <p className="font-bold">Network: {wifiCredentials?.network_name}</p>
                      <p className="font-bold">Password: {wifiCredentials?.password}</p>
                    </div>
                    
                    <button
                      onClick={downloadQRCodePDF}
                      className="bg-[#ffde59] text-black px-4 py-2 rounded-lg hover:bg-[#f8c70a] transition duration-200 font-bold shadow-sm flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      Download PDF
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-lg">
                    <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path>
                    </svg>
                    <p className="text-gray-600 text-center">Enter and save WiFi credentials to generate a QR code</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
} 