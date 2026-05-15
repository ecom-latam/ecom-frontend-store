'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

type StoreOption = { _id: string; name: string; values: string[] };

type CombinationEntry = { optionId: string; optionName: string; value: string };

type Variant = {
  _id: string;
  combination: CombinationEntry[];
  price: number | null;
  stock: number;
  enabled: boolean;
};

type LinkedOption = { storeOptionId: string; storeOptionName: string };

type Props = {
  productId: string;
  hasVariants: boolean;
  linkedOptions: LinkedOption[];
};

function combinationLabel(combination: CombinationEntry[]) {
  return combination.map((c) => `${c.optionName}: ${c.value}`).join(' / ');
}

export default function VariantsSection({ productId, hasVariants: initialHasVariants, linkedOptions: initialLinkedOptions }: Props) {
  const [allOptions, setAllOptions] = useState<StoreOption[]>([]);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(
    initialLinkedOptions.map((o) => o.storeOptionId)
  );
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');
  const enabled = initialHasVariants || selectedOptionIds.length > 0;

  const loadVariants = useCallback(async () => {
    setLoadingVariants(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}/variants`);
      if (res.ok) setVariants(await res.json());
    } finally {
      setLoadingVariants(false);
    }
  }, [productId]);

  useEffect(() => {
    fetch('/api/admin/options')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setAllOptions(data); })
      .catch(() => {})
      .finally(() => setLoadingOptions(false));

    if (initialHasVariants) loadVariants();
  }, [initialHasVariants, loadVariants]);

  async function handleOptionToggle(optionId: string) {
    const next = selectedOptionIds.includes(optionId)
      ? selectedOptionIds.filter((id) => id !== optionId)
      : [...selectedOptionIds, optionId];
    setSelectedOptionIds(next);
    await assignOptions(next);
  }

  async function assignOptions(optionIds: string[]) {
    setAssigning(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/products/${productId}/options`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ options: optionIds }),
      });
      if (!res.ok) { setError('No se pudieron guardar las opciones.'); return; }
      await loadVariants();
    } catch {
      setError('Error de conexión.');
    } finally {
      setAssigning(false);
    }
  }

  if (loadingOptions) return <p className="text-sm text-gray-400">Cargando variables...</p>;

  return (
    <div>
      <h2 className="text-base font-medium text-gray-900 mb-4">Variantes</h2>

      {allOptions.length === 0 ? (
        <p className="text-sm text-gray-500">
          No hay variables de tienda creadas.{' '}
          <a href="/admin/variables" className="underline text-gray-700 hover:text-gray-900">Crear variables</a>
        </p>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Seleccioná las variables que aplican a este producto:</p>
            <div className="flex flex-wrap gap-3">
              {allOptions.map((opt) => (
                <label key={opt._id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedOptionIds.includes(opt._id)}
                    onChange={() => handleOptionToggle(opt._id)}
                    disabled={assigning}
                    className="accent-gray-900"
                  />
                  <span className="text-sm text-gray-700">{opt.name}</span>
                  <span className="text-xs text-gray-400">({opt.values.join(', ')})</span>
                </label>
              ))}
            </div>
          </div>

          {assigning && <p className="text-xs text-gray-400 mb-3">Generando variantes...</p>}
          {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

          {enabled && !loadingVariants && variants.length > 0 && (
            <VariantsTable productId={productId} variants={variants} />
          )}

          {enabled && !loadingVariants && variants.length === 0 && selectedOptionIds.length > 0 && !assigning && (
            <p className="text-sm text-gray-400">No se generaron variantes.</p>
          )}
        </>
      )}
    </div>
  );
}

function VariantsTable({ productId, variants }: { productId: string; variants: Variant[] }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Combinación</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Precio</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Stock</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Habilitada</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {variants.map((v) => (
            <VariantRow key={v._id} productId={productId} variant={v} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VariantRow({ productId, variant }: { productId: string; variant: Variant }) {
  const [price, setPrice] = useState(variant.price !== null ? String(variant.price) : '');
  const [stock, setStock] = useState(String(variant.stock));
  const [enabled, setEnabled] = useState(variant.enabled);
  const savedRef = useRef({ price: variant.price, stock: variant.stock, enabled: variant.enabled });
  const [saving, setSaving] = useState(false);

  async function save(patch: { price?: number | null; stock?: number; enabled?: boolean }) {
    setSaving(true);
    try {
      await fetch(`/api/admin/products/${productId}/variants/${variant._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      savedRef.current = { ...savedRef.current, ...patch };
    } finally {
      setSaving(false);
    }
  }

  function handlePriceBlur() {
    const parsed = price === '' ? null : Number(price);
    if (parsed === savedRef.current.price) return;
    save({ price: parsed });
  }

  function handleStockBlur() {
    const parsed = Math.max(0, parseInt(stock) || 0);
    setStock(String(parsed));
    if (parsed === savedRef.current.stock) return;
    save({ stock: parsed });
  }

  function handleEnabledChange(checked: boolean) {
    setEnabled(checked);
    if (checked === savedRef.current.enabled) return;
    save({ enabled: checked });
  }

  return (
    <tr className={`transition-colors ${enabled ? 'hover:bg-gray-50' : 'bg-gray-50 opacity-60'}`}>
      <td className="px-4 py-2 text-gray-700 font-mono text-xs">{combinationLabel(variant.combination)}</td>
      <td className="px-4 py-2">
        <input
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          onBlur={handlePriceBlur}
          placeholder="Base"
          disabled={saving}
          className="w-24 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:opacity-50"
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="number"
          min="0"
          step="1"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          onBlur={handleStockBlur}
          disabled={saving}
          className="w-20 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:opacity-50"
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => handleEnabledChange(e.target.checked)}
          disabled={saving}
          className="accent-gray-900 w-4 h-4"
        />
      </td>
    </tr>
  );
}
