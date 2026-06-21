import { apiClient } from './client';

export interface StoreOption {
  _id: string;
  name: string;
  values: string[];
  storeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreOptionPayload {
  name: string;
  values: string[];
}

const BASE = '/api/product/store-options';

export const storeOptions = {
  list: () =>
    apiClient.get<StoreOption[]>(BASE),

  create: (payload: StoreOptionPayload) =>
    apiClient.post<StoreOption>(BASE, payload),

  update: (id: string, payload: Partial<StoreOptionPayload>) =>
    apiClient.put<StoreOption>(`${BASE}/${id}`, payload),

  delete: (id: string) =>
    apiClient.delete(`${BASE}/${id}`),
};
