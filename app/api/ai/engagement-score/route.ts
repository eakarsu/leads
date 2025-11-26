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

    const { emailId, subject, recipientEmail } = await request.json();

    // Generate AI prediction for email engagement
    const prompt = `Analyze this email and predict engagement metrics:

Subject: ${subject}
Recipient: ${recipientEmail}

Based on the subject line and context, predict:
1. Open probability (0-1)
2. Response probability (0-1)
3. Best send time (e.g., "Tuesday 10 AM")
4. Engagement tips (array of 2-3 short suggestions)

Respond with ONLY a JSON object in this format:
{
  "openProbability": 0.75,
  "responseProbability": 0.45,
  "bestSendTime": "Tuesday 10 AM",
  "tips": ["Keep subject under 50 characters", "Add personalization"],
  "reasoning": "Brief explanation of prediction"
}`;

    const systemPrompt = 'You are an email engagement prediction AI. Analyze email subjects and predict engagement. Always respond with valid JSON only.';

    const response = await callOpenRouter(prompt, systemPrompt);

    // Clean and parse response
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }

    const prediction = JSON.parse(jsonStr);

    // Store prediction in database
    const aiPrediction = await prisma.aIPrediction.create({
      data: {
        objectType: 'Email',
        objectId: emailId || 'draft',
        predictionType: 'ENGAGEMENT',
        prediction: {
          openProbability: prediction.openProbability,
          responseProbability: prediction.responseProbability,
          bestSendTime: prediction.bestSendTime,
          tips: prediction.tips,
        },
        confidence: (prediction.openProbability + prediction.responseProbability) / 2,
        reasoning: prediction.reasoning,
      },
    });

    return NextResponse.json({
      ...prediction,
      id: aiPrediction.id,
    });
  } catch (error: any) {
    console.error('Error generating engagement score:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
