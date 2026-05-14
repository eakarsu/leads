// Apply pass 5 — PII scrub probe endpoint.
//
// PRODUCT-DECISION: stateless, accepts a string and returns the scrubbed
// version. Not auto-applied to other AI routes.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { scrubPII } from '@/lib/piiScrubber';

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const text = body?.text;
  if (typeof text !== 'string') {
    return NextResponse.json({ error: 'text (string) required' }, { status: 400 });
  }
  const result = scrubPII(text, body?.options);
  return NextResponse.json(result);
}
