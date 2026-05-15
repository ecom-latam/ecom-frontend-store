'use client';

import { FormEvent } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export type ProductFormValues = {
  name: string;
  description: string;
  price: string;
  salePrice: string;
  stock: string;
  status: string;
  categoryId: string;
};

const STATUSES = [
  { value: 'draft', label: 'Borrador' },
  { value: 'active', label: 'Activo' },
  { value: 'paused', label: 'Pausado' },
  { value: 'archived', label: 'Archivado' },
];

const CREATE_ERRORS: Record<string, string> = {
  MISSING_NAME: 'El nombre es obligatorio.',
  MISSING_PRICE: 'El precio es obligatorio.',
  INVALID_PRICE: 'El precio debe ser un número mayor o igual a cero.',
  SLUG_CONFLICT: 'Ya existe un producto con ese nombre. Usá un nombre diferente.',
  INTERNAL_ERROR: 'Error del servidor. Intentá de nuevo.',
};

type Category = { _id: string; name: string };

type Props = {
  defaultValues?: Partial<ProductFormValues>;
  categories?: Category[];
  onSubmit: (values: ProductFormValues) => Promise<void>;
  loading: boolean;
  error: string;
  submitLabel?: string;
};

export default function ProductForm({
  defaultValues = {},
  categories = [],
  onSubmit,
  loading,
  error,
  submitLabel = 'Guardar',
}: Props) {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    onSubmit({
      name: form.get('name') as string,
      description: form.get('description') as string,
      price: form.get('price') as string,
      salePrice: form.get('salePrice') as string,
      stock: form.get('stock') as string,
      status: form.get('status') as string,
      categoryId: form.get('categoryId') as string,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
      <Input
        id="name"
        name="name"
        type="text"
        required
        label="Nombre *"
        defaultValue={defaultValues.name ?? ''}
        fullWidth
      />

      <div>
        <label htmlFor="description" className="field__label" style={{ display: 'block', marginBottom: 6 }}>
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultValues.description ?? ''}
          className="field field--outlined"
          style={{ maxWidth: 'none', resize: 'none', padding: '8px 14px', height: 'auto' }}
        />
      </div>

      <Select
        id="categoryId"
        name="categoryId"
        label="Categoría"
        defaultValue={defaultValues.categoryId ?? ''}
        fullWidth
      >
        <option value="">Sin categoría</option>
        {categories.map((c) => (
          <option key={c._id} value={c._id}>
            {c.name}
          </option>
        ))}
      </Select>

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="price"
          name="price"
          type="number"
          min="0"
          step="0.01"
          required
          label="Precio *"
          defaultValue={defaultValues.price ?? ''}
          fullWidth
        />
        <Input
          id="salePrice"
          name="salePrice"
          type="number"
          min="0"
          step="0.01"
          label="Precio oferta"
          defaultValue={defaultValues.salePrice ?? ''}
          fullWidth
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="stock"
          name="stock"
          type="number"
          min="0"
          step="1"
          label="Stock"
          defaultValue={defaultValues.stock ?? '0'}
          fullWidth
        />
        <Select
          id="status"
          name="status"
          label="Estado"
          defaultValue={defaultValues.status ?? 'draft'}
          fullWidth
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>

      {error && (
        <p className="field__hint field__hint--error">{CREATE_ERRORS[error] ?? error}</p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" loading={loading} variant="filled" shape="rounded" size="md">
          {loading ? 'Guardando...' : submitLabel}
        </Button>
        <a href="/admin/products" className="btn btn--ghost btn--rounded btn--sm">
          Cancelar
        </a>
      </div>
    </form>
  );
}
