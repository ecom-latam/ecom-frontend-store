import { jwtDecode } from 'jwt-decode';

interface TokenPayload {
  userId: string;
  role: string | null;
  type: string;
  iat: number;
  exp: number;
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwtDecode<TokenPayload>(token);
  } catch {
    return null;
  }
}

export function getAccessTokenRole(): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('access_token');
  if (!token) return null;
  return decodeToken(token)?.role ?? null;
}

export function isBuyer(): boolean {
  return getAccessTokenRole() === 'Customer';
}
