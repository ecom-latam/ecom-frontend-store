import { NextRequest, NextResponse } from 'next/server';

import { applyAuthResult, authenticatedFetch } from '@/lib/auth/serverFetch';
import { extractSlugFromRequest } from '@/lib/tenant/extractSlug';

export async function POST(req: NextRequest) {
  const slug = extractSlugFromRequest(req);
  const body = await req.json();

  const result = await authenticatedFetch(req, '/api/cart/items', {
    method: 'POST',
    headers: { 'X-Tenant-Slug': slug ?? '' },
    body: JSON.stringify(body),
  });
  const response = NextResponse.json(
    result.ok ? result.data : { error: result.ok ? null : result.error },
    { status: result.status }
  );
  applyAuthResult(result, response);
  return response;
}
