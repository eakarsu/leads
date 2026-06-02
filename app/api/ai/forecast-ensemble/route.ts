import { NextRequest, NextResponse } from 'next/server';
import { authForAI, runAI } from '@/lib/aiHelpers';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/ai/forecast-ensemble
 * Runs the forecast prompt N times with temperature variation, then computes
 * mean + standard deviation per period to produce a confidence band.
 *
 * Body: { runs?: number (default 3, max 5), period?: "month" | "quarter" }
 */
export async function POST(req: NextRequest) {
  const auth = await authForAI();
  if (auth instanceof Response) return auth;

  try {
    const { runs: runsRaw = 3, period = 'month' } = await req.json().catch(() => ({}));
    const runs = Math.min(5, Math.max(2, Number(runsRaw)));

    const opps = await prisma.opportunity.findMany({
      where: { stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } },
      take: 200,
      select: { name: true, stage: true, amount: true, probability: true, expectedCloseDate: true },
    });

    const totalPipeline = opps.reduce((s, o) => s + Number(o.amount ?? 0), 0);

    const systemPrompt = `You are a forecasting analyst. Given the pipeline, produce
a 6-${period} forecast. Return ONLY JSON: { "${period}ly": [{"label":"YYYY-MM" or "QX YYYY", "predicted": <number>}] }`;

    const promises: Promise<any>[] = [];
    for (let i = 0; i < runs; i++) {
      promises.push(
        runAI(auth, JSON.stringify({ totalPipeline, opportunityCount: opps.length, opps: opps.slice(0, 30) }), {
          feature: 'forecast-ensemble',
          systemPrompt,
          json: true,
          temperature: 0.4 + i * 0.15,
          maxTokens: 1024,
          inputPayload: { run: i, runs, totalPipeline },
        }).catch((e) => ({ __error: e.message }))
      );
    }
    const results = await Promise.all(promises);
    const successful = results.filter((r) => !r.__error);

    // Aggregate by label
    const byLabel: Record<string, number[]> = {};
    for (const r of successful) {
      const arr = (r as any)[`${period}ly`] || [];
      for (const row of arr) {
        const label = String(row.label || row.month || row.quarter || row.period || '').trim();
        if (!label) continue;
        if (!byLabel[label]) byLabel[label] = [];
        byLabel[label].push(Number(row.predicted) || 0);
      }
    }

    const ensemble = Object.entries(byLabel).map(([label, vals]) => {
      const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
      const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
      const sd = Math.sqrt(variance);
      return {
        label,
        mean: Math.round(mean),
        low: Math.max(0, Math.round(mean - 1.96 * sd)),
        high: Math.round(mean + 1.96 * sd),
        sd: Math.round(sd),
        sampleCount: vals.length,
      };
    });

    return NextResponse.json({
      ensemble,
      runs,
      successful: successful.length,
      failed: results.length - successful.length,
      raw: results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
