import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateAIInsights } from '@/lib/openrouter';
import { enforceAIRateLimit } from '@/lib/aiRateLimiter';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || '20', 10)));

    const where = { dismissed: false };
    const [items, total] = await Promise.all([
      prisma.aIInsight.findMany({
        where,
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.aIInsight.count({ where }),
    ]);

    return NextResponse.json({
      data: items,
      pagination: {
        page,
        pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error: any) {
    console.error('Error fetching insights:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const started = Date.now();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 20/hr per-user AI rate limit
    const limited = await enforceAIRateLimit(session.user.id);
    if (limited) return limited as any;

    // Fetch data for analysis
    const leads = await prisma.lead.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
    });

    const opportunities = await prisma.opportunity.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        client: true,
        owner: true,
      },
    });

    const events = await prisma.event.findMany({
      take: 200,
      orderBy: { createdAt: 'desc' },
    });

    // Generate AI insights
    const aiInsights = await generateAIInsights(leads, opportunities, events);

    // Store insights in database
    const createdInsights: any[] = [];
    for (const insight of aiInsights.insights) {
      const created = await prisma.aIInsight.create({
        data: {
          insightType: insight.type,
          title: insight.title,
          description: insight.description,
          objectType: 'System',
          objectId: 'global',
          priority: insight.priority,
          actionItems: insight.actionItems,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });
      createdInsights.push(created);
    }

    // Persist to ai_results too for unified observability
    try {
      await prisma.aIResult.create({
        data: {
          feature: 'insights',
          userId: session.user.id,
          input: { leadCount: leads.length, oppCount: opportunities.length, eventCount: events.length },
          output: { insights: aiInsights.insights } as any,
          model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
          durationMs: Date.now() - started,
          status: 'success',
        },
      });
    } catch {
      /* non-fatal */
    }

    return NextResponse.json(createdInsights);
  } catch (error: any) {
    console.error('Error generating insights:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
