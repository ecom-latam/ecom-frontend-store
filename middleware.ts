import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PREFIX = '/admin';
const ADMIN_LOGIN = '/admin/login';

function extractSlug(req: NextRequest): string | null {
  const host = req.headers.get('host') ?? '';
  const prod = host.match(/^([^.]+)\.ecom\.com(:\d+)?$/);
  if (prod) return prod[1];
  const dev = host.match(/^([^.]+)\.localhost(:\d+)?$/);
  if (dev) return dev[1];
  return null;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = req.cookies.has('session');

  const isAdmin = pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`);
  const isCart = pathname === '/cart' || pathname.startsWith('/cart/');

  if (isAdmin || isCart) {
    const slug = extractSlug(req);
    if (!slug) {
      return NextResponse.rewrite(new URL('/not-found', req.url));
    }
    const headers = new Headers(req.headers);
    headers.set('x-store-slug', slug);

    if (isAdmin) {
      if (pathname === ADMIN_LOGIN) {
        if (hasSession) {
          return NextResponse.redirect(new URL('/admin', req.url));
        }
        return NextResponse.next({ request: { headers } });
      }
      if (!hasSession) {
        return NextResponse.redirect(new URL('/admin/login', req.url));
      }
      return NextResponse.next({ request: { headers } });
    }

    if (isCart && !hasSession) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
