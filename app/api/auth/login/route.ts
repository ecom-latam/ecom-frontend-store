import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookies } from '@/lib/auth/cookies';

const BFF_URL = process.env.BFF_URL ?? 'http://localhost:4000';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const res = await fetch(`${BFF_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  const response = NextResponse.json(data, { status: res.status });

  for (const cookie of res.headers.getSetCookie()) {
    response.headers.append('set-cookie', cookie);
  }

  if (res.ok && 'accessToken' in data) {
    setAuthCookies(response, data.accessToken);
  }

  return response;
}
