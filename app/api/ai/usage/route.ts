import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/ai/usage
 * Aggregate AIResult usage by feature × model for the last N days.
 * Query: days (default 30, max 365)
 */
export async function GET(req: NextRequest) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const days = Math.min(365, Math.max(1, parseInt(url.searchParams.get('days') || '30', 10)));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Pull rows in window — DB-side groupBy avoids loading them all.
  const rows = await prisma.aIResult.groupBy({
    by: ['feature', 'model', 'status'],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
    _sum: { tokensUsed: true, durationMs: true },
  });

  const byFeature: Record<string, { feature: string; calls: number; successCalls: number; errorCalls: number; tokens: number; durationMs: number; models: Record<string, number> }> = {};
  let totalCalls = 0;
  let totalTokens = 0;
  let totalDuration = 0;
  let totalErrors = 0;

  for (const r of rows) {
    const feature = r.feature || 'unknown';
    const model = r.model || 'unknown';
    if (!byFeature[feature]) {
      byFeature[feature] = { feature, calls: 0, successCalls: 0, errorCalls: 0, tokens: 0, durationMs: 0, models: {} };
    }
    const f = byFeature[feature];
    f.calls += r._count._all;
    if (r.status === 'success') f.successCalls += r._count._all;
    else f.errorCalls += r._count._all;
    f.tokens += r._sum.tokensUsed || 0;
    f.durationMs += r._sum.durationMs || 0;
    f.models[model] = (f.models[model] || 0) + r._count._all;
    totalCalls += r._count._all;
    if (r.status !== 'success') totalErrors += r._count._all;
    totalTokens += r._sum.tokensUsed || 0;
    totalDuration += r._sum.durationMs || 0;
  }

  // top users in window
  const topUsers = await prisma.aIResult.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
    _sum: { tokensUsed: true },
    orderBy: { _count: { userId: 'desc' } },
    take: 10,
  });

  const features = Object.values(byFeature).sort((a, b) => b.calls - a.calls);

  return NextResponse.json({
    windowDays: days,
    since: since.toISOString(),
    totals: {
      calls: totalCalls,
      successCalls: totalCalls - totalErrors,
      errorCalls: totalErrors,
      tokens: totalTokens,
      avgDurationMs: totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0,
    },
    features,
    topUsers: topUsers.map(u => ({ userId: u.userId, calls: u._count._all, tokens: u._sum.tokensUsed || 0 })),
  });
}
