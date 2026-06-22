import { redirect } from 'next/navigation';
import { getPageInfo } from '@/lib/api/storeClient';
import { InformationalHome } from '@/components/catalog/InformationalHome';

// EC-559: tiendas tipo "informativa" (sin catalogo) muestran el contenido
// de ecom-page acá en vez de redirigir al catalogo, que no existe para ellas.
export default async function CatalogIndex() {
  const storeInfo = await getPageInfo();

  if (storeInfo?.hasCatalog === false) {
    return <InformationalHome storeInfo={storeInfo} />;
  }

  redirect('/productos');
}
