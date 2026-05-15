import { NextRequest } from 'next/server';

export function extractSlugFromRequest(req: NextRequest): string | null {
  const host = req.headers.get('host') ?? '';
  const prodMatch = host.match(/^([^.]+)\.ecom\.com(:\d+)?$/);
  if (prodMatch) return prodMatch[1];
  const devMatch = host.match(/^([^.]+)\.localhost(:\d+)?$/);
  if (devMatch) return devMatch[1];
  return null;
}
