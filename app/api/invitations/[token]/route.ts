import { NextRequest, NextResponse } from 'next/server';

const BFF_URL = process.env.BFF_URL ?? 'http://localhost:4000';

type Params = { params: Promise<{ token: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;

  const res = await fetch(`${BFF_URL}/api/auth/invitations/${token}`);
  const data = res.status === 204 ? null : await res.json();

  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest, { params }: Params) {
  const { token } = await params;
  const body = await req.json();

  const res = await fetch(`${BFF_URL}/api/auth/invitations/${token}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = res.status === 204 ? null : await res.json();
  return NextResponse.json(data, { status: res.status });
}
