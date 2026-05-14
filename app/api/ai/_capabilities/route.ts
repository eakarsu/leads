// Apply pass 5 — capabilities listing for the new pass-5 endpoints.
//
// PRODUCT-DECISION: surface only the new pass-5 capabilities here, not the
// full 28-route AI surface — that's owned by the UI navigation.

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({
    capabilities: [
      { name: 'embed', category: 'NEEDS-CREDS', env: 'EMBEDDING_API_KEY', stub: 'STUB_EMBEDDINGS=1' },
      { name: 'rag/search', category: 'NEEDS-CREDS', env: 'VECTOR_DB_URL', stub: 'STUB_EMBEDDINGS=1 (in-memory cosine)' },
      { name: '_pii-scrub', category: 'NEEDS-PRODUCT-DECISION', env: null },
      { name: '_prompts', category: 'MECHANICAL', env: null },
      { name: '_capabilities', category: 'MECHANICAL', env: null },
      { name: 'org-rate-limiter (lib only)', category: 'NEEDS-PRODUCT-DECISION', env: null, note: 'opt-in import' },
    ],
  });
}
