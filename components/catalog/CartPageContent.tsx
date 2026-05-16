'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { useCart } from '@/context/CartContext';
import { Button } from 'zoui';

export function CartPageContent() {
  const router = useRouter();
  const { items, isLoading, updateItem, removeItem, clearCart } = useCart();

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (isLoading && items.length === 0) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-400 text-lg mb-4">Tu carrito está vacío.</p>
          <Button variant="filled" shape="rounded" size="md" onClick={() => router.push('/productos')}>
            Ver productos
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mi carrito</h1>
          <button
            onClick={clearCart}
            disabled={isLoading}
            className="text-sm text-gray-400 hover:text-red-500 disabled:opacity-40"
          >
            Vaciar carrito
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <div
                key={item._id}
                className="flex gap-4 border border-gray-200 rounded-xl p-4"
              >
                <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">
                      □
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => router.push(`/producto?id=${item.productId}`)}
                    className="font-medium text-gray-900 hover:underline text-left"
                  >
                    {item.name}
                  </button>

                  {Object.keys(item.selectedOptions).length > 0 && (
                    <p className="text-sm text-gray-400 mt-0.5">
                      {Object.entries(item.selectedOptions)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' · ')}
                    </p>
                  )}

                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    ${item.price.toLocaleString('es-AR')}
                  </p>

                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      variant="outlined"
                      shape="square"
                      size="sm"
                      onClick={() => updateItem(item._id, item.quantity - 1)}
                      disabled={item.quantity <= 1 || isLoading}
                    >
                      −
                    </Button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <Button
                      variant="outlined"
                      shape="square"
                      size="sm"
                      onClick={() => updateItem(item._id, item.quantity + 1)}
                      disabled={isLoading}
                    >
                      +
                    </Button>

                    <span className="ml-4 text-sm text-gray-500">
                      Total: ${(item.price * item.quantity).toLocaleString('es-AR')}
                    </span>

                    <button
                      onClick={() => removeItem(item._id)}
                      disabled={isLoading}
                      className="ml-auto text-sm text-gray-400 hover:text-red-500 disabled:opacity-40"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="border border-gray-200 rounded-xl p-5 sticky top-20 space-y-4">
              <h2 className="font-semibold text-gray-900">Resumen</h2>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Productos ({items.reduce((s, i) => s + i.quantity, 0)})</span>
                  <span>${subtotal.toLocaleString('es-AR')}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 flex justify-between font-semibold text-gray-900">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString('es-AR')}</span>
              </div>

              <Button
                variant="filled"
                shape="pill"
                size="md"
                disabled
                title="Disponible próximamente"
                style={{ width: '100%', justifyContent: 'center', cursor: 'not-allowed' }}
              >
                Ir al checkout
              </Button>

              <button
                onClick={() => router.push('/productos')}
                className="block text-center text-sm text-gray-500 hover:text-gray-900 w-full"
              >
                Seguir comprando
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
