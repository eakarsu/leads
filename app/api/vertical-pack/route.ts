import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Vertical Solution Packs — apply industry overlay (healthcare, fin services, manufacturing).

interface Pack {
  id: string;
  industry: string;
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
  retail: {
    industry: 'retail',
    customObjects: ['Store', 'LoyaltyMember', 'Offer', 'ReturnCase'],
    workflows: ['loyalty_upgrade', 'abandoned_cart', 'return_triage'],
    dashboards: ['StorePerformance', 'LoyaltyHealth', 'OfferROI'],
  },
  insurance: {
    industry: 'insurance',
    customObjects: ['Policy', 'Claim', 'Broker', 'RiskProfile'],
    workflows: ['claim_intake', 'renewal_notice', 'broker_assignment'],
    dashboards: ['ClaimsPipeline', 'PolicyRetention', 'BrokerScorecard'],
  },
  education: {
    industry: 'education',
    customObjects: ['Student', 'Program', 'Application', 'AdvisorCase'],
    workflows: ['application_review', 'advisor_followup', 'enrollment_risk'],
    dashboards: ['AdmissionsFunnel', 'StudentSuccess', 'ProgramDemand'],
  },
  real_estate: {
    industry: 'real_estate',
    customObjects: ['Property', 'Lease', 'Tenant', 'Inspection'],
    workflows: ['lease_renewal', 'inspection_followup', 'tenant_issue'],
    dashboards: ['PortfolioHealth', 'LeasePipeline', 'TenantRisk'],
  },
  hospitality: {
    industry: 'hospitality',
    customObjects: ['Guest', 'Reservation', 'Venue', 'ServiceRecovery'],
    workflows: ['guest_recovery', 'event_followup', 'vip_offer'],
    dashboards: ['GuestExperience', 'EventPipeline', 'VenueUtilization'],
  },
  telecom: {
    industry: 'telecom',
    customObjects: ['Subscriber', 'ServicePlan', 'OutageCase', 'Device'],
    workflows: ['outage_response', 'plan_upgrade', 'churn_save'],
    dashboards: ['SubscriberGrowth', 'OutageImpact', 'PlanMix'],
  },
  energy: {
    industry: 'energy',
    customObjects: ['Site', 'Meter', 'ServiceAgreement', 'GridCase'],
    workflows: ['meter_issue', 'site_onboarding', 'grid_escalation'],
    dashboards: ['SitePerformance', 'AgreementHealth', 'GridReliability'],
  },
  public_sector: {
    industry: 'public_sector',
    customObjects: ['Constituent', 'Program', 'Grant', 'PublicRequest'],
    workflows: ['request_triage', 'grant_review', 'program_outreach'],
    dashboards: ['ProgramImpact', 'RequestBacklog', 'GrantPipeline'],
  },
  nonprofit: {
    industry: 'nonprofit',
    customObjects: ['Donor', 'CampaignGift', 'Volunteer', 'GrantApplication'],
    workflows: ['donor_thank_you', 'volunteer_shift', 'grant_followup'],
    dashboards: ['FundraisingHealth', 'VolunteerCoverage', 'GrantStatus'],
  },
  logistics: {
    industry: 'logistics',
    customObjects: ['Shipment', 'Carrier', 'Route', 'ExceptionCase'],
    workflows: ['shipment_exception', 'carrier_review', 'route_delay'],
    dashboards: ['ShipmentVelocity', 'CarrierScorecard', 'ExceptionTrends'],
  },
  media: {
    industry: 'media',
    customObjects: ['Advertiser', 'CampaignFlight', 'InventorySlot', 'CreativeReview'],
    workflows: ['creative_approval', 'flight_renewal', 'inventory_alert'],
    dashboards: ['AdRevenue', 'InventoryYield', 'CreativeCycle'],
  },
  automotive: {
    industry: 'automotive',
    customObjects: ['Vehicle', 'Dealer', 'WarrantyClaim', 'FleetAccount'],
    workflows: ['warranty_review', 'dealer_followup', 'fleet_renewal'],
    dashboards: ['DealerPerformance', 'WarrantyTrends', 'FleetPipeline'],
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
    return NextResponse.json({ error: `industry required (${Object.keys(CATALOG).join('|')})` }, { status: 400 });
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
