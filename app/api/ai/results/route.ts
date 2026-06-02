import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/ai/results
 * Paginated browse of all AIResult rows.
 * Query: page, pageSize, feature, status, objectType, objectId
 */
export async function GET(req: NextRequest) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || '25', 10)));
  const where: any = {};
  for (const k of ['feature', 'status', 'objectType', 'objectId']) {
    const v = url.searchParams.get(k);
    if (v) where[k] = v;
  }

  try {
    const [items, total] = await Promise.all([
      prisma.aIResult.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.aIResult.count({ where }),
    ]);

    return NextResponse.json({
      data: items,
      pagination: {
        page,
        pageSize,
        totalItems: total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        hasNextPage: page * pageSize < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (err: any) {
    if (err?.code === 'P2021' || String(err?.message || '').includes('ai_results')) {
      return NextResponse.json({
        data: [],
        historyUnavailable: true,
        pagination: {
          page,
          pageSize,
          totalItems: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    }

    return NextResponse.json({ error: err.message || 'Failed to fetch AI results' }, { status: 500 });
  }
}
