import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MenuItem, Restaurant } from '../types';

/**
 * Interface para item do carrinho
 */
export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  selectedExtras: Array<{
    id: string;
    nome: string;
    preco: number;
    quantidade?: number;
  }>;
  removedIngredients: string[];
  customizations: {[key: string]: any};
  observations?: string;
  totalPrice: number;
}

/**
 * Interface para o contexto do carrinho
 */
interface CartContextType {
  items: CartItem[];
  restaurant: Restaurant | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
  addItem: (menuItem: MenuItem, quantity?: number, extras?: any[], removedIngredients?: string[], customizations?: any, observations?: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setRestaurant: (restaurant: Restaurant) => void;
  canAddItem: (restaurantId: string) => boolean;
  isCartEmpty: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

/**
 * Provider do carrinho de compras
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Chaves para armazenamento local
  const CART_ITEMS_KEY = '@amadelivery_cart_items';
  const CART_RESTAURANT_KEY = '@amadelivery_cart_restaurant';

  // Carregar carrinho salvo ao inicializar
  useEffect(() => {
    loadCartFromStorage();
  }, []);

  // Salvar carrinho sempre que mudar (apenas após inicialização)
  useEffect(() => {
    if (!isInitialized) return;
    
    const timeoutId = setTimeout(() => {
      saveCartToStorage();
    }, 100); // Debounce de 100ms

    return () => clearTimeout(timeoutId);
  }, [items, restaurant, isInitialized]);

  /**
   * Carregar carrinho do armazenamento local
   */
  const loadCartFromStorage = async () => {
    try {
      const savedItems = await AsyncStorage.getItem(CART_ITEMS_KEY);
      const savedRestaurant = await AsyncStorage.getItem(CART_RESTAURANT_KEY);

      if (savedItems) {
        setItems(JSON.parse(savedItems));
      }

      if (savedRestaurant) {
        setRestaurant(JSON.parse(savedRestaurant));
      }
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error);
    } finally {
      setIsInitialized(true);
    }
  };

  /**
   * Salvar carrinho no armazenamento local
   */
  const saveCartToStorage = async () => {
    try {
      await AsyncStorage.setItem(CART_ITEMS_KEY, JSON.stringify(items));
      await AsyncStorage.setItem(CART_RESTAURANT_KEY, JSON.stringify(restaurant));
    } catch (error) {
      console.error('Erro ao salvar carrinho:', error);
    }
  };

  /**
   * Verificar se pode adicionar item (mesmo restaurante)
   */
  const canAddItem = (restaurantId: string): boolean => {
    if (!restaurant) return true;
    return restaurant.id === restaurantId;
  };

  /**
   * Adicionar item ao carrinho
   */
  const addItem = (
    menuItem: MenuItem, 
    quantity: number = 1, 
    extras: any[] = [], 
    removedIngredients: string[] = [],
    customizations: any = {},
    observations?: string
  ) => {
    // Verificar se é do mesmo restaurante
    const restaurantId = menuItem.restaurantId || restaurant?.id;
    if (restaurantId && !canAddItem(restaurantId)) {
      throw new Error('Não é possível adicionar itens de restaurantes diferentes');
    }

    const extrasTotal = extras.reduce((sum, extra) => {
      const quantidade = extra.quantidade || 1;
      return sum + (extra.preco * quantidade);
    }, 0);
    const customizationsTotal = Object.values(customizations).reduce((sum: number, custom: any) => {
      return sum + (custom.preco_adicional || 0);
    }, 0);
    
    const totalPrice = (menuItem.preco + extrasTotal + customizationsTotal) * quantity;

    const newItem: CartItem = {
      id: `${menuItem.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      menuItem,
      quantity,
      selectedExtras: extras,
      removedIngredients,
      customizations,
      observations,
      totalPrice,
    };

    setItems(prevItems => [...prevItems, newItem]);
  };

  /**
   * Remover item do carrinho
   */
  const removeItem = (itemId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
    
    // Limpar restaurante se carrinho estiver vazio
    if (items.length === 1) {
      setRestaurant(null);
    }
  };

  /**
   * Atualizar quantidade de item
   */
  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          const extrasTotal = item.selectedExtras.reduce((sum, extra) => {
            const quantidade = extra.quantidade || 1;
            return sum + (extra.preco * quantidade);
          }, 0);
          const customizationsTotal = Object.values(item.customizations).reduce((sum: number, custom: any) => {
            return sum + (custom.preco_adicional || 0);
          }, 0);
          
          const totalPrice = (item.menuItem.preco + extrasTotal + customizationsTotal) * quantity;
          
          return {
            ...item,
            quantity,
            totalPrice,
          };
        }
        return item;
      })
    );
  };

  /**
   * Limpar carrinho
   */
  const clearCart = () => {
    setItems([]);
    setRestaurant(null);
  };

  /**
   * Definir restaurante do carrinho
   */
  const setRestaurantForCart = (newRestaurant: Restaurant) => {
    // Se mudar de restaurante, limpar carrinho
    if (restaurant && restaurant.id !== newRestaurant.id) {
      setItems([]);
    }
    setRestaurant(newRestaurant);
  };

  // Calcular totais
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const deliveryFee = restaurant?.taxaEntrega || restaurant?.taxa_entrega || 0;
  const total = subtotal + deliveryFee;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const isCartEmpty = items.length === 0;

  return (
    <CartContext.Provider
      value={{
        items,
        restaurant,
        subtotal,
        deliveryFee,
        total,
        itemCount,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        setRestaurant: setRestaurantForCart,
        canAddItem,
        isCartEmpty,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

/**
 * Hook para usar o contexto do carrinho
 */
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
