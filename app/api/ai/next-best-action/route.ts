import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { callOpenRouter } from '@/lib/openrouter';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's recent activities
    const recentLeads = await prisma.lead.findMany({
      where: { status: { in: ['NEW', 'CONTACTED'] } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { campaign: true, client: true },
    });

    const recentOpportunities = await prisma.opportunity.findMany({
      where: {
        stage: { in: ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL'] },
        ownerId: session.user.id,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { client: true, contact: true },
    });

    const overdueTasks = await prisma.task.findMany({
      where: {
        assignedTo: session.user.id,
        status: { not: 'COMPLETED' },
        dueDate: { lt: new Date() },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    });

    const upcomingEvents = await prisma.event.findMany({
      where: {
        ownerId: session.user.id,
        startTime: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
        },
      },
      orderBy: { startTime: 'asc' },
      take: 5,
    });

    // Generate AI recommendations
    const prompt = `Analyze this sales representative's current workload and generate 3-5 prioritized "Next Best Action" recommendations:

Recent Leads (${recentLeads.length}):
${recentLeads.map(l => `- ${l.fullName} (${l.status}) from ${l.company || 'Unknown'}`).join('\n')}

Active Opportunities (${recentOpportunities.length}):
${recentOpportunities.map(o => `- ${o.name} ($${o.amount}) at stage ${o.stage}`).join('\n')}

Overdue Tasks (${overdueTasks.length}):
${overdueTasks.map(t => `- ${t.subject} (due ${t.dueDate})`).join('\n')}

Upcoming Events (${upcomingEvents.length}):
${upcomingEvents.map(e => `- ${e.subject} (${e.startTime})`).join('\n')}

Generate actionable recommendations. Respond with ONLY a JSON object in this format:
{
  "actions": [
    {
      "priority": "<HIGH|MEDIUM|LOW>",
      "action": "<short action title>",
      "description": "<detailed description>",
      "estimatedImpact": "<revenue impact or conversion likelihood>",
      "objectType": "<Lead|Opportunity|Task|Event|Account>",
      "objectId": "<id if applicable>",
      "dueBy": "<suggested completion time>"
    }
  ]
}`;

    const systemPrompt = 'You are an AI sales productivity assistant. Generate prioritized action recommendations to help sales reps focus on the most impactful activities. Always respond with valid JSON only. IMPORTANT: Use only standard ASCII double quotes (") in your JSON response, never use smart quotes or curly quotes.';

    const response = await callOpenRouter(prompt, systemPrompt);

    // Clean response
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }

    // Replace smart quotes
    jsonStr = jsonStr
      .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
      .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/[\u2026]/g, '...')
      .replace(/"/g, '"')
      .replace(/"/g, '"')
      .replace(/'/g, "'")
      .replace(/'/g, "'");

    const parsed = JSON.parse(jsonStr);

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('Error generating next best actions:', error);
    return NextResponse.json({
      actions: [
        {
          priority: 'HIGH',
          action: 'Review Overdue Tasks',
          description: 'You have overdue tasks that need attention.',
          estimatedImpact: 'High',
          objectType: 'Task',
          objectId: null,
          dueBy: 'Today',
        },
      ],
    });
  }
}
