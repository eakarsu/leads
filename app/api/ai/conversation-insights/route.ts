import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { callOpenRouter } from '@/lib/openrouter';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transcript } = await request.json();

    if (!transcript || transcript.trim().length < 10) {
      return NextResponse.json({ error: 'Transcript too short' }, { status: 400 });
    }

    // Generate AI insights from conversation
    const prompt = `Analyze this sales call/meeting transcript and extract key insights:

${transcript}

Provide:
1. sentiment (POSITIVE/NEUTRAL/NEGATIVE)
2. keyTopics (array of 3-5 main topics discussed)
3. actionItems (array of 2-4 action items)
4. nextSteps (array of 1-3 recommended next steps)
5. dealScore (0-100 confidence in deal progression)
6. summary (2-3 sentence summary)

Respond with ONLY a JSON object in this format:
{
  "sentiment": "POSITIVE",
  "keyTopics": ["pricing", "timeline", "requirements"],
  "actionItems": ["Send proposal by Friday", "Schedule demo"],
  "nextSteps": ["Follow up call next week"],
  "dealScore": 75,
  "summary": "Productive call discussing requirements..."
}`;

    const systemPrompt = 'You are a conversation analysis AI for sales calls. Extract insights and action items. Always respond with valid JSON only.';

    const response = await callOpenRouter(prompt, systemPrompt);

    // Clean and parse response
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }

    const insights = JSON.parse(jsonStr);

    return NextResponse.json(insights);
  } catch (error: any) {
    console.error('Error generating conversation insights:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
