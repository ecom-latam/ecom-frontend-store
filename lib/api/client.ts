export class BffError extends Error {
  constructor(public code: string) {
    super(code);
    this.name = 'BffError';
  }
}

export const BFF_BASE_URL = process.env.NEXT_PUBLIC_BFF_URL ?? 'http://localhost:4000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BFF_BASE_URL}${path}`, {
    cache: 'no-store',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new BffError(data?.error?.code ?? 'INTERNAL_ERROR');
  }

  return data as T;
}

export const client = {
  get: <T>(path: string, init?: RequestInit) =>
    request<T>(path, { ...init, method: 'GET' }),

  post: <T>(path: string, body: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: 'POST',
      body: JSON.stringify(body),
    }),

  put: <T>(path: string, body: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: <T>(path: string, init?: RequestInit) =>
    request<T>(path, { ...init, method: 'DELETE' }),
};
