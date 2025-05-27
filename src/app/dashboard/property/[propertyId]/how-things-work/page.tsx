'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import Layout from '@/components/layout/Layout'
import { useAuth } from '@/contexts/AuthContext'
import dynamic from 'next/dynamic'
import { PlusIcon, Trash2Icon, ArrowUpIcon, ArrowDownIcon, PenIcon, XIcon, CheckIcon, ImageIcon, ArrowLeftIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

// Importazione dinamica di ProtectedRoute senza SSR
const ProtectedRoute = dynamic(() => import('@/components/ProtectedRoute'), { ssr: false })

// Tipi per le categorie e gli elementi
interface RoomCategory {
  id: string
  property_id: string
  name: string
  display_order: number
  created_at: string
  updated_at: string
}

interface HowThingsWorkItem {
  id: string
  category_id: string
  title: string
  description?: string
  image_path: string
  display_order: number
  created_at: string
  updated_at: string
}

interface ItemPhoto {
  id: string
  item_id: string
  photo_path: string
  description?: string
  display_order: number
  created_at: string
  updated_at: string
}

interface SuggestedCategory {
  id: string
  name: string
  display_order: number
}

interface Property {
  id: string
  name: string
  address: string
  city?: string
  country?: string
}

export default function HowThingsWork() {
  const { propertyId } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  
  const [property, setProperty] = useState<Property | null>(null)
  const [roomCategories, setRoomCategories] = useState<RoomCategory[]>([])
  const [suggestedCategories, setSuggestedCategories] = useState<SuggestedCategory[]>([])
  const [howThingsWorkItems, setHowThingsWorkItems] = useState<{ [key: string]: HowThingsWorkItem[] }>({})
  const [itemPhotos, setItemPhotos] = useState<{ [key: string]: ItemPhoto[] }>({})
  
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  
  // Stati per la modifica delle categorie
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editCategoryName, setEditCategoryName] = useState('')
  
  // Stati per la gestione degli elementi
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [newItemTitle, setNewItemTitle] = useState('')
  const [newItemImage, setNewItemImage] = useState<File | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  
  // Stati per la gestione delle foto aggiuntive degli elementi
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [isAddingPhoto, setIsAddingPhoto] = useState(false)
  const [newPhotoImage, setNewPhotoImage] = useState<File | null>(null)
  const [newPhotoDescription, setNewPhotoDescription] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  
  // Stati per la modifica degli elementi
  const [isEditingItem, setIsEditingItem] = useState(false)
  const [editItemId, setEditItemId] = useState<string | null>(null)
  const [editItemTitle, setEditItemTitle] = useState('')
  const [editItemImage, setEditItemImage] = useState<File | null>(null)
  
  // Stati per la modifica delle istruzioni
  const [isEditingPhoto, setIsEditingPhoto] = useState(false)
  const [editPhotoId, setEditPhotoId] = useState<string | null>(null)
  const [editPhotoDescription, setEditPhotoDescription] = useState('')
  const [editPhotoImage, setEditPhotoImage] = useState<File | null>(null)

  // Carica i dati della proprietà e le categorie
  useEffect(() => {
    if (!user || !propertyId) return

    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Carica i dati della proprietà
        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select('*')
          .eq('id', propertyId)
          .eq('host_id', user.id)
          .single()
        
        if (propertyError) throw propertyError
        if (!propertyData) {
          toast.error('Property not found or access denied')
          router.push('/dashboard')
          return
        }
        
        setProperty(propertyData)
        
        // Carica le categorie delle stanze
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('room_categories')
          .select('*')
          .eq('property_id', propertyId)
          .order('display_order', { ascending: true })
        
        if (categoriesError) throw categoriesError
        setRoomCategories(categoriesData || [])
        
        if (categoriesData && categoriesData.length > 0) {
          setActiveCategory(categoriesData[0].id)
        }
        
        // Carica le categorie suggerite
        const { data: suggestedData, error: suggestedError } = await supabase
          .from('suggested_room_categories')
          .select('*')
          .order('display_order', { ascending: true })
        
        if (suggestedError) throw suggestedError
        setSuggestedCategories(suggestedData || [])
        
        // Inizializza lo state degli elementi per tutte le categorie
        const itemsMap: { [key: string]: HowThingsWorkItem[] } = {}
        const photosMap: { [key: string]: ItemPhoto[] } = {}
        
        if (categoriesData && categoriesData.length > 0) {
          // Carica gli elementi per ogni categoria
          for (const category of categoriesData) {
            const { data: itemsData, error: itemsError } = await supabase
              .from('how_things_work_items')
              .select('*')
              .eq('category_id', category.id)
              .order('display_order', { ascending: true })
            
            if (itemsError) throw itemsError
            itemsMap[category.id] = itemsData || []
            
            // Carica le foto per ogni elemento
            if (itemsData && itemsData.length > 0) {
              for (const item of itemsData) {
                const { data: photosData, error: photosError } = await supabase
                  .from('how_things_work_item_photos')
                  .select('*')
                  .eq('item_id', item.id)
                  .order('display_order', { ascending: true })
                
                if (photosError) throw photosError
                photosMap[item.id] = photosData || []
              }
            }
          }
        }
        
        setHowThingsWorkItems(itemsMap)
        setItemPhotos(photosMap)
        
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [propertyId, user, router])

  // Gestione dell'aggiunta di una nuova categoria
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Please enter a category name')
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('room_categories')
        .insert({
          property_id: propertyId,
          name: newCategoryName,
          display_order: roomCategories.length
        })
        .select()
      
      if (error) throw error
      
      toast.success('Category added successfully')
      
      // Aggiorna le categorie
      const { data: updatedCategories, error: fetchError } = await supabase
        .from('room_categories')
        .select('*')
        .eq('property_id', propertyId)
        .order('display_order', { ascending: true })
      
      if (fetchError) throw fetchError
      
      setRoomCategories(updatedCategories || [])
      setHowThingsWorkItems({ ...howThingsWorkItems, [data[0].id]: [] })
      setActiveCategory(data[0].id)
      setIsAddingCategory(false)
      setNewCategoryName('')
      
    } catch (error) {
      console.error('Error adding category:', error)
      toast.error('Failed to add category')
    }
  }

  // Gestione dell'eliminazione di una categoria
  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? All items within it will be permanently deleted.')) {
      return
    }
    
    try {
      // Prima elimina tutte le immagini nel bucket di storage
      const items = howThingsWorkItems[categoryId] || []
      for (const item of items) {
        if (item.image_path) {
          await supabase.storage
            .from('how-things-work-images')
            .remove([item.image_path])
        }
      }
      
      // Poi elimina la categoria (gli elementi saranno eliminati a cascata)
      const { error } = await supabase
        .from('room_categories')
        .delete()
        .eq('id', categoryId)
      
      if (error) throw error
      
      toast.success('Category deleted successfully')
      
      // Aggiorna le categorie
      const { data: updatedCategories, error: fetchError } = await supabase
        .from('room_categories')
        .select('*')
        .eq('property_id', propertyId)
        .order('display_order', { ascending: true })
      
      if (fetchError) throw fetchError
      
      setRoomCategories(updatedCategories || [])
      
      // Rimuovi gli elementi di questa categoria
      const updatedItems = { ...howThingsWorkItems }
      delete updatedItems[categoryId]
      setHowThingsWorkItems(updatedItems)
      
      // Se la categoria attiva è stata eliminata, seleziona la prima categoria disponibile
      if (activeCategory === categoryId) {
        setActiveCategory(updatedCategories.length > 0 ? updatedCategories[0].id : null)
      }
      
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Failed to delete category')
    }
  }

  // Gestione dell'aggiunta di una categoria suggerita
  const handleAddSuggestedCategory = async (suggestedName: string) => {
    try {
      const { data, error } = await supabase
        .from('room_categories')
        .insert({
          property_id: propertyId,
          name: suggestedName,
          display_order: roomCategories.length
        })
        .select()
      
      if (error) throw error
      
      toast.success('Category added successfully')
      
      // Aggiorna le categorie
      const { data: updatedCategories, error: fetchError } = await supabase
        .from('room_categories')
        .select('*')
        .eq('property_id', propertyId)
        .order('display_order', { ascending: true })
      
      if (fetchError) throw fetchError
      
      setRoomCategories(updatedCategories || [])
      setHowThingsWorkItems({ ...howThingsWorkItems, [data[0].id]: [] })
      
    } catch (error) {
      console.error('Error adding suggested category:', error)
      toast.error('Failed to add category')
    }
  }

  // Gestione della modifica di una categoria
  const handleUpdateCategory = async (categoryId: string) => {
    if (!editCategoryName.trim()) {
      toast.error('Please enter a category name')
      return
    }
    
    try {
      const { error } = await supabase
        .from('room_categories')
        .update({ name: editCategoryName })
        .eq('id', categoryId)
      
      if (error) throw error
      
      toast.success('Category updated successfully')
      
      // Aggiorna le categorie
      const { data: updatedCategories, error: fetchError } = await supabase
        .from('room_categories')
        .select('*')
        .eq('property_id', propertyId)
        .order('display_order', { ascending: true })
      
      if (fetchError) throw fetchError
      
      setRoomCategories(updatedCategories || [])
      setEditingCategory(null)
      setEditCategoryName('')
      
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error('Failed to update category')
    }
  }

  // Gestione dello spostamento di una categoria
  const handleMoveCategory = async (categoryId: string, direction: 'up' | 'down') => {
    const currentIndex = roomCategories.findIndex(cat => cat.id === categoryId)
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === roomCategories.length - 1)
    ) {
      return // Non fare nulla se non si può spostare nella direzione specificata
    }
    
    try {
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      const targetCategory = roomCategories[targetIndex]
      
      // Aggiorna gli ordini di visualizzazione
      await supabase
        .from('room_categories')
        .update({ display_order: targetIndex })
        .eq('id', categoryId)
      
      await supabase
        .from('room_categories')
        .update({ display_order: currentIndex })
        .eq('id', targetCategory.id)
      
      // Aggiorna le categorie
      const { data: updatedCategories, error: fetchError } = await supabase
        .from('room_categories')
        .select('*')
        .eq('property_id', propertyId)
        .order('display_order', { ascending: true })
      
      if (fetchError) throw fetchError
      
      setRoomCategories(updatedCategories || [])
      
    } catch (error) {
      console.error(`Error moving category ${direction}:`, error)
      toast.error('Failed to reorder categories')
    }
  }

  // Gestione dell'aggiunta di un nuovo elemento
  const handleAddItem = async () => {
    if (!activeCategory) {
      toast.error('Please select a category first')
      return
    }
    
    if (!newItemTitle.trim()) {
      toast.error('Please enter a title')
      return
    }
    
    if (!newItemImage) {
      toast.error('Please select an image')
      return
    }
    
    if (!user) {
      toast.error('You must be logged in to add items')
      return
    }
    
    try {
      setUploadingImage(true)
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB in bytes
      if (newItemImage.size > maxSize) {
        toast.error('Image size must be less than 5MB')
        setUploadingImage(false)
        return
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(newItemImage.type)) {
        toast.error('Please upload a valid image file (JPG, PNG, or WebP)')
        setUploadingImage(false)
        return
      }
      
      // Carica l'immagine
      const fileExt = newItemImage.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}_${newItemTitle.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('how-things-work-images')
        .upload(fileName, newItemImage, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }
      
      // Aggiungi il nuovo elemento
      const { data, error } = await supabase
        .from('how_things_work_items')
        .insert({
          category_id: activeCategory,
          title: newItemTitle,
          image_path: fileName,
          display_order: howThingsWorkItems[activeCategory]?.length || 0
        })
        .select()
      
      if (error) throw error
      
      toast.success('Item added successfully')
      
      // Aggiorna gli elementi
      const { data: updatedItems, error: fetchError } = await supabase
        .from('how_things_work_items')
        .select('*')
        .eq('category_id', activeCategory)
        .order('display_order', { ascending: true })
      
      if (fetchError) throw fetchError
      
      setHowThingsWorkItems({
        ...howThingsWorkItems,
        [activeCategory]: updatedItems || []
      })
      
      // Inizializza l'array delle foto per questo nuovo elemento
      if (data && data.length > 0) {
        setItemPhotos({
          ...itemPhotos,
          [data[0].id]: []
        })
      }
      
      // Reimposta i campi del form
      setIsAddingItem(false)
      setNewItemTitle('')
      setNewItemImage(null)
      
    } catch (error) {
      console.error('Error adding item:', error)
      toast.error('Failed to add item')
    } finally {
      setUploadingImage(false)
    }
  }

  // Gestione dell'eliminazione di un elemento
  const handleDeleteItem = async (itemId: string, imagePath: string) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return
    }
    
    try {
      // Prima elimina l'immagine principale dal bucket di storage
      if (imagePath) {
        const { error: storageError } = await supabase.storage
          .from('how-things-work-images')
          .remove([imagePath])
        
        if (storageError) throw storageError
      }
      
      // Elimina tutte le foto associate all'elemento
      const photos = itemPhotos[itemId] || []
      for (const photo of photos) {
        if (photo.photo_path) {
          await supabase.storage
            .from('item-photos')
            .remove([photo.photo_path])
        }
      }
      
      // Poi elimina l'elemento (le foto saranno eliminate a cascata)
      const { error } = await supabase
        .from('how_things_work_items')
        .delete()
        .eq('id', itemId)
      
      if (error) throw error
      
      toast.success('Item deleted successfully')
      
      // Aggiorna gli elementi
      if (activeCategory) {
        const { data: updatedItems, error: fetchError } = await supabase
          .from('how_things_work_items')
          .select('*')
          .eq('category_id', activeCategory)
          .order('display_order', { ascending: true })
        
        if (fetchError) throw fetchError
        
        setHowThingsWorkItems({
          ...howThingsWorkItems,
          [activeCategory]: updatedItems || []
        })
      }
      
      // Rimuovi le foto di questo elemento dallo state
      const updatedPhotos = { ...itemPhotos }
      delete updatedPhotos[itemId]
      setItemPhotos(updatedPhotos)
      
      // Se l'elemento selezionato è stato eliminato, deselezionalo
      if (selectedItem === itemId) {
        setSelectedItem(null)
      }
      
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Failed to delete item')
    }
  }

  // Gestione dell'aggiunta di una nuova foto ad un elemento
  const handleAddPhoto = async () => {
    if (!selectedItem) {
      toast.error('Please select an item first')
      return
    }
    
    if (!newPhotoImage) {
      toast.error('Please select an image')
      return
    }
    
    if (!user) {
      toast.error('You must be logged in to add photos')
      return
    }
    
    try {
      setUploadingPhoto(true)
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB in bytes
      if (newPhotoImage.size > maxSize) {
        toast.error('Image size must be less than 5MB')
        setUploadingPhoto(false)
        return
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(newPhotoImage.type)) {
        toast.error('Please upload a valid image file (JPG, PNG, or WebP)')
        setUploadingPhoto(false)
        return
      }
      
      // Carica l'immagine
      const fileExt = newPhotoImage.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}_photo.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('item-photos')
        .upload(fileName, newPhotoImage, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }
      
      // Aggiungi la nuova foto
      const { data, error } = await supabase
        .from('how_things_work_item_photos')
        .insert({
          item_id: selectedItem,
          photo_path: fileName,
          description: newPhotoDescription || null,
          display_order: (itemPhotos[selectedItem] || []).length
        })
        .select()
      
      if (error) throw error
      
      toast.success('Photo added successfully')
      
      // Aggiorna le foto
      const { data: updatedPhotos, error: fetchError } = await supabase
        .from('how_things_work_item_photos')
        .select('*')
        .eq('item_id', selectedItem)
        .order('display_order', { ascending: true })
      
      if (fetchError) throw fetchError
      
      setItemPhotos({
        ...itemPhotos,
        [selectedItem]: updatedPhotos || []
      })
      
      // Reimposta i campi del form
      setIsAddingPhoto(false)
      setNewPhotoImage(null)
      setNewPhotoDescription('')
      
    } catch (error) {
      console.error('Error adding photo:', error)
      toast.error('Failed to add photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  // Gestione dell'eliminazione di una foto
  const handleDeletePhoto = async (photoId: string, photoPath: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return
    }
    
    try {
      // Prima elimina l'immagine dal bucket di storage
      if (photoPath) {
        const { error: storageError } = await supabase.storage
          .from('item-photos')
          .remove([photoPath])
        
        if (storageError) throw storageError
      }
      
      // Poi elimina la foto
      const { error } = await supabase
        .from('how_things_work_item_photos')
        .delete()
        .eq('id', photoId)
      
      if (error) throw error
      
      toast.success('Photo deleted successfully')
      
      // Aggiorna le foto
      if (selectedItem) {
        const { data: updatedPhotos, error: fetchError } = await supabase
          .from('how_things_work_item_photos')
          .select('*')
          .eq('item_id', selectedItem)
          .order('display_order', { ascending: true })
        
        if (fetchError) throw fetchError
        
        setItemPhotos({
          ...itemPhotos,
          [selectedItem]: updatedPhotos || []
        })
      }
      
    } catch (error) {
      console.error('Error deleting photo:', error)
      toast.error('Failed to delete photo')
    }
  }

  // Gestione dello spostamento di una foto/istruzione
  const handleMovePhoto = async (photoId: string, itemId: string, direction: 'up' | 'down') => {
    if (!selectedItem) return
    
    const photos = itemPhotos[itemId] || []
    const currentIndex = photos.findIndex(photo => photo.id === photoId)
    
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === photos.length - 1)
    ) {
      return // Non fare nulla se non si può spostare nella direzione specificata
    }
    
    try {
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      const targetPhoto = photos[targetIndex]
      
      // Aggiorna gli ordini di visualizzazione
      await supabase
        .from('how_things_work_item_photos')
        .update({ display_order: targetIndex })
        .eq('id', photoId)
      
      await supabase
        .from('how_things_work_item_photos')
        .update({ display_order: currentIndex })
        .eq('id', targetPhoto.id)
      
      // Aggiorna le foto
      const { data: updatedPhotos, error: fetchError } = await supabase
        .from('how_things_work_item_photos')
        .select('*')
        .eq('item_id', itemId)
        .order('display_order', { ascending: true })
      
      if (fetchError) throw fetchError
      
      setItemPhotos({
        ...itemPhotos,
        [itemId]: updatedPhotos || []
      })
      
    } catch (error) {
      console.error(`Error moving instruction ${direction}:`, error)
      toast.error('Failed to reorder instructions')
    }
  }

  // Gestione dello spostamento di un elemento
  const handleMoveItem = async (itemId: string, direction: 'up' | 'down') => {
    if (!activeCategory) return
    
    const items = howThingsWorkItems[activeCategory] || []
    const currentIndex = items.findIndex(item => item.id === itemId)
    
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === items.length - 1)
    ) {
      return // Non fare nulla se non si può spostare nella direzione specificata
    }
    
    try {
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      const targetItem = items[targetIndex]
      
      // Aggiorna gli ordini di visualizzazione
      await supabase
        .from('how_things_work_items')
        .update({ display_order: targetIndex })
        .eq('id', itemId)
      
      await supabase
        .from('how_things_work_items')
        .update({ display_order: currentIndex })
        .eq('id', targetItem.id)
      
      // Aggiorna gli elementi
      const { data: updatedItems, error: fetchError } = await supabase
        .from('how_things_work_items')
        .select('*')
        .eq('category_id', activeCategory)
        .order('display_order', { ascending: true })
      
      if (fetchError) throw fetchError
      
      setHowThingsWorkItems({
        ...howThingsWorkItems,
        [activeCategory]: updatedItems || []
      })
      
    } catch (error) {
      console.error(`Error moving item ${direction}:`, error)
      toast.error('Failed to reorder items')
    }
  }

  // Gestione della modifica di un elemento
  const handleEditItem = async () => {
    if (!editItemId || !activeCategory) {
      toast.error('Invalid item selection')
      return
    }
    
    if (!editItemTitle.trim()) {
      toast.error('Please enter a title')
      return
    }
    
    if (!user) {
      toast.error('You must be logged in to edit items')
      return
    }
    
    try {
      let updatedImagePath = howThingsWorkItems[activeCategory]?.find(item => item.id === editItemId)?.image_path || '';
      
      // Se c'è una nuova immagine, caricarla e aggiornare il percorso
      if (editItemImage) {
        setUploadingImage(true)
        
        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024 // 5MB in bytes
        if (editItemImage.size > maxSize) {
          toast.error('Image size must be less than 5MB')
          setUploadingImage(false)
          return
        }
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if (!allowedTypes.includes(editItemImage.type)) {
          toast.error('Please upload a valid image file (JPG, PNG, or WebP)')
          setUploadingImage(false)
          return
        }
        
        // Carica la nuova immagine
        const fileExt = editItemImage.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}_${editItemTitle.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('how-things-work-images')
          .upload(fileName, editItemImage, {
            cacheControl: '3600',
            upsert: false
          })
        
        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw uploadError
        }
        
        // Elimina la vecchia immagine se presente
        if (updatedImagePath) {
          await supabase.storage
            .from('how-things-work-images')
            .remove([updatedImagePath])
        }
        
        updatedImagePath = fileName
      }
      
      // Aggiorna l'elemento
      const { error } = await supabase
        .from('how_things_work_items')
        .update({
          title: editItemTitle,
          image_path: updatedImagePath
        })
        .eq('id', editItemId)
      
      if (error) throw error
      
      toast.success('Item updated successfully')
      
      // Aggiorna gli elementi
      const { data: updatedItems, error: fetchError } = await supabase
        .from('how_things_work_items')
        .select('*')
        .eq('category_id', activeCategory)
        .order('display_order', { ascending: true })
      
      if (fetchError) throw fetchError
      
      setHowThingsWorkItems({
        ...howThingsWorkItems,
        [activeCategory]: updatedItems || []
      })
      
      // Reimposta i campi del form
      setIsEditingItem(false)
      setEditItemId(null)
      setEditItemTitle('')
      setEditItemImage(null)
      
    } catch (error) {
      console.error('Error updating item:', error)
      toast.error('Failed to update item')
    } finally {
      setUploadingImage(false)
    }
  }

  // Gestione della modifica di una foto/istruzione
  const handleEditPhoto = async () => {
    if (!selectedItem || !editPhotoId) {
      toast.error('Invalid photo selection')
      return
    }
    
    if (!user) {
      toast.error('You must be logged in to edit instructions')
      return
    }
    
    try {
      let updatedPhotoPath = itemPhotos[selectedItem]?.find(photo => photo.id === editPhotoId)?.photo_path || '';
      
      // Se c'è una nuova immagine, caricarla e aggiornare il percorso
      if (editPhotoImage) {
        setUploadingPhoto(true)
        
        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024 // 5MB in bytes
        if (editPhotoImage.size > maxSize) {
          toast.error('Image size must be less than 5MB')
          setUploadingPhoto(false)
          return
        }
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if (!allowedTypes.includes(editPhotoImage.type)) {
          toast.error('Please upload a valid image file (JPG, PNG, or WebP)')
          setUploadingPhoto(false)
          return
        }
        
        // Carica la nuova immagine
        const fileExt = editPhotoImage.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}_photo_edit.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('item-photos')
          .upload(fileName, editPhotoImage, {
            cacheControl: '3600',
            upsert: false
          })
        
        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw uploadError
        }
        
        // Elimina la vecchia immagine se presente
        if (updatedPhotoPath) {
          await supabase.storage
            .from('item-photos')
            .remove([updatedPhotoPath])
        }
        
        updatedPhotoPath = fileName
      }
      
      // Aggiorna la foto/istruzione
      const { error } = await supabase
        .from('how_things_work_item_photos')
        .update({
          description: editPhotoDescription,
          photo_path: updatedPhotoPath
        })
        .eq('id', editPhotoId)
      
      if (error) throw error
      
      toast.success('Instruction updated successfully')
      
      // Aggiorna le foto
      const { data: updatedPhotos, error: fetchError } = await supabase
        .from('how_things_work_item_photos')
        .select('*')
        .eq('item_id', selectedItem)
        .order('display_order', { ascending: true })
      
      if (fetchError) throw fetchError
      
      setItemPhotos({
        ...itemPhotos,
        [selectedItem]: updatedPhotos || []
      })
      
      // Reimposta i campi del form
      setIsEditingPhoto(false)
      setEditPhotoId(null)
      setEditPhotoDescription('')
      setEditPhotoImage(null)
      
    } catch (error) {
      console.error('Error updating instruction:', error)
      toast.error('Failed to update instruction')
    } finally {
      setUploadingPhoto(false)
    }
  }

  // Rendering UI
  return (
    <ProtectedRoute>
      <Layout hasBackButton backUrl={`/dashboard/property/${propertyId}/house-info`}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <div></div> {/* Elemento vuoto per bilanciare la navbar */}
            <h1 className="text-3xl font-bold">How Things Work</h1>
            <div></div> {/* Elemento vuoto per bilanciare la navbar */}
          </div>
          <p className="text-gray-600 mb-8">
            Add information about how different items and appliances work in your property.
            Organize them by room or category and provide clear instructions with images.
          </p>
          
          {/* Sezione delle categorie */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Categories</h2>
                  <button 
                    onClick={() => {
                      setIsAddingCategory(true)
                      setNewCategoryName('')
                    }}
                    className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md flex items-center"
                  >
                    <PlusIcon size={16} className="mr-1" /> Add Category
                  </button>
                </div>
                
                {/* Form per l'aggiunta di una nuova categoria */}
                {isAddingCategory && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-md">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Category name"
                      className="w-full p-2 border border-gray-300 rounded-md mb-2"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setIsAddingCategory(false)}
                        className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddCategory}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Lista delle categorie */}
                <div className="space-y-2 mb-8">
                  {roomCategories.length === 0 ? (
                    <p className="text-gray-500 italic">No categories added yet.</p>
                  ) : (
                    roomCategories.map((category) => (
                      <div 
                        key={category.id}
                        className={`p-3 rounded-md flex justify-between items-center ${
                          activeCategory === category.id ? 'bg-indigo-50 border border-indigo-200' : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        {editingCategory === category.id ? (
                          <input
                            type="text"
                            value={editCategoryName}
                            onChange={(e) => setEditCategoryName(e.target.value)}
                            className="flex-1 p-1 border border-gray-300 rounded-md mr-2"
                            autoFocus
                          />
                        ) : (
                          <button
                            onClick={() => setActiveCategory(category.id)}
                            className="flex-1 text-left font-medium"
                          >
                            {category.name}
                          </button>
                        )}
                        
                        <div className="flex space-x-1">
                          {editingCategory === category.id ? (
                            <>
                              <button
                                onClick={() => handleUpdateCategory(category.id)}
                                className="p-1 text-green-600 hover:text-green-800"
                                title="Save"
                              >
                                <CheckIcon size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCategory(null)
                                  setEditCategoryName('')
                                }}
                                className="p-1 text-gray-600 hover:text-gray-800"
                                title="Cancel"
                              >
                                <XIcon size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleMoveCategory(category.id, 'up')}
                                className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-30"
                                disabled={roomCategories.indexOf(category) === 0}
                                title="Move up"
                              >
                                <ArrowUpIcon size={16} />
                              </button>
                              <button
                                onClick={() => handleMoveCategory(category.id, 'down')}
                                className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-30"
                                disabled={roomCategories.indexOf(category) === roomCategories.length - 1}
                                title="Move down"
                              >
                                <ArrowDownIcon size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCategory(category.id)
                                  setEditCategoryName(category.name)
                                }}
                                className="p-1 text-blue-600 hover:text-blue-800"
                                title="Edit"
                              >
                                <PenIcon size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(category.id)}
                                className="p-1 text-red-600 hover:text-red-800"
                                title="Delete"
                              >
                                <Trash2Icon size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Suggerimenti di categorie */}
                <div>
                  <h3 className="text-md font-semibold mb-2">Suggested Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {suggestedCategories.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        onClick={() => handleAddSuggestedCategory(suggestion.name)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm"
                      >
                        {suggestion.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Contenuto della categoria selezionata */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-lg shadow p-6">
                {!activeCategory ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">Select or create a category to add items.</p>
                  </div>
                ) : (
                  <>
                    {selectedItem ? (
                      /* Vista di dettaglio dell'item per aggiungere foto */
                      <>
                        <div className="flex justify-between items-center mb-6">
                          <div className="flex items-center">
                            <button
                              onClick={() => setSelectedItem(null)}
                              className="mr-2 text-indigo-600 hover:text-indigo-800"
                            >
                              ← Back
                            </button>
                            <h2 className="text-xl font-bold">
                              {howThingsWorkItems[activeCategory]?.find(item => item.id === selectedItem)?.title}
                            </h2>
                          </div>
                          <button 
                            onClick={() => {
                              setIsAddingPhoto(true)
                              setNewPhotoImage(null)
                              setNewPhotoDescription('')
                            }}
                            className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md flex items-center"
                          >
                            <PlusIcon size={16} className="mr-1" /> Add Instruction
                          </button>
                        </div>
                        
                        {/* Form per l'aggiunta di una nuova foto */}
                        {isAddingPhoto && (
                          <div className="mb-6 p-4 bg-gray-50 rounded-md">
                            <h3 className="font-medium mb-3">Add New Instruction</h3>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Photo *
                                </label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => setNewPhotoImage(e.target.files?.[0] || null)}
                                  className="w-full p-2 border border-gray-300 rounded-md"
                                  required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Upload a clear image (max 5MB). Supported formats: JPG, PNG, WebP
                                </p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Description
                                </label>
                                <textarea
                                  value={newPhotoDescription}
                                  onChange={(e) => setNewPhotoDescription(e.target.value)}
                                  placeholder="Explain what this photo shows or how to use this feature..."
                                  className="w-full p-2 border border-gray-300 rounded-md"
                                  rows={3}
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => setIsAddingPhoto(false)}
                                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleAddPhoto}
                                  disabled={uploadingPhoto}
                                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm disabled:opacity-70"
                                >
                                  {uploadingPhoto ? 'Uploading...' : 'Save Instruction'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Form per la modifica di una foto/istruzione esistente */}
                        {isEditingPhoto && (
                          <div className="mb-6 p-4 bg-gray-50 rounded-md">
                            <h3 className="font-medium mb-3">Edit Instruction</h3>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  New Image (optional)
                                </label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => setEditPhotoImage(e.target.files?.[0] || null)}
                                  className="w-full p-2 border border-gray-300 rounded-md"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Leave empty to keep the current image
                                </p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Description
                                </label>
                                <textarea
                                  value={editPhotoDescription}
                                  onChange={(e) => setEditPhotoDescription(e.target.value)}
                                  placeholder="Explain what this photo shows or how to use this feature..."
                                  className="w-full p-2 border border-gray-300 rounded-md"
                                  rows={3}
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => {
                                    setIsEditingPhoto(false)
                                    setEditPhotoId(null)
                                    setEditPhotoDescription('')
                                    setEditPhotoImage(null)
                                  }}
                                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleEditPhoto}
                                  disabled={uploadingPhoto}
                                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm disabled:opacity-70"
                                >
                                  {uploadingPhoto ? 'Updating...' : 'Update Instruction'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Lista delle foto per questo elemento */}
                        <div className="mt-4">
                          <h3 className="font-medium mb-3">Item Instructions</h3>
                          
                          {/* Foto aggiuntive */}
                          <div className="space-y-4">
                            {itemPhotos[selectedItem]?.length ? (
                              itemPhotos[selectedItem].map((photo) => (
                                <div 
                                  key={photo.id}
                                  className="p-4 border border-gray-200 rounded-lg"
                                >
                                  <div className="flex flex-col md:flex-row gap-4">
                                    <div className="md:w-1/3 flex-shrink-0">
                                      <div className="relative w-full h-48 bg-gray-100 rounded-md overflow-hidden">
                                        <Image
                                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/item-photos/${photo.photo_path}`}
                                          alt="Item detail"
                                          fill
                                          className="object-cover"
                                        />
                                      </div>
                                    </div>
                                    <div className="md:w-2/3">
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          {photo.description && (
                                            <p className="text-gray-700">{photo.description}</p>
                                          )}
                                          {!photo.description && (
                                            <p className="text-gray-500 italic">No description provided</p>
                                          )}
                                        </div>
                                        <div className="flex space-x-1">
                                          <button
                                            onClick={() => handleMovePhoto(photo.id, selectedItem, 'up')}
                                            className="p-1 text-gray-600 hover:text-gray-800"
                                            title="Move up"
                                            disabled={itemPhotos[selectedItem].indexOf(photo) === 0}
                                          >
                                            <ArrowUpIcon size={16} />
                                          </button>
                                          <button
                                            onClick={() => handleMovePhoto(photo.id, selectedItem, 'down')}
                                            className="p-1 text-gray-600 hover:text-gray-800"
                                            title="Move down"
                                            disabled={
                                              itemPhotos[selectedItem].indexOf(photo) === 
                                              itemPhotos[selectedItem].length - 1
                                            }
                                          >
                                            <ArrowDownIcon size={16} />
                                          </button>
                                          <button
                                            onClick={() => {
                                              setIsEditingPhoto(true)
                                              setEditPhotoId(photo.id)
                                              setEditPhotoDescription(photo.description || '')
                                              setEditPhotoImage(null)
                                            }}
                                            className="p-1 text-blue-600 hover:text-blue-800"
                                            title="Edit"
                                          >
                                            <PenIcon size={16} />
                                          </button>
                                          <button
                                            onClick={() => handleDeletePhoto(photo.id, photo.photo_path)}
                                            className="p-1 text-red-600 hover:text-red-800"
                                            title="Delete"
                                          >
                                            <Trash2Icon size={16} />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-8">
                                <p className="text-gray-500">No instructions for this item yet.</p>
                                <p className="text-gray-500 text-sm mt-1">
                                  Click "Add Instruction" to add photos explaining how this item works.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Lista degli elementi della categoria */
                      <>
                        <div className="flex justify-between items-center mb-6">
                          <h2 className="text-xl font-bold">
                            {roomCategories.find(c => c.id === activeCategory)?.name || 'Items'}
                          </h2>
                          <button 
                            onClick={() => {
                              setIsAddingItem(true)
                              setNewItemTitle('')
                              setNewItemImage(null)
                            }}
                            className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md flex items-center"
                          >
                            <PlusIcon size={16} className="mr-1" /> Add Item
                          </button>
                        </div>
                        
                        {/* Form per l'aggiunta di un nuovo elemento */}
                        {isAddingItem && (
                          <div className="mb-6 p-4 bg-gray-50 rounded-md">
                            <h3 className="font-medium mb-3">Add New Item</h3>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Title *
                                </label>
                                <input
                                  type="text"
                                  value={newItemTitle}
                                  onChange={(e) => setNewItemTitle(e.target.value)}
                                  placeholder="e.g., TV Remote Control"
                                  className="w-full p-2 border border-gray-300 rounded-md"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Image *
                                </label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => setNewItemImage(e.target.files?.[0] || null)}
                                  className="w-full p-2 border border-gray-300 rounded-md"
                                  required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Upload a clear image (max 5MB). Supported formats: JPG, PNG, WebP
                                </p>
                              </div>
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => setIsAddingItem(false)}
                                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleAddItem}
                                  disabled={uploadingImage}
                                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm disabled:opacity-70"
                                >
                                  {uploadingImage ? 'Uploading...' : 'Save Item'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Form per la modifica di un elemento esistente */}
                        {isEditingItem && (
                          <div className="mb-6 p-4 bg-gray-50 rounded-md">
                            <h3 className="font-medium mb-3">Edit Item</h3>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Title *
                                </label>
                                <input
                                  type="text"
                                  value={editItemTitle}
                                  onChange={(e) => setEditItemTitle(e.target.value)}
                                  placeholder="e.g., TV Remote Control"
                                  className="w-full p-2 border border-gray-300 rounded-md"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  New Image (optional)
                                </label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => setEditItemImage(e.target.files?.[0] || null)}
                                  className="w-full p-2 border border-gray-300 rounded-md"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Leave empty to keep the current image
                                </p>
                              </div>
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => {
                                    setIsEditingItem(false)
                                    setEditItemId(null)
                                    setEditItemTitle('')
                                    setEditItemImage(null)
                                  }}
                                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleEditItem}
                                  disabled={uploadingImage}
                                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm disabled:opacity-70"
                                >
                                  {uploadingImage ? 'Updating...' : 'Update Item'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Lista degli elementi */}
                        <div className="space-y-4">
                          {howThingsWorkItems[activeCategory]?.length ? (
                            howThingsWorkItems[activeCategory].map((item) => (
                              <div 
                                key={item.id}
                                className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors"
                              >
                                <div className="flex flex-col md:flex-row gap-4">
                                  <div className="md:w-1/3 flex-shrink-0">
                                    <div 
                                      className="relative w-full h-48 bg-gray-100 rounded-md overflow-hidden cursor-pointer"
                                      onClick={() => setSelectedItem(item.id)}
                                    >
                                      <Image
                                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/how-things-work-images/${item.image_path}`}
                                        alt={item.title}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  </div>
                                  <div className="md:w-2/3">
                                    <div className="flex justify-between items-start">
                                      <h3 className="text-lg font-semibold">{item.title}</h3>
                                      <div className="flex space-x-1">
                                        <button
                                          onClick={() => handleMoveItem(item.id, 'up')}
                                          className="p-1 text-gray-600 hover:text-gray-800"
                                          title="Move up"
                                          disabled={howThingsWorkItems[activeCategory].indexOf(item) === 0}
                                        >
                                          <ArrowUpIcon size={16} />
                                        </button>
                                        <button
                                          onClick={() => handleMoveItem(item.id, 'down')}
                                          className="p-1 text-gray-600 hover:text-gray-800"
                                          title="Move down"
                                          disabled={
                                            howThingsWorkItems[activeCategory].indexOf(item) === 
                                            howThingsWorkItems[activeCategory].length - 1
                                          }
                                        >
                                          <ArrowDownIcon size={16} />
                                        </button>
                                        <button
                                          onClick={() => {
                                            setIsEditingItem(true)
                                            setEditItemId(item.id)
                                            setEditItemTitle(item.title)
                                            setEditItemImage(null)
                                          }}
                                          className="p-1 text-blue-600 hover:text-blue-800"
                                          title="Edit"
                                        >
                                          <PenIcon size={16} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteItem(item.id, item.image_path)}
                                          className="p-1 text-red-600 hover:text-red-800"
                                          title="Delete"
                                        >
                                          <Trash2Icon size={16} />
                                        </button>
                                      </div>
                                    </div>
                                    
                                    <div className="mt-2 flex justify-between items-center">
                                      <div className="flex items-center text-sm text-gray-600">
                                        <ImageIcon size={16} className="mr-1" />
                                        <span>
                                          {(itemPhotos[item.id]?.length || 0)} additional instruction{(itemPhotos[item.id]?.length || 0) !== 1 ? 's' : ''}
                                        </span>
                                      </div>
                                      
                                      <button 
                                        onClick={() => setSelectedItem(item.id)}
                                        className="px-3 py-1 text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-md"
                                      >
                                        Manage Instructions
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-gray-500">No items in this category yet.</p>
                              <p className="text-gray-500 text-sm mt-1">
                                Click "Add Item" to add your first item.
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
} 