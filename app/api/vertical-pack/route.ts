import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Vertical Solution Packs — apply industry overlay (healthcare, fin services, manufacturing).

interface Pack {
  id: string;
  industry: 'healthcare' | 'financial_services' | 'manufacturing';
  installedAt: string;
  customObjects: string[];
  workflows: string[];
  dashboards: string[];
}

const installed = new Map<string, Pack>();

const CATALOG: Record<string, Omit<Pack, 'id' | 'installedAt'>> = {
  healthcare: {
    industry: 'healthcare',
    customObjects: ['Patient', 'Encounter', 'CarePlan', 'AuthorizationRequest'],
    workflows: ['hipaa_consent', 'prior_authorization', 'discharge_followup'],
    dashboards: ['Patient360', 'PayerMix', 'PopulationHealth'],
  },
  financial_services: {
    industry: 'financial_services',
    customObjects: ['Household', 'Account', 'FinancialGoal', 'KycCase'],
    workflows: ['kyc_aml', 'rmd_required', 'household_rebalance'],
    dashboards: ['AdvisorBook', 'WealthBenchmark', 'CompliancePulse'],
  },
  manufacturing: {
    industry: 'manufacturing',
    customObjects: ['EquipmentAsset', 'WorkOrder', 'PreventiveCheck', 'WarrantyClaim'],
    workflows: ['warranty_intake', 'preventive_schedule', 'dealer_route'],
    dashboards: ['ProductionPulse', 'PartsAvailability', 'DealerScorecard'],
  },
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ catalog: Object.keys(CATALOG), installed: Array.from(installed.values()) });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { industry?: Pack['industry'] };
  if (!body.industry || !CATALOG[body.industry]) {
    return NextResponse.json({ error: 'industry required (healthcare|financial_services|manufacturing)' }, { status: 400 });
  }
  const id = `pack_${body.industry}_${Date.now()}`;
  const pack: Pack = {
    id,
    installedAt: new Date().toISOString(),
    ...CATALOG[body.industry],
  };
  installed.set(id, pack);
  return NextResponse.json({ pack });
}
