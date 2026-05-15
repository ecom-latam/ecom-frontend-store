import { NextResponse } from 'next/server';
import { client } from '@/lib/api/client';

export async function GET() {
  try {
    const data = await client.get('/health');
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ status: 'error' }, { status: 503 });
  }
}
