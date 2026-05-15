import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies } from '@/lib/auth/cookies';

const BFF_URL = process.env.BFF_URL ?? 'http://localhost:4000';

export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') ?? '';

  await fetch(`${BFF_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { Cookie: cookieHeader },
  }).catch(() => {});

  const response = NextResponse.json({}, { status: 204 });
  clearAuthCookies(response);
  return response;
}
