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
      },
      global: {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
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
    
    // Definizione delle interfacce
    interface HowThingsWorkItem {
      title: string;
      description: string;
      display_order: number;
    }
    
    interface ProvidedItem {
      name: string;
      description: string;
      quantity: number;
      display_order: number;
    }
    
    // 1. Create base property
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .insert([
        {
          host_id: userId,
          name: "Example House Guestify",
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
    
    // 6. Add room categories for "How Things Work"
    const roomCategories = [
      { name: "Kitchen", display_order: 0 },
      { name: "Living Room", display_order: 1 },
      { name: "Bathroom", display_order: 2 },
      { name: "Bedroom", display_order: 3 }
    ]
    
    // Create room categories and their items
    for (const [index, category] of roomCategories.entries()) {
      const { data: categoryData, error: categoryError } = await supabase
        .from('room_categories')
        .insert([
          {
            property_id: propertyId,
            name: category.name,
            display_order: index
          }
        ])
        .select()
        .single()
      
      if (categoryError) {
        console.error(`Error creating room category ${category.name}:`, categoryError)
        continue // Continue with next category
      }
      
      const categoryId = categoryData.id
      
      // Add items for each category
      let itemsForCategory: HowThingsWorkItem[] = []
      
      switch (category.name) {
        case "Kitchen":
          itemsForCategory = [
            { 
              title: "Coffee Machine", 
              description: "Use only compatible pods. Add water to the tank, insert pod, and press the button.",
              display_order: 0
            },
            { 
              title: "Dishwasher", 
              description: "Add detergent to the dispenser, select program and press start. Please run only when full.",
              display_order: 1
            }
          ]
          break
        case "Living Room":
          itemsForCategory = [
            { 
              title: "Smart TV", 
              description: "Use the black remote. Netflix and other streaming services are already logged in.",
              display_order: 0
            },
            { 
              title: "Air Conditioning", 
              description: "Use the remote on the coffee table. Set between 20-24°C for optimal comfort.",
              display_order: 1
            }
          ]
          break
        case "Bathroom":
          itemsForCategory = [
            { 
              title: "Shower", 
              description: "Turn the left handle for temperature and right handle for water pressure.",
              display_order: 0
            },
            { 
              title: "Washing Machine", 
              description: "Use program 2 for regular wash. Detergent is provided under the sink.",
              display_order: 1
            }
          ]
          break
        case "Bedroom":
          itemsForCategory = [
            { 
              title: "Safe", 
              description: "Located in the wardrobe. Set your own 4-digit code by pressing 'set' followed by your code.",
              display_order: 0
            },
            { 
              title: "Heating Control", 
              description: "Adjust the thermostat on the wall. Please turn off when opening windows.",
              display_order: 1
            }
          ]
          break
      }
      
      // Add items for this category
      for (const [itemIndex, item] of itemsForCategory.entries()) {
        // Get appropriate image URL based on item title
        let imagePath = ""
        
        switch (item.title) {
          case "Coffee Machine":
            imagePath = "https://images.unsplash.com/photo-1505275350441-83dcda8eeef5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=60"
            break
          case "Dishwasher":
            imagePath = "https://images.unsplash.com/photo-1581622558663-b2e33377dfb2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=60"
            break
          case "Smart TV":
            imagePath = "https://images.unsplash.com/photo-1539786774573-1a6452239be7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=60"
            break
          case "Air Conditioning":
            imagePath = "https://images.unsplash.com/photo-1652645607746-474d1636be68?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=60"
            break
          case "Shower":
            imagePath = "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=60"
            break
          case "Washing Machine":
            imagePath = "https://images.unsplash.com/photo-1595831377229-8039cf198b3f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=60"
            break
          case "Safe":
            imagePath = "https://images.unsplash.com/photo-1601760561441-16420502c7e0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=60"
            break
          case "Heating Control":
            imagePath = "https://images.unsplash.com/photo-1613204124306-daec3676d63b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=60"
            break
          default:
            // Fallback image if none of the specific items match
            imagePath = "https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=60"
        }
        
        const { error: itemError } = await supabase
          .from('how_things_work_items')
          .insert([
            {
              category_id: categoryId,
              title: item.title,
              description: item.description,
              display_order: itemIndex,
              image_url: imagePath
            }
          ])
        
        if (itemError) {
          console.error(`Error creating how things work item ${item.title}:`, itemError)
          // Continue anyway
        }
      }
    }
    
    // 7. Add check-in information sections
    const checkinSections = [
      {
        section_type: "access_and_keys",
        content: JSON.stringify({
          subtype: "access_and_keys",
          content: "The keys are in a lockbox next to the main entrance. The code to access the lockbox is 1234. Once you retrieve the keys, the main door key is the silver one, while the gold one is for your apartment door (3rd floor). There is also a small key for the mailbox in the lobby."
        })
      },
      {
        section_type: "checkin_time",
        content: JSON.stringify({
          subtype: "checkin_time",
          content: "Check-in is available from 3:00 PM to 8:00 PM. If you need to check in outside these hours, please contact us at least 24 hours in advance. Late check-in after 8:00 PM incurs a fee of €20, and check-ins after 11:00 PM might not be possible. Please provide your estimated arrival time so we can ensure someone is available to assist you."
        })
      },
      {
        section_type: "parking_info",
        content: JSON.stringify({
          subtype: "parking_info",
          content: "There is a public parking garage two blocks away on Baker Street (£25/day). Street parking is also available with restrictions (free from 8:00 PM to 8:00 AM, paid during the day). We recommend using the underground as the station is just a 5-minute walk from the apartment. If you need a parking permit for your stay, please let us know in advance."
        })
      }
    ]
    
    for (const section of checkinSections) {
      const { error: sectionError } = await supabase
        .from('house_info')
        .insert([
          {
            property_id: propertyId,
            section_type: "checkin_information", // Using standard section type
            content: section.content // Store subtype in content as JSON
          }
        ])
      
      if (sectionError) {
        console.error(`Error creating checkin information section ${section.section_type}:`, sectionError)
        // Continue anyway
      }
    }
    
    // 8. Add general house info sections
    const houseInfoSections = [
      {
        section_type: "checkin_information",
        content: "Please arrive during check-in hours (3:00 PM - 8:00 PM). The keys are in a lockbox by the entrance. You'll find detailed instructions in the Check-in Information section."
      },
      {
        section_type: "before_you_leave",
        content: "Before leaving, please ensure all windows are closed, turn off all lights and appliances. Dispose of any garbage in the designated bins outside. Return the keys to the lockbox using the same code."
      },
      {
        section_type: "checkout_information",
        content: "Check-out time is 11:00 AM. Late check-out may be possible depending on our schedule - please inquire at least 24 hours in advance. Leave the keys in the lockbox when you depart."
      },
      {
        section_type: "useful_contacts",
        content: JSON.stringify({
          email: "host@templatehouse.com",
          phoneNumber: "+44 7123 456789",
          textNumber: "+44 7123 456789",
          policeNumber: "101 (non-emergency) or 999 (emergency)",
          ambulanceNumber: "999 or 112",
          fireNumber: "999 or 112",
          additionalInfo: "Local doctor: Dr. Smith at London Medical Centre - +44 20 1234 5678\nNearest pharmacy: Central Pharmacy - 125 High Street (open 24/7)\nProperty manager: Sarah Johnson - +44 7890 123456\nLocal taxi service: London Cabs - +44 20 8765 4321\nNearest tube station: Baker Street (5 min walk)"
        })
      },
      {
        section_type: "book_again",
        content: JSON.stringify({
          text: "Thank you for choosing Template House for your stay in London! We'd be delighted to welcome you back on your next visit. Book directly with us to receive 10% off your next stay! We also offer special rates for returning guests and extended stays.\n\nFor direct bookings, contact us at: bookings@templatehouse.com or call/text +44 7123 456789.\n\nYou can also book through our partner websites using the links below.",
          image_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aG90ZWwlMjBib29raW5nfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60"
        })
      }
    ]
    
    for (const section of houseInfoSections) {
      const { error: infoError } = await supabase
        .from('house_info')
        .insert([
          {
            property_id: propertyId,
            section_type: section.section_type,
            content: section.content
          }
        ])
      
      if (infoError) {
        console.error(`Error creating house info section ${section.section_type}:`, infoError)
        // Continue anyway
      }
    }
    
    // Add property listing links for "Book Again"
    const propertyLinks = [
      {
        name: "Airbnb",
        url: "https://www.airbnb.com/template-house",
        logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Airbnb_logo_bélo.svg/2560px-Airbnb_logo_bélo.svg.png"
      },
      {
        name: "Booking.com",
        url: "https://www.booking.com/template-house",
        logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Booking.com_logo.svg/2560px-Booking.com_logo.svg.png"
      }
    ]
    
    for (const link of propertyLinks) {
      const { error: linkError } = await supabase
        .from('property_listing_links')
        .insert([
          {
            property_id: propertyId,
            name: link.name,
            url: link.url,
            logo_url: link.logo_url
          }
        ])
      
      if (linkError) {
        console.error(`Error creating property listing link ${link.name}:`, linkError)
        // Continue anyway
      }
    }
    
    // 9. Add provided categories and items for "Before You Leave"
    const providedCategories = [
      {
        name: "Cleaning Supplies",
        display_order: 0,
        items: [
          {
            name: "Vacuum Cleaner",
            description: "Located in the utility closet. Please vacuum all floors except bathroom.",
            quantity: 1,
            display_order: 0
          },
          {
            name: "Disinfectant Spray",
            description: "Please use on kitchen countertops and bathroom surfaces before leaving.",
            quantity: 2,
            display_order: 1
          }
        ]
      },
      {
        name: "Keys & Access",
        display_order: 1,
        items: [
          {
            name: "Key Set",
            description: "Please leave all keys in the lockbox using code 1234.",
            quantity: 1,
            display_order: 0
          },
          {
            name: "Parking Permit",
            description: "Return the parking permit to the folder in the entry table drawer.",
            quantity: 1,
            display_order: 1
          }
        ]
      }
    ]
    
    // Create provided categories and their items
    for (const [index, category] of providedCategories.entries()) {
      const { data: categoryData, error: categoryError } = await supabase
        .from('provided_categories')
        .insert([
          {
            property_id: propertyId,
            name: category.name,
            display_order: index
          }
        ])
        .select()
        .single()
      
      if (categoryError) {
        console.error(`Error creating provided category ${category.name}:`, categoryError)
        continue // Continue with next category
      }
      
      const categoryId = categoryData.id
      
      // Add items for this category
      for (const [itemIndex, item] of category.items.entries()) {
        const { error: itemError } = await supabase
          .from('provided_items')
          .insert([
            {
              category_id: categoryId,
              name: item.name,
              description: item.description,
              quantity: item.quantity,
              display_order: itemIndex
            }
          ])
        
        if (itemError) {
          console.error(`Error creating provided item ${item.name}:`, itemError)
          // Continue anyway
        }
      }
    }
    
    // 10. Add information needed for "Before You Leave"
    const { error: infoNeededError } = await supabase
      .from('information_needed')
      .insert([
        {
          property_id: propertyId,
          content: "# IMPORTANT INFORMATION WE NEED BEFORE YOUR DEPARTURE\n\nDear Guest,\n\nTo ensure a smooth checkout process and to better prepare for future guests, please provide us with the following information before your departure:\n\n## Required Information:\n\n1. **Exact Departure Time**: Please confirm your checkout time so we can schedule cleaning appropriately. Standard checkout is 11:00 AM.\n\n2. **Lost Items**: Have you misplaced anything during your stay that we should look for?\n\n3. **Maintenance Issues**: Please report any issues with appliances, plumbing, electrical, or structural elements that need our attention.\n\n4. **Damage Report**: Please inform us of any accidental damage (we understand accidents happen!).\n\n5. **Used Amenities**: Which appliances did you use (washing machine, dishwasher, oven, etc.)? This helps us check their condition.\n\n## Optional Feedback:\n\n- What did you enjoy most about your stay?\n- Any suggestions for improvements?\n- Would you recommend our property to others?\n- Anything specific about the neighborhood you found helpful?\n\n## How to Provide This Information:\n\n- **Email**: checkout@templatehouse.com\n- **WhatsApp/Text**: +44 7123 456789\n- **Guest Portal**: Log in to your booking account\n\nThank you for choosing our property for your stay!\n\n— The Template House Team"
        }
      ])
    
    if (infoNeededError) {
      console.error('Error creating information needed:', infoNeededError)
      // Continue anyway
    }
    
    // 11. Add checkout information sections
    const checkoutSections = [
      {
        section_type: "checkout_time",
        content: JSON.stringify({
          subtype: "checkout_time",
          content: "Standard checkout time is 11:00 AM. Please respect this time as we need to prepare the property for the next guests. Late checkout (until 1:00 PM maximum) may be possible depending on availability. Please request late checkout at least 24 hours in advance. A fee of £20 applies for late checkout. If you need to leave very early in the morning, please let us know in advance so we can provide instructions for secure key drop-off."
        })
      },
      {
        section_type: "checkout_process",
        content: JSON.stringify({
          subtype: "checkout_process",
          content: "Before leaving the property, please follow these steps:\n\n1. Strip beds and place used linens in the provided laundry bags\n2. Empty all trash bins and place bags in the designated area\n3. Wash and put away all dishes or load and start the dishwasher\n4. Turn off all lights, heating/AC, and electronic devices\n5. Close and lock all windows\n6. Check all drawers and closets for personal belongings\n7. Leave the keys in the lockbox (code: 1234)\n8. Send us a message when you've left\n\nThank you for your cooperation!"
        })
      }
    ]
    
    for (const section of checkoutSections) {
      const { error: sectionError } = await supabase
        .from('house_info')
        .insert([
          {
            property_id: propertyId,
            section_type: "checkout_information", // Using standard section type
            content: section.content // Store subtype in content as JSON
          }
        ])
      
      if (sectionError) {
        console.error(`Error creating checkout information section ${section.section_type}:`, sectionError)
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