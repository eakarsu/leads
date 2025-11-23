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
    const { industry, icp, offer, channels, geo, tone } = body;

    if (!industry || !icp) {
      return NextResponse.json(
        { error: 'Industry and ICP (Ideal Customer Profile) are required' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert lead generation campaign strategist. Your role is to create comprehensive, actionable campaign briefs for B2B lead generation agencies. Focus on practical, data-driven recommendations that can be implemented immediately.`;

    const userPrompt = `Create a comprehensive campaign brief for a lead generation campaign with the following parameters:

Industry: ${industry}
Ideal Customer Profile (ICP): ${icp}
Offer/Value Proposition: ${offer || 'Not specified'}
Channel Mix: ${channels || 'Multi-channel'}
Geographic Target: ${geo || 'Not specified'}
Tone/Voice: ${tone || 'Professional'}

You must respond with a valid JSON object in this exact format:
{
  "icpSummary": "A refined 2-3 paragraph description of the ideal customer profile including firmographics, key decision-makers, and buying triggers",
  "messagingAngles": [
    "First messaging angle with business pain point and value articulation",
    "Second messaging angle with proof points",
    "Third messaging angle",
    "Fourth messaging angle (optional)",
    "Fifth messaging angle (optional)"
  ],
  "valueProps": [
    "Value proposition for C-suite executives",
    "Value proposition for VP-level decision makers",
    "Value proposition for Manager-level influencers"
  ],
  "suggestedSegments": [
    "First segment criteria and approach",
    "Second segment criteria and approach",
    "Third segment criteria and approach"
  ],
  "channelRecommendations": "2-3 paragraph explanation of which channels to prioritize (email, LinkedIn, cold calling, etc.) and specific tactics for each",
  "timingCadence": "1-2 paragraph recommendation for outreach cadence, frequency, and best times to engage"
}

Provide specific, actionable recommendations that a campaign specialist can implement immediately.

IMPORTANT: Return ONLY valid JSON, no markdown formatting, no code blocks, no extra text.`;

    const aiResponse = await callOpenRouter({
      systemPrompt,
      userPrompt,
      temperature: 0.8,
      maxTokens: 3000,
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
    console.error('Error generating campaign brief:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate campaign brief' },
      { status: 500 }
    );
  }
}
