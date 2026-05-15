'use client';

import { useState, KeyboardEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ERRORS: Record<string, string> = {
  MISSING_NAME: 'El nombre es obligatorio.',
  MISSING_VALUES: 'Agregá al menos un valor.',
  DUPLICATE_NAME: 'Ya existe una variable con ese nombre.',
  INTERNAL_ERROR: 'Error del servidor. Intentá de nuevo.',
};

export default function AdminVariableNewPage() {
  const router = useRouter();
  const [values, setValues] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function addValue(raw: string) {
    const val = raw.trim();
    if (val && !values.includes(val)) {
      setValues((prev) => [...prev, val]);
    }
    setInputValue('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addValue(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '') {
      setValues((prev) => prev.slice(0, -1));
    }
  }

  function removeValue(val: string) {
    setValues((prev) => prev.filter((v) => v !== val));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    const form = new FormData(e.currentTarget);
    const name = (form.get('name') as string).trim();
    const finalValues = inputValue.trim() ? [...values, inputValue.trim()] : values;

    if (!name) { setError('MISSING_NAME'); return; }
    if (finalValues.length === 0) { setError('MISSING_VALUES'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, values: finalValues }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) { router.replace('/admin/login'); return; }
        setError(data.error ?? 'INTERNAL_ERROR');
        return;
      }
      router.push('/admin/variables');
    } catch {
      setError('INTERNAL_ERROR');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/variables" className="text-sm text-gray-500 hover:text-gray-700">
          ← Volver a variables
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mt-2">Nueva variable</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoFocus
            placeholder="ej: Color"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valores <span className="text-red-500">*</span>
          </label>
          <div className="border border-gray-300 rounded-md px-3 py-2 flex flex-wrap gap-1 focus-within:ring-2 focus-within:ring-gray-900 min-h-[42px]">
            {values.map((v) => (
              <span
                key={v}
                className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full"
              >
                {v}
                <button
                  type="button"
                  onClick={() => removeValue(v)}
                  className="text-gray-400 hover:text-gray-700 leading-none"
                  aria-label={`Eliminar ${v}`}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => addValue(inputValue)}
              placeholder={values.length === 0 ? 'ej: Rojo, Azul, Verde (Enter para agregar)' : ''}
              className="flex-1 min-w-[120px] text-sm outline-none bg-transparent"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Presioná Enter o coma para agregar cada valor.</p>
        </div>

        {error && <p className="text-sm text-red-600">{ERRORS[error] ?? error}</p>}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="bg-gray-900 text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creando...' : 'Crear variable'}
          </button>
          <Link href="/admin/variables" className="text-sm text-gray-500 hover:text-gray-700">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
