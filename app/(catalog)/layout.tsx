import { CatalogNavbar } from '@/components/catalog/CatalogNavbar';
import { CartDrawer } from '@/components/catalog/CartDrawer';

export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CatalogNavbar />
      <CartDrawer />
      {children}
    </>
  );
}
