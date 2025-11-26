import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { callOpenRouter } from '@/lib/openrouter';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await request.json();

    // Get context about user's CRM data
    const [leadsCount, opportunitiesCount, clientsCount] = await Promise.all([
      prisma.lead.count(),
      prisma.opportunity.count(),
      prisma.clientCompany.count(),
    ]);

    const systemPrompt = `You are Einstein, an AI assistant for a CRM system. You help users with their sales data.

Current CRM Stats:
- Total Leads: ${leadsCount}
- Total Opportunities: ${opportunitiesCount}
- Total Clients: ${clientsCount}

You can help with:
- Answering questions about CRM data
- Providing sales insights
- Suggesting next actions
- Explaining CRM features

Be helpful, concise, and professional.`;

    const response = await callOpenRouter(message, systemPrompt);

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('Error in chat:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
