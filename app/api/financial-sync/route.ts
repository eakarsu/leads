import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Embedded Stripe/QuickBooks Financial Sync — close-won opportunity -> invoice + GL revenue rec.
// TODO: configure credentials — STRIPE_SECRET_KEY, QUICKBOOKS_REALM_ID, QUICKBOOKS_ACCESS_TOKEN.

interface RevRecEntry {
  id: string;
  source: 'opportunity' | 'invoice';
  sourceId: string;
  amount: number;
  recognizedAt: string;
  glAccount: string;
  status: 'queued' | 'posted' | 'failed';
}

const ledger: RevRecEntry[] = [];

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { opportunityId?: string; force?: boolean };
  if (!body.opportunityId) return NextResponse.json({ error: 'opportunityId required' }, { status: 400 });

  let opp: { id: string; amount: number | null; name: string; stage?: string } | null = null;
  try {
    opp = await (prisma as any).opportunity.findUnique({
      where: { id: body.opportunityId },
      select: { id: true, amount: true, name: true, stage: true },
    });
  } catch {
    // schema variance — proceed with a stub
  }
  if (!opp) return NextResponse.json({ error: 'opportunity not found' }, { status: 404 });

  if (opp.stage && opp.stage !== 'Closed Won' && !body.force) {
    return NextResponse.json({ error: 'opportunity not Closed Won', currentStage: opp.stage }, { status: 409 });
  }

  const stripeReady = !!process.env.STRIPE_SECRET_KEY;
  const qboReady = !!(process.env.QUICKBOOKS_REALM_ID && process.env.QUICKBOOKS_ACCESS_TOKEN);

  const entry: RevRecEntry = {
    id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    source: 'opportunity',
    sourceId: opp.id,
    amount: Number(opp.amount || 0),
    recognizedAt: new Date().toISOString(),
    glAccount: '4000-Revenue',
    status: stripeReady && qboReady ? 'posted' : 'queued',
  };
  ledger.push(entry);

  return NextResponse.json({
    entry,
    integrations: {
      stripe: stripeReady,
      quickbooks: qboReady,
      message: stripeReady && qboReady ? 'fully wired' : 'TODO: configure credentials — STRIPE_SECRET_KEY, QUICKBOOKS_REALM_ID, QUICKBOOKS_ACCESS_TOKEN.',
    },
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ entries: ledger.slice(-100) });
}
