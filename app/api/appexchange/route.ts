import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// AppExchange-style Marketplace — list third-party integrations + templates with revenue share.
// TODO: configure credentials — STRIPE_CONNECT_CLIENT_ID for partner payouts.

interface MarketplaceListing {
  id: string;
  name: string;
  type: 'integration' | 'template' | 'app';
  publisher: string;
  description?: string;
  pricingModel: 'free' | 'one_time' | 'monthly' | 'usage';
  priceUSD?: number;
  revenueSharePct?: number;
  installs: number;
  rating?: number;
  createdAt: string;
}

const listings = new Map<string, MarketplaceListing>();
const installs = new Map<string, { listingId: string; orgId: string; installedAt: string }>();

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const type = new URL(request.url).searchParams.get('type');
  const all = Array.from(listings.values());
  return NextResponse.json({ listings: type ? all.filter((l) => l.type === type) : all });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Partial<MarketplaceListing> & { action?: 'list' | 'install' };
  if (body.action === 'install') {
    if (!body.id) return NextResponse.json({ error: 'listing id required' }, { status: 400 });
    const l = listings.get(body.id);
    if (!l) return NextResponse.json({ error: 'listing not found' }, { status: 404 });
    l.installs += 1;
    const inst = { listingId: body.id, orgId: (session.user as { id: string }).id, installedAt: new Date().toISOString() };
    installs.set(`${body.id}_${inst.orgId}`, inst);
    return NextResponse.json({ install: inst, listing: l });
  }

  if (!body.name || !body.type || !body.publisher) {
    return NextResponse.json({ error: 'name, type, publisher required' }, { status: 400 });
  }
  const id = body.id || `mkt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const listing: MarketplaceListing = {
    id,
    name: body.name,
    type: body.type,
    publisher: body.publisher,
    description: body.description,
    pricingModel: body.pricingModel || 'free',
    priceUSD: body.priceUSD,
    revenueSharePct: body.revenueSharePct ?? 0.7,
    installs: 0,
    rating: body.rating,
    createdAt: new Date().toISOString(),
  };
  listings.set(id, listing);
  return NextResponse.json({ listing });
}
