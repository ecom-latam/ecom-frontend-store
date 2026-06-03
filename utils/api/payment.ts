import { apiClient } from './client';

export interface PreferenceItem {
  title: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
}

export interface CreatePreferencePayload {
  items: PreferenceItem[];
  back_urls: { success: string; failure: string; pending: string };
  external_reference?: string;
}

export interface PreferenceResponse {
  init_point: string;
  preference_id: string;
}

export interface ProcessPaymentPayload {
  payment_id: string;
  customerId: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    address?: string;
    city?: string;
    province?: string;
    zip?: string;
  };
  shippingMethod: string;
  notes?: string;
}

export interface ProcessPaymentResponse {
  order_id: string;
  payment_status: string;
}

export const payment = {
  createPreference: (payload: CreatePreferencePayload) =>
    apiClient.post<PreferenceResponse>('/api/payment/preference', payload),
  processPayment: (payload: ProcessPaymentPayload) =>
    apiClient.post<ProcessPaymentResponse>('/api/payment/process', payload),
};
