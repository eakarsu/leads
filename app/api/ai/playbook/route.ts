import { NextRequest, NextResponse } from 'next/server';
import { authForAI, runAI } from '@/lib/aiHelpers';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/ai/playbook
 * Auto-generates an SDR cadence (calls/emails/LinkedIn) for a lead segment.
 * Body: { industry?: string, status?: string, scoreMin?: number, scoreMax?: number }
 *
 * Returns a playbook that can be turned into a SalesCadence.
 */
export async function POST(req: NextRequest) {
  const auth = await authForAI();
  if (auth instanceof Response) return auth;

  try {
    const { industry, status, scoreMin, scoreMax } = await req.json().catch(() => ({}));

    const where: any = {};
    if (status) where.status = status;
    // Industry isn't on Lead in this schema; we filter in-memory via customFields/notes.

    const allLeads = await prisma.lead.findMany({
      where,
      take: 100,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        company: true,
        status: true,
        leadSource: true,
        title: true,
        notes: true,
        customFields: true,
      },
    });
    const sample = industry
      ? allLeads
          .filter((l) => {
            const cf = (l.customFields as any) || {};
            return (
              (cf.industry || '').toLowerCase().includes(industry.toLowerCase()) ||
              (l.notes || '').toLowerCase().includes(industry.toLowerCase())
            );
          })
          .slice(0, 30)
      : allLeads.slice(0, 30);

    const systemPrompt = `You are a sales-cadence designer. Given a lead segment, generate
a 14-day SDR cadence. Return ONLY JSON:
{
  "name": "...",
  "segmentDescription": "...",
  "steps": [
    {"day": 0, "channel": "EMAIL"|"CALL"|"LINKEDIN"|"SMS", "subject": "...", "template": "...", "rationale": "..."}
  ],
  "kpis": ["..."],
  "expectedReplyRate": "..."
}`;

    const prompt = JSON.stringify({
      filter: { industry, status, scoreMin, scoreMax },
      sample: sample.slice(0, 12),
    });

    const playbook: any = await runAI(auth, prompt, {
      feature: 'playbook',
      systemPrompt,
      json: true,
      temperature: 0.3,
      maxTokens: 2048,
      inputPayload: { filter: { industry, status, scoreMin, scoreMax }, sampleCount: sample.length },
    });

    return NextResponse.json({ playbook, sampleSize: sample.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
