'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-bold text-gray-200 mb-4">!</p>
      <h1 className="text-2xl font-semibold text-gray-900 mb-3">Algo salió mal</h1>
      <p className="text-gray-600 mb-8 max-w-sm">
        Ocurrió un error inesperado. Podés intentar de nuevo o volver al inicio.
      </p>
      <button onClick={reset} className="btn btn--md btn--rounded btn--filled">
        Reintentar
      </button>
    </main>
  );
}
