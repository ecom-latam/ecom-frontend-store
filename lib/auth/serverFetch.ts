import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookies, clearAuthCookies } from './cookies';

const BFF_URL = process.env.BFF_URL ?? 'http://localhost:4000';

type ServerFetchResult =
  | { ok: true; data: unknown; status: number; refreshedToken?: string }
  | { ok: false; status: number; error: string; clearSession?: boolean };

export async function authenticatedFetch(
  req: NextRequest,
  path: string,
  init: RequestInit = {}
): Promise<ServerFetchResult> {
  const accessToken = req.cookies.get('access_token')?.value;

  if (!accessToken) {
    return { ok: false, status: 401, error: 'NO_ACCESS_TOKEN', clearSession: true };
  }

  const res = await fetch(`${BFF_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (res.status === 401) {
    const cookieHeader = req.headers.get('cookie') ?? '';
    const refreshRes = await fetch(`${BFF_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: cookieHeader },
    }).catch(() => null);

    if (!refreshRes || !refreshRes.ok) {
      return { ok: false, status: 401, error: 'SESSION_EXPIRED', clearSession: true };
    }

    const refreshData = await refreshRes.json();
    const newToken = refreshData.accessToken as string | undefined;
    if (!newToken) {
      return { ok: false, status: 401, error: 'SESSION_EXPIRED', clearSession: true };
    }

    const retryRes = await fetch(`${BFF_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
        Authorization: `Bearer ${newToken}`,
      },
    });

    const retryData = await retryRes.json();
    if (!retryRes.ok) {
      return { ok: false, status: retryRes.status, error: (retryData as { error?: string }).error ?? 'REQUEST_FAILED' };
    }
    return { ok: true, data: retryData, status: retryRes.status, refreshedToken: newToken };
  }

  const data = res.status === 204 ? null : await res.json();
  if (!res.ok) {
    return { ok: false, status: res.status, error: (data as { error?: string })?.error ?? 'REQUEST_FAILED' };
  }
  return { ok: true, data, status: res.status };
}

export function applyAuthResult(
  result: ServerFetchResult,
  response: NextResponse
): void {
  if (!result.ok && result.clearSession) {
    clearAuthCookies(response);
    return;
  }
  if (result.ok && result.refreshedToken) {
    setAuthCookies(response, result.refreshedToken);
  }
}
