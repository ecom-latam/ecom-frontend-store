'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import ProductForm, { type ProductFormValues } from '@/components/admin/ProductForm';
import ImageUploader, { type ProductImage } from '@/components/admin/ImageUploader';
import VariantsSection from '@/components/admin/VariantsSection';

type Category = { _id: string; name: string };

type LinkedOption = { storeOptionId: string; storeOptionName: string };

type Product = {
  _id: string;
  name: string;
  description: string;
  price: number;
  salePrice: number | null;
  stock: number;
  status: string;
  categoryId?: string;
  images: ProductImage[];
  hasVariants: boolean;
  linkedOptions: LinkedOption[];
};

export default function AdminProductEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fetchError, setFetchError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [productRes, categoriesRes] = await Promise.all([
          fetch(`/api/admin/products/${id}`),
          fetch('/api/admin/categories'),
        ]);

        if (!productRes.ok) {
          if (productRes.status === 401) { router.replace('/admin/login'); return; }
          if (productRes.status === 404) { setFetchError('Producto no encontrado.'); return; }
          setFetchError('No se pudo cargar el producto.');
          return;
        }

        const [productData, categoriesData] = await Promise.all([
          productRes.json(),
          categoriesRes.json(),
        ]);

        setProduct(productData);
        if (Array.isArray(categoriesData)) {
          setCategories(categoriesData.filter((c: Category & { status: string }) => c.status === 'active'));
        }
      } catch {
        setFetchError('Error de conexión.');
      }
    }
    load();
  }, [id, router]);

  async function handleSubmit(values: ProductFormValues) {
    setSaveError('');
    setLoading(true);

    const price = parseFloat(values.price);
    const salePrice = values.salePrice ? parseFloat(values.salePrice) : null;
    const stock = values.stock ? parseInt(values.stock, 10) : 0;

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          description: values.description || '',
          price,
          salePrice,
          stock,
          status: values.status,
          categoryId: values.categoryId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) { router.replace('/admin/login'); return; }
        setSaveError(data.error ?? 'INTERNAL_ERROR');
        return;
      }

      router.push('/admin/products');
    } catch {
      setSaveError('INTERNAL_ERROR');
    } finally {
      setLoading(false);
    }
  }

  if (fetchError) {
    return (
      <div>
        <Link href="/admin/products" className="text-sm text-gray-500 hover:text-gray-700">
          ← Volver a productos
        </Link>
        <p className="mt-4 text-sm text-red-600">{fetchError}</p>
      </div>
    );
  }

  if (!product) {
    return <p className="text-sm text-gray-500">Cargando producto...</p>;
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/products" className="text-sm text-gray-500 hover:text-gray-700">
          ← Volver a productos
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mt-2">Editar producto</h1>
      </div>

      <ProductForm
        categories={categories}
        defaultValues={{
          name: product.name,
          description: product.description,
          price: String(product.price),
          salePrice: product.salePrice !== null ? String(product.salePrice) : '',
          stock: String(product.stock),
          status: product.status,
          categoryId: product.categoryId ?? '',
        }}
        onSubmit={handleSubmit}
        loading={loading}
        error={saveError}
        submitLabel="Guardar cambios"
      />

      <div className="mt-8 max-w-lg">
        <h2 className="text-base font-medium text-gray-900 mb-3">Imágenes</h2>
        <ImageUploader productId={id} initialImages={product.images ?? []} />
      </div>

      <div className="mt-8 max-w-2xl">
        <VariantsSection
          productId={id}
          hasVariants={product.hasVariants ?? false}
          linkedOptions={product.linkedOptions ?? []}
        />
      </div>
    </div>
  );
}
