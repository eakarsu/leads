import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { callOpenRouter } from '@/lib/openrouter';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Fetch account data with relationships
    const account = await prisma.clientCompany.findUnique({
      where: { id },
      include: {
        contacts: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        opportunities: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        leads: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Calculate account metrics
    const totalOpportunityValue = account.opportunities.reduce((sum, o) => sum + o.amount, 0);
    const wonOpportunities = account.opportunities.filter(o => o.stage === 'CLOSED_WON');
    const wonValue = wonOpportunities.reduce((sum, o) => sum + o.amount, 0);
    const lostOpportunities = account.opportunities.filter(o => o.stage === 'CLOSED_LOST');

    // Generate AI insights
    const prompt = `Analyze this client account and generate actionable insights:

Account: ${account.name}
Industry: ${account.industry || 'Unknown'}
Business Sector: ${account.businessSector || 'Unknown'}

Metrics:
- Total Contacts: ${account.contacts.length}
- Total Leads: ${account.leads.length}
- Total Opportunities: ${account.opportunities.length}
- Pipeline Value: $${totalOpportunityValue.toLocaleString()}
- Won Deals: ${wonOpportunities.length} ($${wonValue.toLocaleString()})
- Lost Deals: ${lostOpportunities.length}

Recent Opportunities:
${account.opportunities.slice(0, 5).map(o => `- ${o.name}: $${o.amount} (${o.stage})`).join('\n')}

Generate insights about account health, expansion opportunities, and risks. Respond with ONLY a JSON object:
{
  "healthScore": <number 0-100>,
  "healthStatus": "<HEALTHY|AT_RISK|CHURNED>",
  "insights": [
    {
      "type": "<expansion|risk|engagement|renewal>",
      "title": "<short title>",
      "description": "<detailed insight>",
      "priority": "<HIGH|MEDIUM|LOW>",
      "recommendations": ["<action 1>", "<action 2>"]
    }
  ],
  "expansionOpportunities": ["<opportunity 1>", "<opportunity 2>"],
  "riskFactors": ["<risk 1>", "<risk 2>"]
}`;

    const systemPrompt = 'You are an AI account management analyst. Generate insights about account health and opportunities. Always respond with valid JSON only. IMPORTANT: Use only standard ASCII double quotes (") in your JSON response, never use smart quotes or curly quotes.';

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
    console.error('Error generating account insights:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
