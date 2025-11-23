import { NextRequest, NextResponse } from 'next/server';
import { callOpenRouter, isOpenRouterConfigured } from '@/lib/openRouterClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
    const { metrics, campaignName, clientName, periodStart, periodEnd } = body;

    if (!metrics) {
      return NextResponse.json({ error: 'Metrics are required' }, { status: 400 });
    }

    const systemPrompt = `You are an expert lead generation analyst and client-facing report writer. Your role is to transform raw campaign metrics into compelling, actionable narratives for clients. Focus on insights, context, and recommendations rather than just restating numbers.`;

    const userPrompt = `Create a client-facing executive summary for the following campaign performance:

CAMPAIGN: ${campaignName || 'Campaign'}
CLIENT: ${clientName || 'Client'}
PERIOD: ${periodStart || 'Start'} to ${periodEnd || 'End'}

METRICS:
${JSON.stringify(metrics, null, 2)}

You must respond with a valid JSON object in this exact format:
{
  "performanceOverview": "2-3 sentence high-level summary of campaign performance, highlighting the most important metrics and achievements",
  "keyWins": ["win 1", "win 2", "win 3"],
  "insights": "2-3 paragraph insights about what the data tells us about the campaign, audience, or messaging",
  "opportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3", "recommendation 4", "recommendation 5"]
}

KEY WINS should be 2-4 specific successes with context for why they matter.
OPPORTUNITIES should be constructive improvement areas (2-4 items).
RECOMMENDATIONS should be 3-5 specific, actionable next steps.

Write in a professional, consultative tone. Use industry benchmarks where relevant (e.g., "The 40% open rate exceeds the industry average of 25%"). Focus on storytelling with data, not just reporting numbers.

IMPORTANT: Return ONLY valid JSON, no markdown formatting, no code blocks, no extra text.`;

    const aiResponse = await callOpenRouter({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      maxTokens: 2000,
    });

    // Parse the JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      // If AI didn't return valid JSON, try to extract it
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('AI response was not valid JSON');
      }
    }

    return NextResponse.json(parsedResponse);
  } catch (error: any) {
    console.error('Error generating report summary:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate report summary' },
      { status: 500 }
    );
  }
}
