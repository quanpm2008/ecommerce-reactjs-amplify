import React, { createContext, useContext, ReactNode } from 'react';
import { useCartStore } from '../store/cartStore';
import type { Product, CartItem } from '../types/graphql';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const cart = useCartStore();

  const value: CartContextType = {
    items: cart.items,
    addItem: cart.addItem,
    removeItem: cart.removeItem,
    updateQuantity: cart.updateQuantity,
    clearCart: cart.clearCart,
    getTotalPrice: cart.getTotalPrice,
    getTotalItems: cart.getTotalItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
