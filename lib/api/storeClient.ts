import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { BFF_BASE_URL, client } from './client';

export interface ProductVariantCombinationEntry {
  optionId: string;
  optionName: string;
  value: string;
}

export interface ProductVariant {
  _id: string;
  combination: ProductVariantCombinationEntry[];
  price: number | null;
  stock: number;
  availableStock?: number;
  enabled: boolean;
}

export interface ProductLinkedOption {
  storeOptionId: string;
  storeOptionName: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice: number | null;
  stock: number;
  availableStock?: number;
  status: string;
  categoryId: string | null;
  images: { url: string; publicId: string; isMain: boolean }[];
  hasVariants: boolean;
  linkedOptions: ProductLinkedOption[];
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  data: Product[];
  total: number;
  limit: number;
  offset: number;
  page: number;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  q?: string;
}

async function getSlug(): Promise<string> {
  const headersList = await headers();
  const slug = headersList.get('x-store-slug');
  if (!slug) notFound();
  return slug;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const q = search.toString();
  return q ? `?${q}` : '';
}

export async function getProducts(params: ProductListParams = {}): Promise<ProductListResponse> {
  const slug = await getSlug();
  const query = buildQuery({
    page: params.page,
    limit: params.limit,
    categoryId: params.categoryId,
    q: params.q,
  });
  return client.get<ProductListResponse>(`/api/product/products${query}`, {
    headers: { 'X-Tenant-Slug': slug },
  });
}

export async function getProduct(id: string): Promise<Product> {
  const slug = await getSlug();
  const res = await fetch(
    `${BFF_BASE_URL}/api/product/products/${id}`,
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Slug': slug,
      },
    }
  );
  if (res.status === 404) notFound();
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error?.code ?? 'INTERNAL_ERROR');
  }
  return (await res.json()) as Product;
}

export async function getCategories(): Promise<Category[]> {
  const slug = await getSlug();
  return client.get<Category[]>('/api/product/categories', {
    headers: { 'X-Tenant-Slug': slug },
  });
}

export interface StoreInfo {
  name: string;
  description?: string;
  logo_url?: string | null;
}

export async function getStoreInfo(): Promise<StoreInfo | null> {
  const slug = await getSlug();
  try {
    const res = await fetch(`${BFF_BASE_URL}/api/store/public`, {
      headers: { 'X-Tenant-Slug': slug },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as StoreInfo;
  } catch {
    return null;
  }
}
