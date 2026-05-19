'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { apiClient } from '@/utils/api/client';
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
  updateItem: (itemId: string, quantity: number) => Promise<{ ok: boolean; error?: string; available?: number }>;
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
      const { data } = await apiClient.get<Cart>('/api/cart');
      setItems(data.items ?? []);
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
        const { data } = await apiClient.post<Cart>('/api/cart/items', { quantity: 1, ...payload });
        setItems(data.items ?? []);
        return { ok: true };
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { error?: string; available?: number } } };
        return {
          ok: false,
          error: axiosErr?.response?.data?.error,
          available: axiosErr?.response?.data?.available,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateItem = useCallback(async (itemId: string, quantity: number) => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.put<Cart>(`/api/cart/items/${itemId}`, { quantity });
      setItems(data.items ?? []);
      return { ok: true };
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string; available?: number } } };
      return { ok: false, error: axiosErr?.response?.data?.error, available: axiosErr?.response?.data?.available };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeItem = useCallback(async (itemId: string) => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.delete<Cart>(`/api/cart/items/${itemId}`);
      setItems(data.items ?? []);
    } catch {
      // item already gone
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearCart = useCallback(async () => {
    setIsLoading(true);
    try {
      await apiClient.delete('/api/cart');
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
