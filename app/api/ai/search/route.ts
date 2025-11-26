import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { callOpenRouter } from '@/lib/openrouter';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = await request.json();

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: 'Query too short' }, { status: 400 });
    }

    // Search across all CRM entities
    const [leads, opportunities, clients, contacts] = await Promise.all([
      prisma.lead.findMany({
        where: {
          OR: [
            { fullName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { company: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 10,
        include: { campaign: true },
      }),
      prisma.opportunity.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 10,
        include: { client: true },
      }),
      prisma.clientCompany.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { industry: { contains: query, mode: 'insensitive' } },
            { website: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 10,
      }),
      prisma.contact.findMany({
        where: {
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { title: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 10,
        include: { client: true },
      }),
    ]);

    // Format results for AI analysis
    const resultsContext = `
Leads found (${leads.length}): ${leads.map(l => `${l.fullName} - ${l.company || 'No company'} - ${l.status}`).join(', ')}
Opportunities found (${opportunities.length}): ${opportunities.map(o => `${o.name} - $${o.amount} - ${o.stage}`).join(', ')}
Clients found (${clients.length}): ${clients.map(c => `${c.name} - ${c.industry || 'Unknown industry'}`).join(', ')}
Contacts found (${contacts.length}): ${contacts.map(c => `${c.firstName} ${c.lastName} - ${c.title || 'No title'}`).join(', ')}
    `;

    // Get AI insights about the search results
    const prompt = `User searched for: "${query}"

Search results:
${resultsContext}

Provide a brief insight about what was found (2-3 sentences) and suggest 1-2 relevant next actions.

Respond with ONLY a JSON object:
{
  "insight": "Found 5 leads and 3 opportunities related to...",
  "suggestions": ["Contact John Doe about the pending proposal", "Review high-value opportunities"]
}`;

    const systemPrompt = 'You are a CRM search assistant. Provide insights about search results. Always respond with valid JSON only.';

    const aiResponse = await callOpenRouter(prompt, systemPrompt);

    // Clean and parse response
    let jsonStr = aiResponse.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }

    const aiInsights = JSON.parse(jsonStr);

    return NextResponse.json({
      results: {
        leads: leads.map(l => ({ ...l, type: 'Lead' })),
        opportunities: opportunities.map(o => ({ ...o, type: 'Opportunity' })),
        clients: clients.map(c => ({ ...c, type: 'Client' })),
        contacts: contacts.map(c => ({ ...c, type: 'Contact' })),
      },
      totalResults: leads.length + opportunities.length + clients.length + contacts.length,
      aiInsights,
    });
  } catch (error: any) {
    console.error('Error in Einstein Search:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
