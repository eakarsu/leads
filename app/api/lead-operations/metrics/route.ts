import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/lead-operations/api';
import { requireOperationsActor, scopedClientId } from '@/lib/lead-operations/auth';

export async function GET(request: NextRequest) {
  try {
    const actor = await requireOperationsActor();
    const clientId = scopedClientId(actor, request.nextUrl.searchParams.get('clientId'));
    const [totalLeads, converted, suppressed, reviewPending, outreachFailures, syncFailures, attributions, leads] = await Promise.all([
      prisma.lead.count({ where: { clientId } }),
      prisma.leadGovernance.count({ where: { clientId, stage: 'CONVERTED' } }),
      prisma.leadGovernance.count({ where: { clientId, stage: 'SUPPRESSED' } }),
      prisma.governedOutreach.count({ where: { lead: { clientId }, state: 'REVIEW_PENDING' } }),
      prisma.governedOutreach.count({ where: { lead: { clientId }, state: 'DEAD_LETTER' } }),
      prisma.leadSyncOperation.count({ where: { connector: { clientId }, status: 'DEAD_LETTER' } }),
      prisma.leadConversionAttribution.findMany({ where: { lead: { clientId } }, select: { dataQuality: true } }),
      prisma.lead.findMany({ where: { clientId }, select: { email: true, phone: true, company: true, title: true, campaignId: true } }),
    ]);
    const averageCompleteness = leads.length === 0 ? 0 : Math.round(leads.reduce((sum, lead) => sum + ([lead.email, lead.phone, lead.company, lead.title, lead.campaignId].filter(Boolean).length / 5) * 100, 0) / leads.length);
    return NextResponse.json({
      totalLeads, converted, suppressed, reviewPending, outreachFailures, syncFailures,
      conversionRate: totalLeads ? Number(((converted / totalLeads) * 100).toFixed(2)) : 0,
      averageCompleteness, attributedConversions: attributions.length,
    });
  } catch (error) { return apiError(error); }
}
