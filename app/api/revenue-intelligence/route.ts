import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { callAI } from '@/lib/ai-gateway';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [opportunities, revenueForecasts, leads] = await Promise.all([
      prisma.opportunity.findMany({
        include: {
          owner: { select: { id: true, name: true } },
          client: { select: { id: true, name: true, industry: true } },
          lead: { select: { leadSource: true } },
        },
      }),
      prisma.revenueForecast.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
      prisma.lead.findMany({ select: { status: true, qualificationScore: true } }),
    ]);

    // -------------------------------------------------------------------------
    // 1. Pipeline value by stage
    // -------------------------------------------------------------------------
    const stageOrder = [
      'PROSPECTING',
      'QUALIFICATION',
      'NEEDS_ANALYSIS',
      'PROPOSAL',
      'NEGOTIATION',
      'CLOSED_WON',
      'CLOSED_LOST',
    ];

    const pipelineByStage = stageOrder.map((stage) => {
      const inStage = opportunities.filter((o) => o.stage === stage);
      const value = inStage.reduce((s, o) => s + o.amount, 0);
      const weightedValue = inStage.reduce(
        (s, o) => s + (o.amount * o.probability) / 100,
        0
      );
      return { stage, count: inStage.length, value, weightedValue };
    });

    // -------------------------------------------------------------------------
    // 2. Forecast accuracy (predicted vs actual closed)
    // -------------------------------------------------------------------------
    const forecastAccuracy = revenueForecasts
      .filter((f) => f.actualAmount !== null)
      .map((f) => {
        const predicted = f.predictedAmount;
        const actual = f.actualAmount!;
        const accuracy =
          predicted === 0 ? 0 : Math.max(0, 100 - (Math.abs(predicted - actual) / predicted) * 100);
        return {
          period: f.period,
          forecastType: f.forecastType,
          predictedAmount: predicted,
          actualAmount: actual,
          accuracyPercent: Math.round(accuracy * 10) / 10,
        };
      });

    const avgForecastAccuracy =
      forecastAccuracy.length > 0
        ? forecastAccuracy.reduce((s, f) => s + f.accuracyPercent, 0) / forecastAccuracy.length
        : null;

    // -------------------------------------------------------------------------
    // 3. Win rate by industry, company size bucket, and lead source
    // -------------------------------------------------------------------------
    type WinRateBucket = { won: number; lost: number; total: number };
    const closedOpps = opportunities.filter(
      (o) => o.stage === 'CLOSED_WON' || o.stage === 'CLOSED_LOST'
    );

    // By industry
    const byIndustry: Record<string, WinRateBucket> = {};
    closedOpps.forEach((o) => {
      const industry = (o.client?.industry as string) || 'Unknown';
      if (!byIndustry[industry]) byIndustry[industry] = { won: 0, lost: 0, total: 0 };
      byIndustry[industry].total++;
      if (o.stage === 'CLOSED_WON') byIndustry[industry].won++;
      else byIndustry[industry].lost++;
    });

    const winRateByIndustry = Object.entries(byIndustry).map(([industry, counts]) => ({
      industry,
      ...counts,
      winRate: counts.total > 0 ? Math.round((counts.won / counts.total) * 1000) / 10 : 0,
    }));

    // By deal size bucket
    const sizeBuckets: Record<string, WinRateBucket> = {
      '<10k': { won: 0, lost: 0, total: 0 },
      '10k-50k': { won: 0, lost: 0, total: 0 },
      '50k-200k': { won: 0, lost: 0, total: 0 },
      '>200k': { won: 0, lost: 0, total: 0 },
    };
    closedOpps.forEach((o) => {
      let bucket: string;
      if (o.amount < 10000) bucket = '<10k';
      else if (o.amount < 50000) bucket = '10k-50k';
      else if (o.amount < 200000) bucket = '50k-200k';
      else bucket = '>200k';
      sizeBuckets[bucket].total++;
      if (o.stage === 'CLOSED_WON') sizeBuckets[bucket].won++;
      else sizeBuckets[bucket].lost++;
    });
    const winRateByDealSize = Object.entries(sizeBuckets).map(([size, counts]) => ({
      size,
      ...counts,
      winRate: counts.total > 0 ? Math.round((counts.won / counts.total) * 1000) / 10 : 0,
    }));

    // By lead source
    const bySource: Record<string, WinRateBucket> = {};
    closedOpps.forEach((o) => {
      const src = (o.lead?.leadSource as string) || 'DIRECT';
      if (!bySource[src]) bySource[src] = { won: 0, lost: 0, total: 0 };
      bySource[src].total++;
      if (o.stage === 'CLOSED_WON') bySource[src].won++;
      else bySource[src].lost++;
    });
    const winRateBySource = Object.entries(bySource).map(([source, counts]) => ({
      source,
      ...counts,
      winRate: counts.total > 0 ? Math.round((counts.won / counts.total) * 1000) / 10 : 0,
    }));

    // -------------------------------------------------------------------------
    // 4. Summary stats
    // -------------------------------------------------------------------------
    const wonDeals = opportunities.filter((o) => o.stage === 'CLOSED_WON');
    const lostDeals = opportunities.filter((o) => o.stage === 'CLOSED_LOST');
    const openPipeline = opportunities.filter(
      (o) => o.stage !== 'CLOSED_WON' && o.stage !== 'CLOSED_LOST'
    );

    const totalRevenue = wonDeals.reduce((s, o) => s + o.amount, 0);
    const totalPipelineValue = openPipeline.reduce((s, o) => s + o.amount, 0);
    const weightedPipelineValue = openPipeline.reduce(
      (s, o) => s + (o.amount * o.probability) / 100,
      0
    );
    const winRate =
      wonDeals.length + lostDeals.length > 0
        ? (wonDeals.length / (wonDeals.length + lostDeals.length)) * 100
        : 0;

    // Rep performance
    const repMap: Record<
      string,
      { id: string; name: string; won: number; lost: number; pipelineValue: number; revenue: number }
    > = {};
    opportunities.forEach((o) => {
      const repId = o.owner?.id || 'unknown';
      if (!repMap[repId]) {
        repMap[repId] = { id: repId, name: o.owner?.name || 'Unknown', won: 0, lost: 0, pipelineValue: 0, revenue: 0 };
      }
      if (o.stage === 'CLOSED_WON') {
        repMap[repId].won++;
        repMap[repId].revenue += o.amount;
      } else if (o.stage === 'CLOSED_LOST') {
        repMap[repId].lost++;
      } else {
        repMap[repId].pipelineValue += o.amount;
      }
    });

    // -------------------------------------------------------------------------
    // 5. AI narrative — generate and persist
    // -------------------------------------------------------------------------
    const currentQuarter = getQuarter(new Date());
    const narrativePrompt = `You are a revenue intelligence analyst. Write a concise executive summary (3-4 sentences) about the current sales pipeline and forecast.

Data:
- Current quarter: ${currentQuarter}
- Open pipeline: $${Math.round(totalPipelineValue).toLocaleString()} across ${openPipeline.length} deals
- Weighted pipeline (by probability): $${Math.round(weightedPipelineValue).toLocaleString()}
- Overall win rate: ${winRate.toFixed(1)}%
- Total closed-won revenue: $${Math.round(totalRevenue).toLocaleString()} (${wonDeals.length} deals)
- Forecast accuracy (last ${forecastAccuracy.length} periods): ${avgForecastAccuracy !== null ? avgForecastAccuracy.toFixed(1) + '%' : 'N/A (no actuals yet)'}
- Top industry by win rate: ${
      winRateByIndustry.sort((a, b) => b.winRate - a.winRate)[0]?.industry ?? 'N/A'
    } (${winRateByIndustry[0]?.winRate ?? 0}%)

Respond with ONLY a JSON object:
{
  "narrative": "<executive summary>",
  "quarterlyForecast": <number>,
  "confidencePercent": <number 0-100>,
  "keyRisks": ["<risk 1>", "<risk 2>"],
  "recommendations": ["<action 1>", "<action 2>"]
}`;

    let aiNarrative: Record<string, any> = {};
    let persistedForecast = null;

    try {
      const aiRaw = await callAI(narrativePrompt, {
        systemPrompt: 'You are a senior revenue intelligence analyst. Always respond with valid JSON only.',
        maxTokens: 1024,
        temperature: 0.3,
      });
      const jsonStr = aiRaw.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '');
      aiNarrative = JSON.parse(jsonStr);

      // Persist forecast to DB
      const period = currentQuarter;
      persistedForecast = await prisma.revenueForecast.create({
        data: {
          period,
          forecastType: 'quarterly',
          predictedAmount: aiNarrative.quarterlyForecast ?? weightedPipelineValue,
          confidence: (aiNarrative.confidencePercent ?? 60) / 100,
          breakdown: {
            byStage: pipelineByStage,
            byIndustry: winRateByIndustry,
          },
          generatedBy: 'AI',
        },
      });
    } catch (aiErr) {
      console.warn('[revenue-intelligence] AI narrative failed:', aiErr);
      aiNarrative = {
        narrative: `Based on current pipeline of $${Math.round(totalPipelineValue).toLocaleString()}, ${currentQuarter} weighted forecast is $${Math.round(weightedPipelineValue).toLocaleString()} with a ${winRate.toFixed(0)}% historical win rate.`,
        quarterlyForecast: weightedPipelineValue,
        confidencePercent: 60,
        keyRisks: [],
        recommendations: [],
      };
    }

    return NextResponse.json({
      // pipeline
      pipelineByStage,
      // forecast accuracy
      forecastAccuracy,
      avgForecastAccuracy,
      // win rates
      winRateByIndustry,
      winRateByDealSize,
      winRateBySource,
      // summary stats
      stats: {
        winRate: Math.round(winRate * 10) / 10,
        totalRevenue,
        totalPipelineValue,
        weightedPipelineValue,
        avgDealSize: wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0,
        openDeals: openPipeline.length,
        wonDeals: wonDeals.length,
        lostDeals: lostDeals.length,
      },
      repPerformance: Object.values(repMap),
      // AI narrative
      aiIntelligence: aiNarrative,
      persistedForecastId: persistedForecast?.id ?? null,
    });
  } catch (error: any) {
    console.error('Error fetching revenue intelligence:', error);
    return NextResponse.json({ error: 'Failed to fetch revenue intelligence' }, { status: 500 });
  }
}

function getQuarter(date: Date): string {
  const q = Math.floor(date.getMonth() / 3) + 1;
  return `${date.getFullYear()}-Q${q}`;
}
