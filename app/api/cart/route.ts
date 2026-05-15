import { NextRequest, NextResponse } from 'next/server';

import { applyAuthResult, authenticatedFetch } from '@/lib/auth/serverFetch';
import { extractSlugFromRequest } from '@/lib/tenant/extractSlug';

function tenantHeaders(req: NextRequest): Record<string, string> {
  const slug = extractSlugFromRequest(req);
  return slug ? { 'X-Tenant-Slug': slug } : {};
}

export async function GET(req: NextRequest) {
  const result = await authenticatedFetch(req, '/api/cart', {
    headers: tenantHeaders(req),
  });
  const response = NextResponse.json(
    result.ok ? result.data : { error: result.ok ? null : result.error },
    { status: result.status }
  );
  applyAuthResult(result, response);
  return response;
}

export async function DELETE(req: NextRequest) {
  const result = await authenticatedFetch(req, '/api/cart', {
    method: 'DELETE',
    headers: tenantHeaders(req),
  });
  const response = NextResponse.json(
    result.ok ? result.data : { error: result.ok ? null : result.error },
    { status: result.status }
  );
  applyAuthResult(result, response);
  return response;
}
