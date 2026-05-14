// Apply pass 5 — list registered prompt versions.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listPrompts, renderPrompt } from '@/lib/promptVersions';

export async function GET() {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ prompts: listPrompts() });
}

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const id = body?.id;
  const vars = body?.vars || {};
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const rendered = renderPrompt(id, vars);
  if (rendered == null) return NextResponse.json({ error: `unknown prompt id: ${id}` }, { status: 404 });
  return NextResponse.json({ id, rendered });
}
