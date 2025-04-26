import { createBrowserClient } from '@supabase/ssr'

// Singleton pattern per il client Supabase
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('Inizializzazione del client Supabase');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Variabili di ambiente Supabase mancanti:', { 
        urlPresente: !!supabaseUrl, 
        keyPresente: !!supabaseKey 
      });
      throw new Error('Configurazione Supabase incompleta');
    }
    
    supabaseInstance = createBrowserClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name) {
          if (typeof document === 'undefined') return ''
          const cookies = document.cookie.split(';').map(c => c.trim())
          const cookie = cookies.find(c => c.startsWith(`${name}=`))
          return cookie ? cookie.split('=')[1] : ''
        },
        set(name, value, options) {
          if (typeof document === 'undefined') return
          let cookie = `${name}=${value}`
          if (options.expires) {
            cookie += `; expires=${options.expires.toUTCString()}`
          }
          if (options.path) {
            cookie += `; path=${options.path}`
          }
          if (options.domain) {
            cookie += `; domain=${options.domain}`
          }
          if (options.sameSite) {
            cookie += `; samesite=${options.sameSite}`
          }
          if (options.secure) {
            cookie += '; secure'
          }
          document.cookie = cookie
        },
        remove(name, options) {
          if (typeof document === 'undefined') return
          this.set(name, '', {
            ...options,
            expires: new Date(0),
          })
        }
      }
    });
    
    console.log('Client Supabase inizializzato con successo');
    return supabaseInstance;
  } catch (error) {
    console.error('Errore nell\'inizializzazione del client Supabase:', error);
    // Fallback a un client base per evitare errori fatali
    supabaseInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
    );
    return supabaseInstance;
  }
}

// Client Supabase esportato come default
export const supabase = getSupabase()

// Funzione di utilità per verificare la connessione a Supabase
export const checkSupabaseConnection = async () => {
  try {
    console.log('Verifica connessione a Supabase...')
    // Eseguiamo una query leggera per verificare la connessione
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (error) {
      return { ok: false, error }
    }

    console.log('Connessione a Supabase OK')
    return { ok: true }
  } catch (e) {
    console.error('Eccezione nella verifica della connessione:', e)
    return { ok: false, error: e }
  }
}

// Funzione per eliminare una proprietà e tutte le risorse correlate
export const deletePropertyWithResources = async (propertyId: string) => {
  try {
    console.log(`Deleting property ${propertyId} and all related resources...`)
    
    // 1. Elimina eventuali servizi extra associati alla proprietà
    const { error: extraServicesError } = await supabase
      .from('extra_services')
      .delete()
      .eq('property_id', propertyId)
    
    if (extraServicesError) {
      console.error('Error deleting extra services:', extraServicesError)
      return { success: false, error: extraServicesError }
    }
    
    // 2. Elimina eventuali regole della casa associate alla proprietà
    const { error: houseRulesError } = await supabase
      .from('house_rules')
      .delete()
      .eq('property_id', propertyId)
    
    if (houseRulesError) {
      console.error('Error deleting house rules:', houseRulesError)
      return { success: false, error: houseRulesError }
    }
    
    // 3. Elimina eventuali configurazioni WiFi associate alla proprietà
    const { error: wifiConfigError } = await supabase
      .from('wifi_credentials')
      .delete()
      .eq('property_id', propertyId)
    
    if (wifiConfigError) {
      console.error('Error deleting WiFi config:', wifiConfigError)
      return { success: false, error: wifiConfigError }
    }
    
    // 4. Elimina eventuali guide della città associate alla proprietà
    const { error: cityGuidesError } = await supabase
      .from('city_guides')
      .delete()
      .eq('property_id', propertyId)
    
    if (cityGuidesError) {
      console.error('Error deleting city guides:', cityGuidesError)
      return { success: false, error: cityGuidesError }
    }
    
    // 5. Infine, elimina la proprietà stessa
    const { error: propertyError } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId)
    
    if (propertyError) {
      console.error('Error deleting property:', propertyError)
      return { success: false, error: propertyError }
    }
    
    console.log(`Property ${propertyId} and all related resources deleted successfully`)
    return { success: true }
  } catch (error) {
    console.error('Exception in deletePropertyWithResources:', error)
    return { success: false, error }
  }
}

// Funzione di utilità per gestire i tentativi di invio
export const fetchWithRetry = async (fn: Function, maxRetries = 3, delay = 1000) => {
  let retries = 0
  
  while (retries < maxRetries) {
    try {
      return await fn()
    } catch (error) {
      retries++
      console.log(`Attempt ${retries} failed. Retrying in ${delay}ms...`)
      
      if (retries >= maxRetries) {
        throw error
      }
      
      await new Promise(resolve => setTimeout(resolve, delay))
      // Aumenta il ritardo per ogni nuovo tentativo (backoff esponenziale)
      delay *= 2
    }
  }
}

// Funzione per creare una proprietà template completa
export const createTemplateProperty = async (userId: string) => {
  try {
    console.log(`Creating template property for user ${userId}...`)
    
    // 1. Create base property
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .insert([
        {
          host_id: userId,
          name: "Template House",
          address: "123 Example Street",
          city: "London",
          state: "Greater London",
          zip: "W1A 1AA",
          country: "United Kingdom",
        }
      ])
      .select()
      .single()
    
    if (propertyError) {
      console.error('Error creating template property:', propertyError)
      return { success: false, error: propertyError }
    }
    
    const propertyId = property.id
    
    // 2. Create WiFi credentials
    const { error: wifiError } = await supabase
      .from('wifi_credentials')
      .insert([
        {
          property_id: propertyId,
          network_name: "GuestifyWiFi",
          password: "welcome2024",
        }
      ])
    
    if (wifiError) {
      console.error('Error creating WiFi credentials:', wifiError)
      // Continue anyway to create as much as possible
    }
    
    // 3. Add house rules
    const houseRules = [
      { title: "Check-in time", description: "Check-in is available from 3:00 PM to 8:00 PM. Please contact the host for late check-in." },
      { title: "Check-out time", description: "Check-out before 11:00 AM. Please leave the keys on the table." },
      { title: "No parties or events", description: "Please respect the neighbors and keep noise levels down." },
      { title: "No smoking", description: "Smoking is not allowed inside the property." },
      { title: "Pets", description: "Sorry, pets are not allowed." }
    ]
    
    for (const rule of houseRules) {
      const { error } = await supabase
        .from('house_rules')
        .insert([
          {
            property_id: propertyId,
            title: rule.title,
            description: rule.description
          }
        ])
      
      if (error) {
        console.error('Error creating house rule:', error)
        // Continue anyway
      }
    }
    
    // 4. Add extra services
    const extraServices = [
      { title: "Breakfast", description: "Continental breakfast delivered to your room", price: 15, category: "Food" },
      { title: "Airport Transfer", description: "Private transfer from/to the airport", price: 50, category: "Transport" },
      { title: "Extra Cleaning", description: "Additional cleaning service during your stay", price: 30, category: "Cleaning" },
      { title: "Late Check-out", description: "Extended check-out until 2:00 PM", price: 25, category: "Accommodation" }
    ]
    
    for (const service of extraServices) {
      const { error } = await supabase
        .from('extra_services')
        .insert([
          {
            property_id: propertyId,
            title: service.title,
            description: service.description,
            price: service.price,
            active: true,
            category: service.category
          }
        ])
      
      if (error) {
        console.error('Error creating extra service:', error)
        // Continue anyway
      }
    }
    
    // 5. Add city guide entry (note: without actual file, just DB record)
    const { error: guideError } = await supabase
      .from('city_guides')
      .insert([
        {
          property_id: propertyId,
          title: "London City Guide",
          file_path: "city-guides/template-guide.pdf"
        }
      ])
    
    if (guideError) {
      console.error('Error creating city guide:', guideError)
      // Continue anyway
    }
    
    // 6. Add how things work items
    const howThingsWorkItems = [
      { title: "Heating System", description: "The heating control is located in the hallway. Turn the dial clockwise to increase temperature." },
      { title: "Smart TV", description: "Use the black remote to turn on the TV. Netflix and other streaming services are available." },
      { title: "Washing Machine", description: "The washing machine is in the bathroom. Please use only the provided detergent." }
    ]
    
    for (const item of howThingsWorkItems) {
      const { error } = await supabase
        .from('how_things_work')
        .insert([
          {
            property_id: propertyId,
            title: item.title,
            description: item.description
          }
        ])
      
      if (error) {
        console.error('Error creating how things work item:', error)
        // Continue anyway
      }
    }
    
    console.log(`Template property ${propertyId} created successfully`)
    return { success: true, propertyId }
  } catch (error) {
    console.error('Exception in createTemplateProperty:', error)
    return { success: false, error }
  }
}