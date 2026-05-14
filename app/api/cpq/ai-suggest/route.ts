import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { callAI } from '@/lib/ai-gateway';

/**
 * POST /api/cpq/ai-suggest
 * AI suggests optimal pricing / bundle for a prospect.
 *
 * Body:
 * {
 *   opportunityId?: string,
 *   leadId?: string,
 *   budget?: number,
 *   notes?: string,         // extra prospect context
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { opportunityId, leadId, budget, notes } = body as {
      opportunityId?: string;
      leadId?: string;
      budget?: number;
      notes?: string;
    };

    if (!opportunityId && !leadId) {
      return NextResponse.json(
        { error: 'Either opportunityId or leadId is required' },
        { status: 400 }
      );
    }

    // Gather context
    const [opportunity, lead, products, bundles, pricingRules] = await Promise.all([
      opportunityId
        ? prisma.opportunity.findUnique({
            where: { id: opportunityId },
            include: { client: true, contact: true },
          })
        : null,
      leadId
        ? prisma.lead.findUnique({
            where: { id: leadId },
            include: { client: true, campaign: true },
          })
        : null,
      prisma.product.findMany({ where: { isActive: true } }),
      prisma.productBundle.findMany({
        where: { isActive: true },
        include: { items: true },
      }),
      prisma.productRule.findMany({ where: { isActive: true, ruleType: 'PRICING' } }),
    ]);

    const productSummary = products
      .slice(0, 30)
      .map((p) => `- ${p.name} (${p.category ?? 'General'}): $${p.unitPrice}`)
      .join('\n');

    const bundleSummary = bundles
      .slice(0, 10)
      .map(
        (b) =>
          `- ${b.name}: base $${b.basePrice ?? 'N/A'}, ${b.discountPercent ?? 0}% bundle discount`
      )
      .join('\n');

    const prospectInfo = opportunity
      ? `Opportunity: ${opportunity.name} | Stage: ${opportunity.stage} | Amount: $${opportunity.amount} | Client: ${opportunity.client?.name}`
      : lead
      ? `Lead: ${lead.fullName} | Company: ${lead.company ?? 'N/A'} | Industry: ${lead.client?.name ?? 'N/A'}`
      : '';

    const prompt = `You are a CPQ pricing specialist. Suggest the optimal product bundle and pricing for this prospect.

Prospect Information:
${prospectInfo}
${budget ? `Budget: $${budget}` : ''}
${notes ? `Additional Context: ${notes}` : ''}

Available Products:
${productSummary}

Available Bundles:
${bundleSummary}

Active Pricing Rules: ${pricingRules.length} rules (e.g., volume discounts)

Respond ONLY with a JSON object:
{
  "recommendedProducts": [
    {
      "productName": "<name>",
      "quantity": <number>,
      "rationale": "<why this product fits>"
    }
  ],
  "recommendedBundle": "<bundle name or null>",
  "suggestedDiscount": <number 0-30>,
  "estimatedValue": <number>,
  "confidence": <number 0-1>,
  "narrative": "<2-3 sentence explanation of the recommendation>",
  "upsellOpportunities": ["<upsell 1>", "<upsell 2>"]
}`;

    const systemPrompt =
      'You are an expert CPQ (Configure Price Quote) specialist who helps sales teams build optimal quotes. Always respond with valid JSON only.';

    const aiResponse = await callAI(prompt, { systemPrompt, maxTokens: 2048, temperature: 0.4 });

    let suggestion: Record<string, any>;
    try {
      let jsonStr = aiResponse.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '');
      suggestion = JSON.parse(jsonStr);
    } catch {
      suggestion = { narrative: aiResponse, recommendedProducts: [], confidence: 0.5 };
    }

    return NextResponse.json({ suggestion, opportunityId, leadId });
  } catch (error: any) {
    console.error('Error in CPQ AI suggest:', error);
    return NextResponse.json({ error: 'Failed to generate AI suggestion' }, { status: 500 });
  }
}
