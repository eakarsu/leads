import { NextRequest, NextResponse } from 'next/server';
import { authForAI, runAI } from '@/lib/aiHelpers';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/ai/activity-capture
 * Einstein-Activity-Capture clone. Caller posts an inbound email/IM
 * { from, to, subject, body, receivedAt }. The LLM:
 *   - tries to link to an existing Lead/Contact/Opportunity
 *   - extracts BANT signals (budget, authority, need, timeline)
 *   - returns an EnrichmentData-shaped payload
 */
export async function POST(req: NextRequest) {
  const auth = await authForAI();
  if (auth instanceof Response) return auth;

  try {
    const body = await req.json();
    const { from, to, subject, body: emailBody, receivedAt } = body || {};
    if (!from || !emailBody) {
      return NextResponse.json({ error: 'from and body are required' }, { status: 400 });
    }

    // Look up potential matches
    const [leads, contacts, opportunities] = await Promise.all([
      prisma.lead.findMany({
        where: { email: from },
        take: 5,
        select: { id: true, fullName: true, company: true, status: true, leadSource: true },
      }),
      prisma.contact.findMany({
        where: { email: from },
        take: 5,
        select: { id: true, firstName: true, lastName: true, title: true },
      }),
      prisma.opportunity.findMany({
        where: { OR: [{ name: { contains: subject || '', mode: 'insensitive' } }] },
        take: 5,
        select: { id: true, name: true, stage: true, amount: true },
      }),
    ]);

    const systemPrompt = `You are Einstein Activity Capture. Given an inbound email,
identify which CRM record(s) it relates to and extract BANT signals.
Return ONLY JSON:
{
  "linkedTo": { "leadId": null, "contactId": null, "opportunityId": null },
  "bant": {
    "budget": "low|medium|high|unknown",
    "authority": "decision_maker|influencer|user|unknown",
    "need": "..."  ,
    "timeline": "..."
  },
  "engagementDelta": -50 to 50,
  "sentiment": "positive|neutral|negative",
  "summary": "1 sentence",
  "suggestedActions": ["..."]
}`;

    const prompt = JSON.stringify({
      email: { from, to, subject, body: String(emailBody).slice(0, 6000), receivedAt },
      candidates: { leads, contacts, opportunities },
    });

    const result: any = await runAI(auth, prompt, {
      feature: 'activity-capture',
      systemPrompt,
      json: true,
      temperature: 0.2,
      maxTokens: 1024,
      inputPayload: { from, subject, candidatesCount: leads.length + contacts.length + opportunities.length },
    });

    // Persist as EnrichmentData when linked to a Lead — non-fatal if anything fails.
    let enrichmentRow: any = null;
    if (result?.linkedTo?.leadId) {
      try {
        enrichmentRow = await prisma.enrichmentData.create({
          data: {
            leadId: result.linkedTo.leadId,
            extra: result as any,
          },
        });
      } catch {
        /* non-fatal */
      }
    }

    return NextResponse.json({ data: result, enrichmentRow });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
