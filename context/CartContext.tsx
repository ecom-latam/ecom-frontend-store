'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { apiClient } from '@/utils/api/client';
import type { Cart, CartItem } from '@/lib/cart/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCartRequest, fetchCartSuccess } from '@/store/cart/cartSlice';

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  isLoading: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  refreshCart: () => void;
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
  const dispatch = useAppDispatch();
  const { items, loading: cartLoading } = useAppSelector((s) => s.cart);
  const [mutationLoading, setMutationLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isLoading = cartLoading || mutationLoading;

  useEffect(() => {
    if (hasSession) dispatch(fetchCartRequest());
  }, [hasSession, dispatch]);

  const refreshCart = useCallback(() => {
    if (!hasSession) return;
    dispatch(fetchCartRequest());
  }, [hasSession, dispatch]);

  const addItem = useCallback(
    async (payload: { productId: string; selectedOptions?: Record<string, string>; quantity?: number }) => {
      setMutationLoading(true);
      try {
        const { data } = await apiClient.post<Cart>('/api/cart/items', { quantity: 1, ...payload });
        dispatch(fetchCartSuccess(data.items ?? []));
        return { ok: true };
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { error?: string; available?: number } } };
        return {
          ok: false,
          error: axiosErr?.response?.data?.error,
          available: axiosErr?.response?.data?.available,
        };
      } finally {
        setMutationLoading(false);
      }
    },
    [dispatch]
  );

  const updateItem = useCallback(async (itemId: string, quantity: number) => {
    setMutationLoading(true);
    try {
      const { data } = await apiClient.put<Cart>(`/api/cart/items/${itemId}`, { quantity });
      dispatch(fetchCartSuccess(data.items ?? []));
      return { ok: true };
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string; available?: number } } };
      return { ok: false, error: axiosErr?.response?.data?.error, available: axiosErr?.response?.data?.available };
    } finally {
      setMutationLoading(false);
    }
  }, [dispatch]);

  const removeItem = useCallback(async (itemId: string) => {
    setMutationLoading(true);
    try {
      const { data } = await apiClient.delete<Cart>(`/api/cart/items/${itemId}`);
      dispatch(fetchCartSuccess(data.items ?? []));
    } catch {
      // item already gone
    } finally {
      setMutationLoading(false);
    }
  }, [dispatch]);

  const clearCart = useCallback(async () => {
    setMutationLoading(true);
    try {
      await apiClient.delete('/api/cart');
      dispatch(fetchCartSuccess([]));
    } finally {
      setMutationLoading(false);
    }
  }, [dispatch]);

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
