'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import type { Cart, CartItem } from '@/lib/cart/types';

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  isLoading: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  refreshCart: () => Promise<void>;
  addItem: (payload: {
    productId: string;
    selectedOptions?: Record<string, string>;
    quantity?: number;
  }) => Promise<{ ok: boolean; error?: string; available?: number }>;
  updateItem: (itemId: string, quantity: number) => Promise<{ ok: boolean; error?: string }>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}

interface CartProviderProps {
  children: React.ReactNode;
  hasSession: boolean;
}

export function CartProvider({ children, hasSession }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!hasSession) return;
    try {
      const res = await fetch('/api/cart');
      if (res.ok) {
        const data: Cart = await res.json();
        setItems(data.items ?? []);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    }
  }, [hasSession]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addItem = useCallback(
    async (payload: { productId: string; selectedOptions?: Record<string, string>; quantity?: number }) => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/cart/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: 1, ...payload }),
        });
        const data = await res.json();
        if (res.ok) {
          setItems(data.items ?? []);
          return { ok: true };
        }
        return { ok: false, error: data.error, available: data.available };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateItem = useCallback(async (itemId: string, quantity: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      const data = await res.json();
      if (res.ok) {
        setItems(data.items ?? []);
        return { ok: true };
      }
      return { ok: false, error: data.error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeItem = useCallback(async (itemId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearCart = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetch('/api/cart', { method: 'DELETE' });
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        isLoading,
        drawerOpen,
        openDrawer: () => setDrawerOpen(true),
        closeDrawer: () => setDrawerOpen(false),
        refreshCart,
        addItem,
        updateItem,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
