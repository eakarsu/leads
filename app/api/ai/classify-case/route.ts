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

    const { subject, description } = await request.json();

    if (!subject || subject.trim().length < 3) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }

    const prompt = `Analyze this support case and classify it:

Subject: ${subject}
Description: ${description || 'No description provided'}

Classify this case and provide:
1. category (Technical Issue, Billing Question, Feature Request, Account Issue, Bug Report, or General Inquiry)
2. priority (HIGH, MEDIUM, LOW)
3. sentiment (POSITIVE, NEUTRAL, NEGATIVE)
4. suggestedAssignee (Support, Engineering, Sales, Billing)
5. estimatedResolutionTime (e.g., "2-4 hours", "1-2 days")
6. tags (array of 2-4 relevant tags)

Respond with ONLY a JSON object:
{
  "category": "Technical Issue",
  "priority": "HIGH",
  "sentiment": "NEGATIVE",
  "suggestedAssignee": "Engineering",
  "estimatedResolutionTime": "1-2 days",
  "tags": ["login", "authentication", "urgent"]
}`;

    const systemPrompt = 'You are a support case classification AI. Categorize support tickets accurately. Always respond with valid JSON only.';

    const response = await callOpenRouter(prompt, systemPrompt);

    let jsonStr = response.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }

    const classification = JSON.parse(jsonStr);

    return NextResponse.json(classification);
  } catch (error: any) {
    console.error('Error classifying case:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
