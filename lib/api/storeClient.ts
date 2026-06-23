import { cache } from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { PageRowData } from 'zoui';

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
  images: { url: string; publicId: string; isMain: boolean }[];
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
  hideOutOfStock?: boolean;
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
    hideOutOfStock: params.hideOutOfStock ? 'true' : undefined,
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

// EC-633: config comercial de ecom-store -- solo existe cuando la tienda
// tiene catalogo (ver ecom-page EC-632, que es quien la embebe acá adentro).
export interface StoreCommerceConfig {
  currency?: 'ARS' | 'USD';
  mp_public_key?: string | null;
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
  hide_out_of_stock_products?: boolean;
  store_policies?: StorePolicies;
  transfer_info?: string;
  transfer_cbu?: string;
  transfer_alias?: string;
  transfer_bank?: string;
  transfer_owner?: string;
  transfer_cuit?: string;
}

export interface PageInfo {
  name: string;
  description?: string;
  logo_url?: string | null;
  brand_hue?: number;
  brand_saturation?: number;
  brand_lightness?: number;
  brand2_hue?: number | null;
  brand2_saturation?: number | null;
  brand2_lightness?: number | null;
  font_family?: string;
  theme?: string;
  hasCatalog?: boolean;
  hasPurchases?: boolean;
  // EC-568: solo tipado por consistencia -- EC-14 (analiticas) no existe
  // todavia, nada lee este campo en el storefront.
  hasMetrics?: boolean;
  // EC-632/633: config comercial de ecom-store, embebida por ecom-page --
  // ausente del todo en tiendas sin catalogo.
  store?: StoreCommerceConfig;
  // EC-645: listado unico de paginas visibles, 'home' siempre primera --
  // cada una con sus rows. Ya no hay un campo `rows` suelto a nivel raiz.
  pages?: { slug: string; title: string; rows: PageRowData[] }[];
}

// EC-587: una pagina puntual del page builder, servida por
// app/(catalog)/[pageSlug]/page.tsx.
export interface PageContent {
  slug: string;
  title: string;
  rows: PageRowData[];
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

// EC-632/633: page es el concepto principal -- ecom-page embebe la config
// comercial de ecom-store bajo `store` cuando la tienda tiene catalogo, asi
// que el front pide un solo endpoint en vez de combinar dos por su cuenta.
//
// root layout, (catalog) layout y (catalog)/page.tsx llaman esto por separado
// en el mismo render -- cache: 'no-store' rompe la memoizacion automatica de
// fetch de Next, asi que sin el wrap de React.cache() cada llamada dispara su
// propio request (visto en vivo: 4 requests a /api/page/public por una sola
// carga de pagina, antes de este wrap).
export const getPageInfo = cache(async (): Promise<PageInfo | null> => {
  const slug = await getSlug();
  try {
    const res = await fetch(`${BFF_BASE_URL}/api/page/public?_store=${slug}`, {
      headers: { 'X-Tenant-Slug': slug },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json().catch(() => null);
  } catch {
    return null;
  }
});

// EC-587: pagina puntual del page builder (no 'home'). null si no existe o
// esta oculta -- el caller llama notFound().
export const getPageBySlug = cache(async (pageSlug: string): Promise<PageContent | null> => {
  const slug = await getSlug();
  try {
    const res = await fetch(`${BFF_BASE_URL}/api/page/public/${pageSlug}?_store=${slug}`, {
      headers: { 'X-Tenant-Slug': slug },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json().catch(() => null);
  } catch {
    return null;
  }
});

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

