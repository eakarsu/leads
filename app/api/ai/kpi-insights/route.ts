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
    const { funnelMetrics, campaigns } = body;

    if (!funnelMetrics) {
      return NextResponse.json({ error: 'Funnel metrics are required' }, { status: 400 });
    }

    const systemPrompt = `You are an expert marketing analytics consultant specializing in lead generation optimization. You analyze funnel metrics, identify bottlenecks, spot opportunities, and provide actionable recommendations based on data patterns.`;

    const userPrompt = `Analyze the following lead generation funnel metrics and provide insights:

AGGREGATED FUNNEL METRICS:
${JSON.stringify(funnelMetrics, null, 2)}

${campaigns ? `CAMPAIGN BREAKDOWN:\n${JSON.stringify(campaigns, null, 2)}\n` : ''}

Provide:

1. KEY INSIGHTS: 2-3 most important observations from the data (what's working well, what needs attention)

2. OPTIMIZATION OPPORTUNITIES: 3-4 specific, actionable recommendations to improve performance. Focus on:
   - Where to focus optimization efforts (which funnel stage)
   - Specific tactics to test (e.g., subject line variations, audience refinement, timing changes)
   - Channel allocation recommendations

3. BENCHMARKING: How do these metrics compare to typical B2B lead generation benchmarks?

4. PREDICTED IMPACT: For each recommendation, estimate potential impact if implemented

Format as JSON:
{
  "keyInsights": ["<string>", "<string>", ...],
  "optimizationOpportunities": [
    {
      "recommendation": "<string>",
      "expectedImpact": "<string>",
      "priority": "High|Medium|Low"
    },
    ...
  ],
  "benchmarkComparison": "<string>",
  "summary": "<1-2 sentence executive summary>"
}`;

    const aiResponse = await callOpenRouter({
      systemPrompt,
      userPrompt,
      temperature: 0.6,
      maxTokens: 2000,
    });

    // Parse JSON response
    let parsedResponse;
    try {
      const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || aiResponse.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse;
      parsedResponse = JSON.parse(jsonStr);
    } catch (parseError) {
      console.warn('Failed to parse AI response as JSON:', parseError);
      parsedResponse = {
        keyInsights: ['Analysis available in raw format'],
        optimizationOpportunities: [],
        benchmarkComparison: aiResponse.substring(0, 300),
        summary: 'See full analysis for details',
        rawResponse: aiResponse,
      };
    }

    return NextResponse.json({
      ...parsedResponse,
      success: true,
    });
  } catch (error: any) {
    console.error('Error generating KPI insights:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate KPI insights' },
      { status: 500 }
    );
  }
}
