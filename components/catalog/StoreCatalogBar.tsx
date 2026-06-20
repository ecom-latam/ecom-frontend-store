'use client';

import { Input, Select, ViewToggle } from 'zoui';

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
  const categoryOptions = [
    { value: '__all__', label: 'Todas las categorías' },
    ...categories,
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 240px' }}>
        <Input
          placeholder="Buscar productos..."
          value={searchValue}
          onChange={(e) => onSearch(e.target.value)}
          fullWidth
        />
      </div>
      <div style={{ flex: '0 0 200px' }}>
        <Select
          options={categoryOptions}
          value={categoryValue || undefined}
          onValueChange={(val) => onCategoryChange(val === '' ? '' : val)}
          placeholder="Todas las categorías"
          fullWidth
        />
      </div>
      <ViewToggle value={view} onChange={onViewChange} />
    </div>
  );
}
