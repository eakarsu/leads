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

function ensureDefaultListings() {
  if (listings.size > 0) return;

  [
    {
      id: 'mkt_slack_sales_alerts',
      name: 'Slack Sales Alerts',
      type: 'integration' as const,
      publisher: 'LeadGenFlow Labs',
      description: 'Push lead assignments, opportunity changes, and case escalations to Slack channels.',
      pricingModel: 'monthly' as const,
      priceUSD: 29,
      revenueSharePct: 0.7,
      installs: 128,
      rating: 4.7,
    },
    {
      id: 'mkt_quickbooks_sync',
      name: 'QuickBooks Revenue Sync',
      type: 'integration' as const,
      publisher: 'FinanceOps Studio',
      description: 'Create invoices and revenue recognition entries from closed-won opportunities.',
      pricingModel: 'monthly' as const,
      priceUSD: 49,
      revenueSharePct: 0.65,
      installs: 84,
      rating: 4.5,
    },
    {
      id: 'mkt_healthcare_crm_pack',
      name: 'Healthcare CRM Pack',
      type: 'template' as const,
      publisher: 'Vertical Cloud Partners',
      description: 'Patient outreach workflows, HIPAA consent fields, and care coordination dashboards.',
      pricingModel: 'one_time' as const,
      priceUSD: 199,
      revenueSharePct: 0.75,
      installs: 56,
      rating: 4.8,
    },
    {
      id: 'mkt_agentforce_lead_router',
      name: 'Agentforce Lead Router',
      type: 'app' as const,
      publisher: 'AI Revenue Systems',
      description: 'AI-assisted lead triage, routing, next-best action prompts, and follow-up automation.',
      pricingModel: 'usage' as const,
      priceUSD: 0.04,
      revenueSharePct: 0.8,
      installs: 211,
      rating: 4.6,
    },
    {
      id: 'mkt_docsign_contracts',
      name: 'DocSign Contract Automation',
      type: 'integration' as const,
      publisher: 'Agreement Cloud Co',
      description: 'Send, track, and archive contracts from opportunities and quotes.',
      pricingModel: 'monthly' as const,
      priceUSD: 39,
      revenueSharePct: 0.68,
      installs: 143,
      rating: 4.4,
    },
    {
      id: 'mkt_zoom_meeting_capture',
      name: 'Zoom Meeting Capture',
      type: 'integration' as const,
      publisher: 'MeetingOps',
      description: 'Attach meeting summaries, transcripts, and action items to CRM records.',
      pricingModel: 'monthly' as const,
      priceUSD: 19,
      revenueSharePct: 0.72,
      installs: 189,
      rating: 4.6,
    },
    {
      id: 'mkt_service_sla_templates',
      name: 'Service SLA Templates',
      type: 'template' as const,
      publisher: 'SupportOps Studio',
      description: 'Prebuilt case queues, milestones, escalation rules, and service dashboards.',
      pricingModel: 'one_time' as const,
      priceUSD: 149,
      revenueSharePct: 0.74,
      installs: 92,
      rating: 4.7,
    },
    {
      id: 'mkt_cpq_bundle_starter',
      name: 'CPQ Bundle Starter',
      type: 'template' as const,
      publisher: 'RevOps Factory',
      description: 'Quote bundles, guided selling rules, and discount approval templates.',
      pricingModel: 'one_time' as const,
      priceUSD: 249,
      revenueSharePct: 0.7,
      installs: 77,
      rating: 4.5,
    },
    {
      id: 'mkt_data_quality_monitor',
      name: 'Data Quality Monitor',
      type: 'app' as const,
      publisher: 'CleanCRM',
      description: 'Detect duplicates, stale records, missing fields, and enrichment gaps.',
      pricingModel: 'monthly' as const,
      priceUSD: 59,
      revenueSharePct: 0.73,
      installs: 166,
      rating: 4.8,
    },
    {
      id: 'mkt_partner_portal_booster',
      name: 'Partner Portal Booster',
      type: 'app' as const,
      publisher: 'ChannelCloud',
      description: 'Deal registration, partner onboarding, MDF requests, and partner scorecards.',
      pricingModel: 'monthly' as const,
      priceUSD: 89,
      revenueSharePct: 0.69,
      installs: 61,
      rating: 4.3,
    },
    {
      id: 'mkt_forecast_ai_pack',
      name: 'Forecast AI Pack',
      type: 'app' as const,
      publisher: 'Pipeline Intelligence',
      description: 'AI forecast explanations, risk scoring, and commit inspection workflows.',
      pricingModel: 'usage' as const,
      priceUSD: 0.08,
      revenueSharePct: 0.78,
      installs: 134,
      rating: 4.6,
    },
    {
      id: 'mkt_healthcare_intake_forms',
      name: 'Healthcare Intake Forms',
      type: 'template' as const,
      publisher: 'CareCloud Builders',
      description: 'Secure intake, consent, eligibility, and referral workflow templates.',
      pricingModel: 'one_time' as const,
      priceUSD: 179,
      revenueSharePct: 0.71,
      installs: 49,
      rating: 4.4,
    },
    {
      id: 'mkt_teams_sales_inbox',
      name: 'Teams Sales Inbox',
      type: 'integration' as const,
      publisher: 'CollabWorks',
      description: 'Route CRM mentions, approvals, and lead updates into Microsoft Teams.',
      pricingModel: 'monthly' as const,
      priceUSD: 25,
      revenueSharePct: 0.66,
      installs: 121,
      rating: 4.5,
    },
    {
      id: 'mkt_security_center_plus',
      name: 'Security Center Plus',
      type: 'app' as const,
      publisher: 'TrustOps',
      description: 'Advanced audit events, permission drift, data exposure, and login risk insights.',
      pricingModel: 'monthly' as const,
      priceUSD: 99,
      revenueSharePct: 0.75,
      installs: 88,
      rating: 4.7,
    },
    {
      id: 'mkt_retail_loyalty_pack',
      name: 'Retail Loyalty Pack',
      type: 'template' as const,
      publisher: 'Commerce Cloud Partners',
      description: 'Loyalty tiers, offers, journeys, and retail customer dashboards.',
      pricingModel: 'one_time' as const,
      priceUSD: 199,
      revenueSharePct: 0.7,
      installs: 73,
      rating: 4.4,
    },
  ].forEach((listing) => {
    listings.set(listing.id, {
      ...listing,
      createdAt: new Date().toISOString(),
    });
  });
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  ensureDefaultListings();
  const type = new URL(request.url).searchParams.get('type');
  const all = Array.from(listings.values());
  return NextResponse.json({ listings: type ? all.filter((l) => l.type === type) : all });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Partial<MarketplaceListing> & { action?: 'list' | 'install' };
  if (body.action === 'install') {
    ensureDefaultListings();
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
