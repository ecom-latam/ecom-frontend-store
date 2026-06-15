import type { Metadata } from 'next';
import { CatalogNavbar } from '@/components/catalog/CatalogNavbar';
import { CartDrawer } from '@/components/catalog/CartDrawer';
import { PromoBar } from '@/components/catalog/PromoBar';
import { getStoreInfo } from '@/lib/api/storeClient';

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

export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PromoBar position="above-navbar" />
      <CatalogNavbar />
      <PromoBar position="below-navbar" />
      <CartDrawer />
      {children}
      <PromoBar position="footer" />
    </>
  );
}
