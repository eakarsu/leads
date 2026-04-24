import { NextRequest, NextResponse } from 'next/server';
import { callOpenRouter, isOpenRouterConfigured } from '@/lib/openRouterClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isOpenRouterConfigured()) {
      return NextResponse.json(
        { error: 'OpenRouter API is not configured. Please set OPENROUTER_API_KEY in .env' },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    // Fetch lead with related data
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        campaign: {
          include: {
            client: true,
          },
        },
        activities: {
          orderBy: { timestamp: 'desc' },
          take: 5,
        },
        enrichmentData: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const systemPrompt = `You are an expert B2B sales qualification specialist. Your role is to analyze lead data and provide qualification scores, fit assessments, and next best actions. Be objective, data-driven, and practical in your assessments.`;

    const enrichmentInfo = lead.enrichmentData.length > 0
      ? `Company Size: ${lead.enrichmentData[0].companySize || 'Unknown'}
Industry: ${lead.enrichmentData[0].industry || 'Unknown'}
Tech Stack: ${lead.enrichmentData[0].techStack || 'Unknown'}
Location: ${lead.enrichmentData[0].location || 'Unknown'}`
      : 'No enrichment data available';

    const activitySummary = lead.activities.length > 0
      ? lead.activities.map((a, i) => `${i + 1}. ${a.type} - ${a.content.substring(0, 100)}...`).join('\n')
      : 'No activities recorded yet';

    const campaignContext = lead.campaign
      ? `CAMPAIGN CONTEXT:
Campaign: ${lead.campaign.name}
Client Industry: ${lead.campaign.client.industry}
Target Persona: ${lead.campaign.targetPersona || 'Not specified'}
Channel: ${lead.campaign.channel}
`
      : 'CAMPAIGN CONTEXT:\nNo campaign assigned yet\n';

    const userPrompt = `Analyze this lead and provide a qualification assessment:

LEAD INFORMATION:
Name: ${lead.fullName}
Title: ${lead.title || 'Not provided'}
Company: ${lead.company || 'Not provided'}
Email: ${lead.email || 'Not provided'}
Phone: ${lead.phone || 'Not provided'}
LinkedIn: ${lead.linkedinUrl || 'Not provided'}
Current Status: ${lead.status}
Source: ${lead.source || 'Unknown'}

${campaignContext}
ENRICHMENT DATA:
${enrichmentInfo}

RECENT ACTIVITIES:
${activitySummary}

NOTES:
${lead.notes || 'No additional notes'}

Based on this information, provide:

1. QUALIFICATION SCORE (0-100): A numerical score indicating how well this lead fits the ideal customer profile

2. FIT SUMMARY (2-3 sentences): Explain why this score was assigned, highlighting key positive and negative factors

3. NEXT BEST ACTION: A specific, actionable recommendation for what the sales team should do next with this lead

Format your response as JSON with the following structure:
{
  "qualificationScore": <number 0-100>,
  "fitSummary": "<string>",
  "nextBestAction": "<string>"
}`;

    const aiResponse = await callOpenRouter({
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      maxTokens: 1000,
    });

    // Parse JSON response
    let parsedResponse;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || aiResponse.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse;
      parsedResponse = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      throw new Error('AI returned invalid JSON response for lead qualification');
    }

    return NextResponse.json({
      ...parsedResponse,
      success: true,
    });
  } catch (error: any) {
    console.error('Error qualifying lead:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to qualify lead' },
      { status: 500 }
    );
  }
}
