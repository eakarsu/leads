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
    const { activityType, content } = body;

    if (!content) {
      return NextResponse.json({ error: 'Activity content is required' }, { status: 400 });
    }

    const systemPrompt = `You are an expert at analyzing sales conversations and activities. You extract key insights, identify sentiment, highlight action items, and summarize important details from call notes, email threads, and meeting notes. Be concise and actionable.`;

    const userPrompt = `Analyze the following ${activityType || 'sales'} activity and provide a summary:

ACTIVITY CONTENT:
${content}

Provide:

1. SUMMARY (2-3 sentences): The key points and outcomes of this activity
2. SENTIMENT: Positive, Neutral, or Negative (with brief explanation)
3. KEY INSIGHTS: Important details, pain points mentioned, buying signals, or concerns
4. NEXT STEPS: Recommended follow-up actions

Format as JSON:
{
  "summary": "<string>",
  "sentiment": "<Positive|Neutral|Negative>",
  "sentimentReason": "<string>",
  "keyInsights": ["<string>", "<string>", ...],
  "nextSteps": ["<string>", "<string>", ...]
}`;

    const aiResponse = await callOpenRouter({
      systemPrompt,
      userPrompt,
      temperature: 0.4,
      maxTokens: 1000,
    });

    // Parse JSON response
    let parsedResponse;
    try {
      const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || aiResponse.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse;
      parsedResponse = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      throw new Error('AI returned invalid JSON response for activity summary');
    }

    // Create a simple text summary for storage
    const textSummary = `${parsedResponse.summary}\n\nSentiment: ${parsedResponse.sentiment} - ${parsedResponse.sentimentReason}`;

    return NextResponse.json({
      ...parsedResponse,
      textSummary,
      success: true,
    });
  } catch (error: any) {
    console.error('Error summarizing activity:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to summarize activity' },
      { status: 500 }
    );
  }
}
