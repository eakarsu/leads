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

    const { query, category } = await request.json();

    if (!query || query.trim().length < 3) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const prompt = `A user is searching for help with: "${query}"${category ? ` in the ${category} category` : ''}.

Generate 5 relevant knowledge base article recommendations. For each article, provide:
- title: Clear, helpful article title
- matchScore: Relevance score 0-100
- category: Article category (Getting Started, Troubleshooting, Features, Account Management, Integration, Security)
- summary: Brief 1-sentence description
- estimatedReadTime: Reading time (e.g., "3 min")

Respond with ONLY a JSON object:
{
  "articles": [
    {
      "title": "How to Reset Your Password",
      "matchScore": 95,
      "category": "Account Management",
      "summary": "Step-by-step guide to resetting your account password.",
      "estimatedReadTime": "2 min"
    }
  ]
}`;

    const systemPrompt = 'You are a knowledge base recommendation AI. Suggest relevant help articles. Always respond with valid JSON only.';

    const response = await callOpenRouter(prompt, systemPrompt);

    let jsonStr = response.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }

    const recommendations = JSON.parse(jsonStr);

    return NextResponse.json(recommendations);
  } catch (error: any) {
    console.error('Error recommending articles:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
