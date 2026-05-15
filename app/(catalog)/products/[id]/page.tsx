import Image from 'next/image';
import Link from 'next/link';
import { cookies } from 'next/headers';

import { AddToCartButton } from '@/components/catalog/AddToCartButton';
import { getCategories, getProduct } from '@/lib/api/storeClient';

interface Props {
  params: { id: string };
}

export default async function ProductDetailPage({ params }: Props) {
  const cookieStore = await cookies();
  const hasSession = cookieStore.has('session');

  const [product, categories] = await Promise.all([
    getProduct(params.id),
    getCategories(),
  ]);

  const category = categories.find((c) => c._id === String(product.categoryId));
  const mainImage = product.images.find((img) => img.isMain) ?? product.images[0];
  const secondaryImages = product.images.filter((img) => img !== mainImage);
  const displayPrice = product.salePrice ?? product.price;
  const hasDiscount = product.salePrice !== null && product.salePrice < product.price;

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/products" className="text-sm text-gray-500 hover:text-gray-900 mb-6 inline-block">
          ← Volver al catálogo
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
          <div className="flex flex-col gap-3">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {mainImage ? (
                <Image
                  src={mainImage.url}
                  alt={product.name}
                  width={600}
                  height={600}
                  className="object-cover w-full h-full"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl">
                  □
                </div>
              )}
            </div>

            {secondaryImages.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {secondaryImages.map((img, i) => (
                  <div
                    key={i}
                    className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden"
                  >
                    <Image
                      src={img.url}
                      alt={`${product.name} ${i + 2}`}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            {category && (
              <Link
                href={`/products?categoryId=${category._id}`}
                className="text-xs text-gray-500 uppercase tracking-wide hover:text-gray-900 mb-2"
              >
                {category.name}
              </Link>
            )}

            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>

            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gray-900">
                ${displayPrice.toLocaleString('es-AR')}
              </span>
              {hasDiscount && (
                <span className="text-lg text-gray-400 line-through">
                  ${product.price.toLocaleString('es-AR')}
                </span>
              )}
            </div>

            {product.description && (
              <p className="mt-4 text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            )}

            {product.hasVariants && product.linkedOptions.length > 0 && (
              <div className="mt-6">
                <p className="text-sm text-gray-500">
                  {product.linkedOptions.map((o) => o.storeOptionName).join(', ')}
                </p>
              </div>
            )}

            {product.stock > 0 ? (
              <p className="mt-6 text-sm text-green-600">En stock ({product.stock} disponibles)</p>
            ) : (
              <p className="mt-6 text-sm text-red-500">Sin stock</p>
            )}

            <AddToCartButton product={product} hasSession={hasSession} />
          </div>
        </div>
      </div>
    </main>
  );
}
