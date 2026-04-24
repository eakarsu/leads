import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { callOpenRouter } from '@/lib/openrouter';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { audienceType, timezone, campaignType, historicalData } = body;

    const prompt = `Analyze and recommend optimal email send times for:
- Audience: ${audienceType || 'General'}
- Timezone: ${timezone || 'America/New_York'}
- Campaign Type: ${campaignType || 'Marketing'}
- Historical Data: ${JSON.stringify(historicalData || {})}

Respond with ONLY a JSON object:
{
  "bestTimes": [{"day": "Tuesday", "time": "10:00 AM", "score": 95}],
  "reasoning": "explanation",
  "avoidTimes": [{"day": "Monday", "time": "8:00 AM", "reason": "Low engagement"}]
}`;

    const response = await callOpenRouter(prompt, 'You are an email marketing optimization AI. Always respond with valid JSON only.');
    let parsed;
    try {
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = { bestTimes: [{ day: 'Tuesday', time: '10:00 AM', score: 90 }], reasoning: response, avoidTimes: [] };
    }
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Error optimizing send time:', error);
    return NextResponse.json({ error: 'Failed to optimize send time' }, { status: 500 });
  }
}
