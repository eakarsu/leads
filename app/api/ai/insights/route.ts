import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateAIInsights } from '@/lib/openrouter';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get existing insights
    const insights = await prisma.aIInsight.findMany({
      where: {
        dismissed: false,
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      take: 20,
    });

    return NextResponse.json(insights);
  } catch (error: any) {
    console.error('Error fetching insights:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    const createdInsights = [];
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

    return NextResponse.json(createdInsights);
  } catch (error: any) {
    console.error('Error generating insights:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
