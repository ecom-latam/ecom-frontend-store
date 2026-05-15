import { NextRequest, NextResponse } from 'next/server';
import { extractSlugFromRequest } from '@/lib/tenant/extractSlug';

const BFF_URL = process.env.BFF_URL ?? 'http://localhost:4000';

export async function POST(req: NextRequest) {
  const slug = extractSlugFromRequest(req);
  if (!slug) return NextResponse.json({ error: 'MISSING_TENANT' }, { status: 400 });

  const body = await req.json();
  const res = await fetch(`${BFF_URL}/api/auth/customer/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Slug': slug,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
