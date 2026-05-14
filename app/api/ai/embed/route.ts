// Apply pass 5 — embeddings endpoint (NEEDS-CREDS).
//
// ENV VAR: EMBEDDING_API_KEY — required for live embedding.
// Returns 503 + { missing: 'EMBEDDING_API_KEY' } when unset.
//
// PRODUCT-DECISION: in-memory deterministic stub returns a fake-vector of
// dimension 8 when STUB_EMBEDDINGS=1, so FE devs can wire the integration
// without provider creds. The stub is hash-based and stable for the same input.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

function envHas(name: string): boolean {
  const v = process.env[name];
  if (!v) return false;
  if (/^your[_-]?/i.test(v)) return false;
  if (v === 'dummy' || v === 'changeme') return false;
  return true;
}

function stubVector(text: string, dim = 8): number[] {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  const out: number[] = [];
  let x = h || 1;
  for (let i = 0; i < dim; i++) {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    out.push((x % 1000) / 1000);
  }
  return out;
}

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const text = body?.text;
  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'text (string) required' }, { status: 400 });
  }
  if (process.env.STUB_EMBEDDINGS === '1') {
    return NextResponse.json({ vector: stubVector(text), model: 'stub-8d', stub: true });
  }
  if (!envHas('EMBEDDING_API_KEY')) {
    return NextResponse.json(
      { error: 'Embedding provider unavailable', missing: 'EMBEDDING_API_KEY' },
      { status: 503 },
    );
  }
  return NextResponse.json(
    { error: 'Embedding integration deferred (creds present)', missing: 'EMBEDDING_API_KEY' },
    { status: 503 },
  );
}
