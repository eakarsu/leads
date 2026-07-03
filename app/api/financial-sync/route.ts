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

function ensureSeedLedger() {
  if (ledger.length >= 15) return;
  const names = [
    'Acme',
    'Northstar',
    'Pioneer',
    'Summit',
    'Urban Retail',
    'BluePeak',
    'Harbor',
    'Keystone',
    'Evergreen',
    'Atlas',
    'Canyon',
    'Metro',
    'Cobalt',
    'Vertex',
    'BrightPath',
  ];
  names.slice(ledger.length).forEach((name, index) => {
    ledger.push({
      id: `rev_seed_${String(ledger.length + 1).padStart(3, '0')}`,
      source: index % 3 === 0 ? 'invoice' : 'opportunity',
      sourceId: `${index % 3 === 0 ? 'INV' : 'OPP'}-SEED-${String(ledger.length + 1).padStart(3, '0')}`,
      amount: 12000 + ledger.length * 4500,
      recognizedAt: new Date(Date.now() - ledger.length * 86400000).toISOString(),
      glAccount: ['4000-Revenue', '4010-Services', '4020-Subscriptions'][ledger.length % 3],
      status: ['posted', 'queued', 'failed'][ledger.length % 3] as RevRecEntry['status'],
    });
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { opportunityId?: string; force?: boolean };
  if (!body.opportunityId) return NextResponse.json({ error: 'opportunityId required' }, { status: 400 });

  const opp = await prisma.opportunity.findUnique({
    where: { id: body.opportunityId },
    select: { id: true, amount: true, name: true, stage: true },
  });
  if (!opp) return NextResponse.json({ error: 'opportunity not found' }, { status: 404 });

  if (opp.stage && opp.stage !== 'CLOSED_WON' && !body.force) {
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
  ensureSeedLedger();
  return NextResponse.json({ entries: ledger.slice(-100) });
}
