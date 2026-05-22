import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const opportunity = body.opportunity || { name: 'Enterprise renewal', amount: 240000, stageAge: 31, probability: 42 };
  const blockers = Array.isArray(body.blockers) ? body.blockers : ['no legal owner', 'missing economic buyer'];
  const stageAge = Number(opportunity.stageAge || 0);
  const probability = Number(opportunity.probability || 0);
  const risk = Math.min(100, Math.max(0, Math.round(stageAge * 1.4 + blockers.length * 16 + (100 - probability) * 0.35)));

  return NextResponse.json({
    opportunity: opportunity.name || 'Opportunity',
    risk,
    roomMode: risk >= 75 ? 'war room' : risk >= 50 ? 'manager review' : 'standard inspection',
    actions: [
      blockers.includes('missing economic buyer') ? 'Confirm economic buyer and success metric.' : 'Validate champion strength.',
      blockers.includes('no legal owner') ? 'Assign legal owner and redline date.' : 'Keep legal review on normal path.',
      'Set next meeting with mutual close plan and dated exit criteria.',
    ],
  });
}
