'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProductForm, { type ProductFormValues } from '@/components/admin/ProductForm';

type Category = { _id: string; name: string };

export default function AdminProductNewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data.filter((c: Category & { status: string }) => c.status === 'active'));
        }
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(values: ProductFormValues) {
    setError('');
    setLoading(true);

    const price = parseFloat(values.price);
    const salePrice = values.salePrice ? parseFloat(values.salePrice) : undefined;
    const stock = values.stock ? parseInt(values.stock, 10) : 0;

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          description: values.description || undefined,
          price,
          ...(salePrice !== undefined && { salePrice }),
          stock,
          status: values.status,
          ...(values.categoryId && { categoryId: values.categoryId }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) { router.replace('/admin/login'); return; }
        setError(data.error ?? 'INTERNAL_ERROR');
        return;
      }

      router.push(`/admin/products/${(data as { _id: string })._id}/edit`);
    } catch {
      setError('INTERNAL_ERROR');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/products" className="text-sm text-gray-500 hover:text-gray-700">
          ← Volver a productos
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mt-2">Nuevo producto</h1>
      </div>

      <ProductForm
        categories={categories}
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
        submitLabel="Crear producto"
      />
    </div>
  );
}
