import { apiClient } from './client';

export type ProductStatus = 'draft' | 'active' | 'paused' | 'archived';

export interface ProductImage {
  url: string;
  publicId: string;
  isMain: boolean;
}

export interface ProductOptionRef {
  storeOptionId: string;
  storeOptionName: string;
}

export interface VariantCombinationEntry {
  optionId: string;
  optionName: string;
  value: string;
}

export interface ProductVariant {
  _id: string;
  combination: VariantCombinationEntry[];
  price: number | null;
  stock: number;
  images: ProductImage[];
  enabled: boolean;
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
  linkedOptions: ProductOptionRef[];
  variants: ProductVariant[];
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

  uploadImages: (id: string, files: File[]) => {
    const form = new FormData();
    files.forEach((file) => form.append('images', file));
    return apiClient.post<ProductImage[]>(`${BASE}/${id}/images`, form);
  },

  deleteImage: (id: string, publicId: string) =>
    apiClient.delete<ProductImage[]>(`${BASE}/${id}/images`, { data: { publicId } }),

  setMainImage: (id: string, publicId: string) =>
    apiClient.put<ProductImage[]>(`${BASE}/${id}/images/main`, { publicId }),

  reorderImages: (id: string, order: string[]) =>
    apiClient.put<ProductImage[]>(`${BASE}/${id}/images/order`, { order }),

  setOptions: (id: string, optionIds: string[]) =>
    apiClient.put<Product>(`${BASE}/${id}/options`, { options: optionIds }),

  updateVariant: (id: string, variantId: string, payload: Partial<Pick<ProductVariant, 'price' | 'stock' | 'enabled'>>) =>
    apiClient.put<ProductVariant>(`${BASE}/${id}/variants/${variantId}`, payload),
};
