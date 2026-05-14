// Apply pass 5 — RAG search endpoint.
//
// ENV VAR: VECTOR_DB_URL — required for live vector store.
// Returns 503 + { missing: 'VECTOR_DB_URL' } when unset.
//
// PRODUCT-DECISION: when STUB_EMBEDDINGS=1, runs an in-memory cosine
// similarity over a client-supplied corpus. This unblocks FE devs without a
// vector DB. NOT durable.

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
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  const out: number[] = [];
  let x = h || 1;
  for (let i = 0; i < dim; i++) {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    out.push((x % 1000) / 1000);
  }
  return out;
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const query: string = body?.query;
  const corpus: { id: string; text: string }[] = Array.isArray(body?.corpus) ? body.corpus : [];
  const k = Math.max(1, Math.min(50, Number(body?.k) || 5));

  if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 });

  if (process.env.STUB_EMBEDDINGS === '1' && corpus.length > 0) {
    const qv = stubVector(query);
    const scored = corpus.map((c) => ({ id: c.id, text: c.text, score: cosine(qv, stubVector(c.text)) }));
    scored.sort((a, b) => b.score - a.score);
    return NextResponse.json({ results: scored.slice(0, k), stub: true });
  }
  if (!envHas('VECTOR_DB_URL')) {
    return NextResponse.json(
      { error: 'Vector store unavailable', missing: 'VECTOR_DB_URL' },
      { status: 503 },
    );
  }
  return NextResponse.json(
    { error: 'Vector store integration deferred (config present)', missing: 'VECTOR_DB_URL' },
    { status: 503 },
  );
}
