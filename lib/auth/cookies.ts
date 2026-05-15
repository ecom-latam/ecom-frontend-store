import { NextResponse } from 'next/server';

const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
const ACCESS_TOKEN_MAX_AGE = 60 * 15;
const IS_PROD = process.env.NODE_ENV === 'production';

export function setAuthCookies(response: NextResponse, accessToken: string): void {
  response.cookies.set('session', '1', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
    secure: IS_PROD,
  });
  response.cookies.set('access_token', accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_TOKEN_MAX_AGE,
    secure: IS_PROD,
  });
}

export function clearAuthCookies(response: NextResponse): void {
  response.cookies.delete('session');
  response.cookies.delete('access_token');
}
