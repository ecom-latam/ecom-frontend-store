'use client';

import { Input, Select, ViewToggle } from 'zoui';
import type { ComponentProps } from 'react';
import type { ViewToggleVariant } from 'zoui';
import { useStoreConfig } from '@/context/StoreConfigContext';

type FieldVariant = ComponentProps<typeof Select>['variant'];

interface Props {
  searchValue: string;
  onSearch: (q: string) => void;
  categories: { label: string; value: string }[];
  categoryValue: string;
  onCategoryChange: (val: string) => void;
  view: 'grid' | 'list';
  onViewChange: (v: 'grid' | 'list') => void;
}

export function StoreCatalogBar({
  searchValue, onSearch,
  categories, categoryValue, onCategoryChange,
  view, onViewChange,
}: Props) {
  const { theme } = useStoreConfig();
  const inputVariant  = (theme ?? 'outlined') as FieldVariant;
  const selectVariant = (theme ?? 'outlined') as FieldVariant;
  const toggleVariant = (theme ?? 'outlined') as ViewToggleVariant;

  const categoryOptions = [
    { value: '__all__', label: 'Todas las categorías' },
    ...categories,
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 240px' }}>
        <Input
          variant={inputVariant}
          placeholder="Buscar productos..."
          value={searchValue}
          onChange={(e) => onSearch(e.target.value)}
          fullWidth
        />
      </div>
      <div style={{ flex: '0 0 200px' }}>
        <Select
          variant={selectVariant}
          options={categoryOptions}
          value={categoryValue || undefined}
          onValueChange={(val) => onCategoryChange(val === '' ? '' : val)}
          placeholder="Todas las categorías"
          fullWidth
        />
      </div>
      <ViewToggle variant={toggleVariant} value={view} onChange={onViewChange} />
    </div>
  );
}
