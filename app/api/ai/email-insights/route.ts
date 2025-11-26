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

    const body = await request.json();
    const { recipientId, recipientType, context, purpose } = body;

    // Fetch recipient data based on type
    let recipient: any = null;
    let additionalContext = '';

    if (recipientType === 'Lead') {
      recipient = await prisma.lead.findUnique({
        where: { id: recipientId },
        include: { campaign: true, client: true },
      });
      additionalContext = `Lead Status: ${recipient?.status}\nCompany: ${recipient?.company || 'Unknown'}\nTitle: ${recipient?.title || 'Unknown'}`;
    } else if (recipientType === 'Contact') {
      recipient = await prisma.contact.findUnique({
        where: { id: recipientId },
        include: { client: true },
      });
      additionalContext = `Contact at ${recipient?.client?.name || 'Unknown Company'}\nTitle: ${recipient?.title || 'Unknown'}`;
    } else if (recipientType === 'Opportunity') {
      recipient = await prisma.opportunity.findUnique({
        where: { id: recipientId },
        include: { client: true, contact: true },
      });
      additionalContext = `Opportunity: ${recipient?.name}\nStage: ${recipient?.stage}\nValue: $${recipient?.amount}`;
    }

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    // Generate email recommendations
    const prompt = `Generate email recommendations for this sales outreach:

Recipient Type: ${recipientType}
${additionalContext}

Context: ${context || 'First outreach'}
Purpose: ${purpose || 'General follow-up'}

Provide recommendations for:
1. Suggested subject lines (3 options)
2. Key talking points
3. Best send time
4. Tone/approach
5. Call-to-action suggestions

Respond with ONLY a JSON object:
{
  "subjectLines": ["<subject 1>", "<subject 2>", "<subject 3>"],
  "talkingPoints": ["<point 1>", "<point 2>", "<point 3>"],
  "bestSendTime": {
    "dayOfWeek": "<Monday-Friday>",
    "timeOfDay": "<morning|afternoon|evening>",
    "reasoning": "<why this time>"
  },
  "tone": "<professional|casual|consultative>",
  "approach": "<description of recommended approach>",
  "callToAction": ["<CTA option 1>", "<CTA option 2>"],
  "estimatedEngagementRate": "<percentage>"
}`;

    const systemPrompt = 'You are an AI email optimization expert. Generate data-driven email recommendations to maximize engagement. Always respond with valid JSON only. IMPORTANT: Use only standard ASCII double quotes (") in your JSON response, never use smart quotes or curly quotes.';

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
    console.error('Error generating email insights:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
