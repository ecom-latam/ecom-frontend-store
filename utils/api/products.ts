import { apiClient } from './client';

export type ProductStatus = 'draft' | 'active' | 'paused' | 'archived';

export interface ProductImage {
  url: string;
  publicId: string;
  isMain: boolean;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice: number | null;
  stock: number;
  status: ProductStatus;
  categoryId: string | null;
  images: ProductImage[];
  hasVariants: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  offset: number;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  q?: string;
  status?: ProductStatus;
  categoryId?: string;
}

export interface ProductPayload {
  name: string;
  description?: string;
  price: number;
  salePrice?: number | null;
  stock: number;
  categoryId?: string | null;
  status?: ProductStatus;
}

const BASE = '/api/product/products';

export const products = {
  list: (params: ProductListParams = {}) => {
    const query = new URLSearchParams();
    if (params.page)       query.set('page', String(params.page));
    if (params.limit)      query.set('limit', String(params.limit));
    if (params.q)          query.set('q', params.q);
    if (params.status)     query.set('status', params.status);
    if (params.categoryId) query.set('categoryId', params.categoryId);
    return apiClient.get<ProductListResponse>(`${BASE}?${query}`);
  },

  get: (id: string) =>
    apiClient.get<Product>(`${BASE}/${id}`),

  create: (payload: ProductPayload) =>
    apiClient.post<Product>(BASE, payload),

  update: (id: string, payload: Partial<ProductPayload>) =>
    apiClient.put<Product>(`${BASE}/${id}`, payload),

  delete: (id: string) =>
    apiClient.delete(`${BASE}/${id}`),
};
