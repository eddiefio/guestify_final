import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ExtraService {
  id: string;
  title: string;
  description: string | null;
  price: number;
  active: boolean;
  property_id: string;
  created_at: string;
  category?: string;
}

interface CartItem {
  service: ExtraService;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  propertyId: string | null;
  setPropertyId: (id: string) => void;
  addToCart: (service: ExtraService) => void;
  removeFromCart: (serviceId: string) => void;
  updateCartItem: (serviceId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [propertyId, setPropertyId] = useState<string | null>(null);

  // Carica il carrello dal localStorage quando il contesto viene montato
  useEffect(() => {
    const savedCart = localStorage.getItem('guestify_cart');
    const savedPropertyId = localStorage.getItem('guestify_propertyId');
    
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error parsing saved cart:', error);
        localStorage.removeItem('guestify_cart');
      }
    }
    
    if (savedPropertyId) {
      setPropertyId(savedPropertyId);
    }
  }, []);

  // Salva il carrello nel localStorage quando cambia
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('guestify_cart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('guestify_cart');
    }
  }, [cart]);

  // Salva il propertyId nel localStorage quando cambia
  useEffect(() => {
    if (propertyId) {
      localStorage.setItem('guestify_propertyId', propertyId);
    } else {
      localStorage.removeItem('guestify_propertyId');
    }
  }, [propertyId]);

  // Aggiungi un servizio al carrello
  const addToCart = (service: ExtraService) => {
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(item => item.service.id === service.id);
      
      if (existingItemIndex >= 0) {
        // Il servizio è già nel carrello, aumenta la quantità
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + 1
        };
        return updatedCart;
      } else {
        // Aggiungi un nuovo elemento al carrello
        return [...prevCart, { service, quantity: 1 }];
      }
    });
  };

  // Rimuovi un servizio dal carrello
  const removeFromCart = (serviceId: string) => {
    setCart(prevCart => prevCart.filter(item => item.service.id !== serviceId));
  };

  // Aggiorna la quantità di un elemento nel carrello
  const updateCartItem = (serviceId: string, quantity: number) => {
    if (quantity < 1) return;
    
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.service.id === serviceId) {
          return { ...item, quantity };
        }
        return item;
      });
    });
  };

  // Svuota il carrello
  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('guestify_cart');
  };

  // Calcola il totale del carrello
  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.service.price * item.quantity), 0);
  };

  // Calcola il numero totale di elementi nel carrello
  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        propertyId,
        setPropertyId,
        addToCart,
        removeFromCart,
        updateCartItem,
        clearCart,
        getCartTotal,
        getCartItemCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 