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
  avgRating: number | null;
  reviewCount: number;
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
  exclude?: string;
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
    exclude: params.exclude,
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


export interface StorePolicies {
  returns_enabled?: boolean;
  return_days?: number;
  warranty_enabled?: boolean;
  warranty_months?: number;
}

export interface StoreInfo {
  name: string;
  description?: string;
  logo_url?: string | null;
  brand_hue?: number;
  brand_saturation?: number;
  brand_lightness?: number;
  font_family?: string;
  currency?: 'ARS' | 'USD';
  theme?: string;
  background?: string;
  product_detail_layout?: string;
  cart_layout?: string;
  search_preset?: string;
  promo_bar_enabled?: boolean;
  promo_bar_position?: 'above-navbar' | 'below-navbar' | 'footer';
  free_shipping_min_amount?: number | null;
  installments_count?: number | null;
  interest_free?: boolean;
  share_button_enabled?: boolean;
  buy_now_enabled?: boolean;
  related_products_enabled?: boolean;
  low_stock_threshold?: number;
  ratings_enabled?: boolean;
  reviews_enabled?: boolean;
  store_policies?: StorePolicies;
}

export interface ProductReview {
  _id: string;
  buyerId: string;
  buyerEmail?: string;
  rating: number;
  title?: string;
  body?: string;
  createdAt: string;
}

export interface ReviewDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface ProductReviewsResponse {
  data: ProductReview[];
  total: number;
  limit: number;
  page: number;
  avgRating: number | null;
  distribution: ReviewDistribution;
}

export async function getStoreInfo(): Promise<StoreInfo | null> {
  const slug = await getSlug();
  try {
    const res = await fetch(`${BFF_BASE_URL}/api/store/public?_store=${slug}`, {
      headers: { 'X-Tenant-Slug': slug },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as StoreInfo;
  } catch {
    return null;
  }
}

export async function getProductReviews(
  productId: string,
  limit = 3,
): Promise<ProductReviewsResponse | null> {
  const slug = await getSlug();
  try {
    const res = await fetch(
      `${BFF_BASE_URL}/api/product/products/${productId}/reviews?limit=${limit}&page=1`,
      {
        headers: { 'X-Tenant-Slug': slug },
        next: { revalidate: 30 },
      },
    );
    if (!res.ok) return null;
    return (await res.json()) as ProductReviewsResponse;
  } catch {
    return null;
  }
}

