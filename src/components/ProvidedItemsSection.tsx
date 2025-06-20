'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { PlusCircle, Trash2, Edit, Save, X, ChevronDown, ChevronUp } from 'lucide-react'

interface ProvidedItem {
  id: string
  category_id: string
  name: string
  description: string | null
  quantity: number
  display_order: number
  created_at: string
  updated_at: string
}

interface ProvidedCategory {
  id: string
  property_id: string
  name: string
  display_order: number
  created_at: string
  updated_at: string
  items: ProvidedItem[]
}

interface ProvidedItemsSectionProps {
  propertyId: string
}

export default function ProvidedItemsSection({ propertyId }: ProvidedItemsSectionProps) {
  const [categories, setCategories] = useState<ProvidedCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  const [newCategoryName, setNewCategoryName] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)
  const [editingItem, setEditingItem] = useState<{
    id: string | null;
    categoryId: string;
    name: string;
    description: string;
    quantity: number;
  } | null>(null)
  const [addingItem, setAddingItem] = useState<string | null>(null) // categoryId quando si aggiunge un item

  // Carica le categorie e i loro articoli dal database
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true)
        
        // Carica le categorie
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('provided_categories')
          .select('*')
          .eq('property_id', propertyId)
          .order('display_order', { ascending: true })
        
        if (categoriesError) throw categoriesError

        // Per ogni categoria, carica gli articoli
        const categoriesWithItems = await Promise.all(
          (categoriesData || []).map(async (category: any) => {
            const { data: itemsData, error: itemsError } = await supabase
              .from('provided_items')
              .select('*')
              .eq('category_id', category.id)
              .order('display_order', { ascending: true })
            
            if (itemsError) throw itemsError
            
            return {
              ...category,
              items: itemsData || []
            }
          })
        )
        
        setCategories(categoriesWithItems)
        
        // Inizializza le categorie espanse
        const expanded: Record<string, boolean> = {}
        categoriesWithItems.forEach(cat => {
          expanded[cat.id] = true // Tutte le categorie sono espanse all'inizio
        })
        setExpandedCategories(expanded)
      } catch (error) {
        console.error('Error loading categories:', error)
        toast.error('Unable to load categories')
      } finally {
        setLoading(false)
      }
    }

    if (propertyId) {
      loadCategories()
    }
  }, [propertyId])

  // Aggiungi una nuova categoria
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Please enter a category name')
      return
    }

    try {
      // Determina il prossimo ordine di visualizzazione
      const nextOrder = categories.length > 0 
        ? Math.max(...categories.map(c => c.display_order)) + 1 
        : 0

      const { data, error } = await supabase
        .from('provided_categories')
        .insert({
          property_id: propertyId,
          name: newCategoryName.trim(),
          display_order: nextOrder
        })
        .select()
      
      if (error) throw error

      if (data && data[0]) {
        const newCategory = { ...data[0], items: [] }
        setCategories([...categories, newCategory])
        setExpandedCategories({...expandedCategories, [newCategory.id]: true})
        setNewCategoryName('')
        setAddingCategory(false)
        toast.success('Category added successfully')
      }
    } catch (error) {
      console.error('Error adding category:', error)
      toast.error('Unable to add category')
    }
  }

  // Elimina una categoria
  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? All associated items will be deleted.')) {
      return
    }

    try {
      // Prima elimina tutti gli articoli della categoria
      const { error: itemsError } = await supabase
        .from('provided_items')
        .delete()
        .eq('category_id', categoryId)
      
      if (itemsError) throw itemsError

      // Poi elimina la categoria
      const { error } = await supabase
        .from('provided_categories')
        .delete()
        .eq('id', categoryId)
      
      if (error) throw error

      setCategories(categories.filter(c => c.id !== categoryId))
      toast.success('Category deleted successfully')
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Unable to delete category')
    }
  }

  // Aggiungi un nuovo articolo a una categoria
  const handleAddItem = async (categoryId: string) => {
    if (!editingItem || !editingItem.name.trim()) {
      toast.error('Please enter an item name')
      return
    }

    try {
      const category = categories.find(c => c.id === categoryId)
      if (!category) return

      // Determina il prossimo ordine di visualizzazione
      const nextOrder = category.items.length > 0 
        ? Math.max(...category.items.map(i => i.display_order)) + 1 
        : 0

      const { data, error } = await supabase
        .from('provided_items')
        .insert({
          category_id: categoryId,
          name: editingItem.name.trim(),
          description: editingItem.description || null,
          quantity: editingItem.quantity || 1,
          display_order: nextOrder
        })
        .select()
      
      if (error) throw error

      if (data && data[0]) {
        const updatedCategories = categories.map(c => {
          if (c.id === categoryId) {
            return { ...c, items: [...c.items, data[0]] }
          }
          return c
        })
        
        setCategories(updatedCategories)
        setAddingItem(null)
        setEditingItem(null)
        toast.success('Item added successfully')
      }
    } catch (error) {
      console.error('Error adding item:', error)
      toast.error('Unable to add item')
    }
  }

  // Modifica un articolo esistente
  const handleUpdateItem = async () => {
    if (!editingItem || !editingItem.id || !editingItem.name.trim()) {
      toast.error('Please enter an item name')
      return
    }

    try {
      const { data, error } = await supabase
        .from('provided_items')
        .update({
          name: editingItem.name.trim(),
          description: editingItem.description || null,
          quantity: editingItem.quantity || 1,
        })
        .eq('id', editingItem.id)
        .select()
      
      if (error) throw error

      if (data && data[0]) {
        const updatedCategories = categories.map(c => {
          if (c.id === editingItem.categoryId) {
            return { 
              ...c, 
              items: c.items.map(i => i.id === editingItem.id ? data[0] : i) 
            }
          }
          return c
        })
        
        setCategories(updatedCategories)
        setEditingItem(null)
        toast.success('Item updated successfully')
      }
    } catch (error) {
      console.error('Error updating item:', error)
      toast.error('Unable to update item')
    }
  }

  // Elimina un articolo
  const handleDeleteItem = async (categoryId: string, itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('provided_items')
        .delete()
        .eq('id', itemId)
      
      if (error) throw error

      const updatedCategories = categories.map(c => {
        if (c.id === categoryId) {
          return { ...c, items: c.items.filter(i => i.id !== itemId) }
        }
        return c
      })
      
      setCategories(updatedCategories)
      toast.success('Item deleted successfully')
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Unable to delete item')
    }
  }

  // Espandi/comprimi una categoria
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories({
      ...expandedCategories,
      [categoryId]: !expandedCategories[categoryId]
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5E2BFF]"></div>
      </div>
    )
  }

  const defaultCategories = [
    'Bedroom', 'Kitchen', 'Bathroom', 'Living Room', 'Outdoor'
  ]

  // Funzione per aggiungere categorie predefinite
  const addDefaultCategories = async () => {
    if (categories.length > 0) {
      toast.error('Hai già delle categorie. Cancellale prima di aggiungere le categorie predefinite.')
      return
    }

    try {
      setLoading(true)
      const newCategories = await Promise.all(
        defaultCategories.map(async (name, index) => {
          const { data, error } = await supabase
            .from('provided_categories')
            .insert({
              property_id: propertyId,
              name,
              display_order: index
            })
            .select()
          
          if (error) throw error
          return { ...data[0], items: [] }
        })
      )

      const expanded: Record<string, boolean> = {}
      newCategories.forEach(cat => {
        expanded[cat.id] = true
      })
      
      setCategories(newCategories)
      setExpandedCategories(expanded)
      toast.success('Categorie predefinite aggiunte con successo')
    } catch (error) {
      console.error('Errore durante l\'aggiunta delle categorie predefinite:', error)
      toast.error('Impossibile aggiungere le categorie predefinite')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header con pulsanti di azione */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-800">
             Items Categories ({categories.length})
          </h3>
          <p className="text-sm text-gray-500">
          Manage the categories and items you provide in your property
          </p>
        </div>
        <div className="flex gap-2">
          {categories.length === 0 && (
            <button
              onClick={addDefaultCategories}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#5E2BFF] hover:bg-[#4a21cc] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5E2BFF]"
            >
              Add suggested categories
            </button>
          )}
          <button
            onClick={() => setAddingCategory(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#5E2BFF] hover:bg-[#4a21cc] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5E2BFF]"
          >
            <PlusCircle size={16} className="mr-2" />
            New Category
          </button>
        </div>
      </div>

      {/* Form per aggiungere una nuova categoria */}
      {addingCategory && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h4 className="font-medium text-gray-800 mb-2">Add Category</h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category Name"
              className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#5E2BFF] focus:border-[#5E2BFF]"
            />
            <button
              onClick={handleAddCategory}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#5E2BFF] hover:bg-[#4a21cc] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5E2BFF]"
            >
              <Save size={16} className="mr-2" />
              Save
            </button>
            <button
              onClick={() => {
                setAddingCategory(false)
                setNewCategoryName('')
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <X size={16} className="mr-2" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Elenco delle categorie */}
      {categories.length === 0 ? (
        <div className="text-center p-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">
          You have not added any categories yet. Add categories to define the items provided in your property.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.id} className="border border-gray-200 rounded-lg shadow-sm">
              {/* Header della categoria */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-t-lg">
                <div className="flex items-center">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="mr-2 text-gray-500 hover:text-gray-700"
                  >
                    {expandedCategories[category.id] ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </button>
                  <h3 className="font-medium text-gray-800">{category.name}</h3>
                  <span className="ml-2 text-sm text-gray-500">
                    ({category.items.length} {category.items.length === 1 ? 'item' : 'items'})
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="p-1 text-red-500 hover:text-red-700"
                  title="Delete category"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Contenuto della categoria (espandibile) */}
              {expandedCategories[category.id] && (
                <div className="p-4">
                  {/* Elenco degli articoli */}
                  {category.items.length > 0 && (
                    <div className="mb-4">
                      {/* Desktop table - hidden on mobile */}
                      <div className="hidden md:block">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Description
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Quantity
                              </th>
                              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {category.items.map((item) => (
                              <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {editingItem && editingItem.id === item.id ? (
                                    <input
                                      type="text"
                                      value={editingItem.name}
                                      onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                                      className="w-full px-2 py-1 border border-gray-300 rounded-md"
                                    />
                                  ) : (
                                    item.name
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">
                                  {editingItem && editingItem.id === item.id ? (
                                    <input
                                      type="text"
                                      value={editingItem.description || ''}
                                      onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                                      className="w-full px-2 py-1 border border-gray-300 rounded-md"
                                      placeholder="Descrizione (opzionale)"
                                    />
                                  ) : (
                                    item.description || '-'
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {editingItem && editingItem.id === item.id ? (
                                    <input
                                      type="number"
                                      value={editingItem.quantity}
                                      onChange={(e) => setEditingItem({
                                        ...editingItem, 
                                        quantity: parseInt(e.target.value) || 1
                                      })}
                                      className="w-20 px-2 py-1 border border-gray-300 rounded-md"
                                      min="1"
                                    />
                                  ) : (
                                    item.quantity
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  {editingItem && editingItem.id === item.id ? (
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={handleUpdateItem}
                                        className="text-[#5E2BFF] hover:text-[#4a21cc]"
                                      >
                                        <Save size={16} />
                                      </button>
                                      <button
                                        onClick={() => setEditingItem(null)}
                                        className="text-gray-500 hover:text-gray-700"
                                      >
                                        <X size={16} />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={() => setEditingItem({
                                          id: item.id,
                                          categoryId: category.id,
                                          name: item.name,
                                          description: item.description || '',
                                          quantity: item.quantity
                                        })}
                                        className="text-blue-600 hover:text-blue-900"
                                      >
                                        <Edit size={16} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteItem(category.id, item.id)}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile view - shown only on mobile devices */}
                      <div className="md:hidden">
                        <div className="space-y-3">
                          {category.items.map((item) => (
                            <div key={item.id} className="border rounded-lg p-3 bg-white">
                              {editingItem && editingItem.id === item.id ? (
                                <div className="space-y-2">
                                  <div>
                                    <label className="block text-xs text-gray-500 uppercase font-medium mb-1">Name</label>
                                    <input
                                      type="text"
                                      value={editingItem.name}
                                      onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-500 uppercase font-medium mb-1">Description</label>
                                    <input
                                      type="text"
                                      value={editingItem.description || ''}
                                      onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                      placeholder="Description (optional)"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-500 uppercase font-medium mb-1">Quantity</label>
                                    <input
                                      type="number"
                                      value={editingItem.quantity}
                                      onChange={(e) => setEditingItem({
                                        ...editingItem, 
                                        quantity: parseInt(e.target.value) || 1
                                      })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                      min="1"
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2 pt-2">
                                    <button
                                      onClick={handleUpdateItem}
                                      className="px-3 py-1 bg-[#5E2BFF] text-white rounded"
                                      title="Save"
                                    >
                                      <Save size={16} className="mr-1 inline-block" />
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingItem(null)}
                                      className="px-3 py-1 border border-gray-300 text-gray-700 rounded"
                                      title="Cancel"
                                    >
                                      <X size={16} className="mr-1 inline-block" />
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                                      {item.description && (
                                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                      )}
                                    </div>
                                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                                      Qty: {item.quantity}
                                    </span>
                                  </div>
                                  <div className="flex justify-end gap-2 mt-3">
                                    <button
                                      onClick={() => setEditingItem({
                                        id: item.id,
                                        categoryId: category.id,
                                        name: item.name,
                                        description: item.description || '',
                                        quantity: item.quantity
                                      })}
                                      className="p-1 text-blue-600 hover:text-blue-900"
                                      title="Edit item"
                                    >
                                      <Edit size={18} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteItem(category.id, item.id)}
                                      className="p-1 text-red-500 hover:text-red-700"
                                      title="Delete item"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form per aggiungere un nuovo articolo */}
                  {addingItem === category.id ? (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">Aggiungi Articolo</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <input
                          type="text"
                          value={editingItem?.name || ''}
                          onChange={(e) => setEditingItem({
                            ...editingItem || {
                              id: null,
                              categoryId: category.id,
                              name: '',
                              description: '',
                              quantity: 1
                            },
                            name: e.target.value
                          })}
                          placeholder="Nome articolo *"
                          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#5E2BFF] focus:border-[#5E2BFF]"
                          required
                        />
                        <input
                          type="text"
                          value={editingItem?.description || ''}
                          onChange={(e) => setEditingItem({
                            ...editingItem || {
                              id: null,
                              categoryId: category.id,
                              name: '',
                              description: '',
                              quantity: 1
                            },
                            description: e.target.value
                          })}
                          placeholder="Descrizione (opzionale)"
                          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#5E2BFF] focus:border-[#5E2BFF]"
                        />
                        <input
                          type="number"
                          value={editingItem?.quantity || 1}
                          onChange={(e) => setEditingItem({
                            ...editingItem || {
                              id: null,
                              categoryId: category.id,
                              name: '',
                              description: '',
                              quantity: 1
                            },
                            quantity: parseInt(e.target.value) || 1
                          })}
                          placeholder="Quantità"
                          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#5E2BFF] focus:border-[#5E2BFF]"
                          min="1"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleAddItem(category.id)}
                          className="px-4 py-2 bg-[#5E2BFF] text-white rounded-md hover:bg-[#4a21cc] transition"
                        >
                          Add Item
                        </button>
                        <button
                          onClick={() => {
                            setAddingItem(null)
                            setEditingItem(null)
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setAddingItem(category.id)
                        setEditingItem({
                          id: null,
                          categoryId: category.id,
                          name: '',
                          description: '',
                          quantity: 1
                        })
                      }}
                      className="flex items-center text-[#5E2BFF] hover:text-[#4a21cc] transition"
                    >
                      <PlusCircle size={18} className="mr-1" />
                      <span>Add Item</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 