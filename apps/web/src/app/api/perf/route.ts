import type { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const event = await req.json();
  console.info('[chart:perf:beacon]', JSON.stringify(event));
  return new Response(null, { status: 204 });
}
