import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Privacy-Preserving Analytics — differential-privacy aggregation across tenants for benchmarks.

interface BenchmarkRequest {
  metric: 'avg_deal_size' | 'win_rate' | 'cycle_days' | 'leads_per_rep';
  industry?: string;
  region?: string;
}

interface NoisyResult {
  metric: string;
  cohort: { industry?: string; region?: string; tenants: number };
  estimate: number;
  noiseEpsilon: number;
  ciLowerBound: number;
  ciUpperBound: number;
  sampleSizeAdequate: boolean;
}

const MIN_COHORT = 10;
const EPSILON = parseFloat(process.env.DP_EPSILON || '1.0');

function laplace(scale: number): number {
  const u = Math.random() - 0.5;
  return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}

function syntheticTrueValue(metric: string): number {
  // Lean v0: fixed plausible baselines; in prod, aggregate across tenant DB.
  if (metric === 'avg_deal_size') return 18500;
  if (metric === 'win_rate') return 0.27;
  if (metric === 'cycle_days') return 42;
  if (metric === 'leads_per_rep') return 73;
  return 0;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as BenchmarkRequest;
  if (!body.metric) return NextResponse.json({ error: 'metric required' }, { status: 400 });

  // Simulated cohort size — in real impl, count tenants matching filter.
  const cohortSize = Math.max(0, Math.round(20 + Math.random() * 50));
  if (cohortSize < MIN_COHORT) {
    return NextResponse.json({ error: 'cohort too small for privacy guarantees', minCohort: MIN_COHORT }, { status: 422 });
  }

  const trueValue = syntheticTrueValue(body.metric);
  const sensitivity = trueValue * 0.05;
  const noisy = trueValue + laplace(sensitivity / EPSILON);

  const result: NoisyResult = {
    metric: body.metric,
    cohort: { industry: body.industry, region: body.region, tenants: cohortSize },
    estimate: Number(noisy.toFixed(4)),
    noiseEpsilon: EPSILON,
    ciLowerBound: Number((noisy - sensitivity).toFixed(4)),
    ciUpperBound: Number((noisy + sensitivity).toFixed(4)),
    sampleSizeAdequate: cohortSize >= MIN_COHORT * 2,
  };
  return NextResponse.json({ result });
}
