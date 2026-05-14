import { NextRequest, NextResponse } from 'next/server';
import { authForAI, runAI } from '@/lib/aiHelpers';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/ai/field-lineage
 * Field-level lineage + AI explain. Given { objectType, objectId, field },
 * returns the FieldHistory + an LLM-written narrative grounded on related
 * activities (Tasks, Emails, CallLogs, Events) within +/-7 days of each change.
 */
export async function POST(req: NextRequest) {
  const auth = await authForAI();
  if (auth instanceof Response) return auth;

  try {
    const { objectType, objectId, field } = await req.json();
    if (!objectType || !objectId || !field) {
      return NextResponse.json(
        { error: 'objectType, objectId, field are required' },
        { status: 400 }
      );
    }

    const history = await prisma.fieldHistory.findMany({
      where: { objectType, objectId, fieldName: field },
      orderBy: { changedAt: 'desc' },
      take: 50,
    });

    if (history.length === 0) {
      return NextResponse.json({ history: [], narrative: 'No history for this field.' });
    }

    // For the most recent change, fetch surrounding activities (best-effort)
    const latest = history[0];
    const windowStart = new Date(latest.changedAt.getTime() - 7 * 24 * 60 * 60 * 1000);
    const windowEnd = new Date(latest.changedAt.getTime() + 7 * 24 * 60 * 60 * 1000);

    let activities: any[] = [];
    try {
      activities = await (prisma as any).event.findMany({
        where: {
          relatedToType: objectType,
          relatedToId: objectId,
          createdAt: { gte: windowStart, lte: windowEnd },
        },
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      /* model may not exist */
    }

    const systemPrompt = `You are a CRM field-lineage analyst. Given a field's change history
and surrounding activities, write a concise narrative explaining the most recent change.
Return ONLY JSON: { "narrative": "1-3 sentences", "evidence": ["...", "..."] }`;

    const prompt = JSON.stringify({
      object: { type: objectType, id: objectId, field },
      history: history.map((h) => ({
        from: h.oldValue,
        to: h.newValue,
        at: h.changedAt,
        by: h.changedBy,
      })),
      surroundingActivities: activities,
    });

    const explanation: any = await runAI(auth, prompt, {
      feature: 'field-lineage',
      objectType,
      objectId,
      systemPrompt,
      json: true,
      temperature: 0.2,
      maxTokens: 768,
      inputPayload: { field, historyCount: history.length, activityCount: activities.length },
    });

    return NextResponse.json({ history, activities, ...explanation });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
