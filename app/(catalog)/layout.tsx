import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { CatalogNavbar } from '@/components/catalog/CatalogNavbar';
import { CartDrawer } from '@/components/catalog/CartDrawer';
import { getStoreInfo } from '@/lib/api/storeClient';

const BFF_URL = process.env.BFF_URL ?? 'http://localhost:4000';

async function getSessionUser(accessToken: string): Promise<{ email: string } | null> {
  try {
    const res = await fetch(`${BFF_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json() as { email: string };
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const info = await getStoreInfo();
  const name = info?.name ?? 'Tienda';
  return {
    title: {
      default: name,
      template: `%s | ${name}`,
    },
    description: info?.description ?? undefined,
    openGraph: {
      title: name,
      description: info?.description ?? undefined,
      ...(info?.logo_url ? { images: [info.logo_url] } : {}),
    },
  };
}

export default async function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  let user: { email: string } | null = null;
  if (accessToken) {
    user = await getSessionUser(accessToken);
  }

  return (
    <>
      <CatalogNavbar isLoggedIn={!!user} userEmail={user?.email} />
      <CartDrawer />
      {children}
    </>
  );
}
