import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookies, clearAuthCookies } from '@/lib/auth/cookies';

const BFF_URL = process.env.BFF_URL ?? 'http://localhost:4000';

export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') ?? '';

  const res = await fetch(`${BFF_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { Cookie: cookieHeader },
  });

  if (!res.ok) {
    const response = NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    clearAuthCookies(response);
    return response;
  }

  const data = await res.json();
  const response = NextResponse.json(data, { status: 200 });

  for (const cookie of res.headers.getSetCookie()) {
    response.headers.append('set-cookie', cookie);
  }

  if ('accessToken' in data) {
    setAuthCookies(response, data.accessToken);
  }

  return response;
}
