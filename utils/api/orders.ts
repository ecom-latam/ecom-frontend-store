import { apiClient } from './client';

export type PaymentMethod = 'transfer' | 'cash';
export type PaymentStatus = 'pending' | 'in_progress' | 'paid' | 'failed';
export type OrderStatus = 'new' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  variantId: string | null;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  image: string | null;
  selectedOptions: Record<string, string>;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  zip?: string;
}

export interface Order {
  _id: string;
  orderNumber: number;
  storeId: string;
  customerId: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateOrderPayload {
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  notes?: string;
}

const BASE = '/api/order/orders';
const ADMIN_BASE = '/api/order/admin/orders';

export interface AdminOrderListParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
}

export const orders = {
  create: (payload: CreateOrderPayload) =>
    apiClient.post<Order>(BASE, payload),

  getMy: (page = 1, limit = 20) =>
    apiClient.get<OrderListResponse>(`${BASE}/my?page=${page}&limit=${limit}`),

  getById: (id: string) =>
    apiClient.get<Order>(`${BASE}/${id}`),

  notifyPayment: (id: string) =>
    apiClient.patch<Order>(`${BASE}/${id}/notify-payment`, {}),

  cancel: (id: string) =>
    apiClient.patch<Order>(`${BASE}/${id}/cancel`, {}),

  admin: {
    list: (params: AdminOrderListParams = {}) => {
      const q = new URLSearchParams();
      if (params.page)          q.set('page', String(params.page));
      if (params.limit)         q.set('limit', String(params.limit));
      if (params.status)        q.set('status', params.status);
      if (params.paymentStatus) q.set('paymentStatus', params.paymentStatus);
      if (params.paymentMethod) q.set('paymentMethod', params.paymentMethod);
      return apiClient.get<OrderListResponse>(`${ADMIN_BASE}?${q}`);
    },

    getById: (id: string) =>
      apiClient.get<Order>(`${ADMIN_BASE}/${id}`),

    confirmPayment: (id: string) =>
      apiClient.patch<Order>(`${ADMIN_BASE}/${id}/confirm-payment`, {}),

    updateStatus: (id: string, status: OrderStatus) =>
      apiClient.patch<Order>(`${ADMIN_BASE}/${id}/status`, { status }),

    cancel: (id: string) =>
      apiClient.patch<Order>(`${ADMIN_BASE}/${id}/cancel`, {}),
  },
};
