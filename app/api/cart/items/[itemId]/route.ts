import { NextRequest, NextResponse } from 'next/server';

import { applyAuthResult, authenticatedFetch } from '@/lib/auth/serverFetch';
import { extractSlugFromRequest } from '@/lib/tenant/extractSlug';

interface Params {
  params: Promise<{ itemId: string }>;
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { itemId } = await params;
  const slug = extractSlugFromRequest(req);
  const body = await req.json();

  const result = await authenticatedFetch(req, `/api/cart/items/${itemId}`, {
    method: 'PUT',
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

export async function DELETE(req: NextRequest, { params }: Params) {
  const { itemId } = await params;
  const slug = extractSlugFromRequest(req);

  const result = await authenticatedFetch(req, `/api/cart/items/${itemId}`, {
    method: 'DELETE',
    headers: { 'X-Tenant-Slug': slug ?? '' },
  });
  const response = NextResponse.json(
    result.ok ? result.data : { error: result.ok ? null : result.error },
    { status: result.status }
  );
  applyAuthResult(result, response);
  return response;
}
