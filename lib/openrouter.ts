const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku';

export async function callOpenRouter(prompt: string, systemPrompt?: string) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function predictLeadScore(lead: any): Promise<{ score: number; confidence: number; reasoning: string }> {
  const prompt = `Analyze this lead and predict the conversion probability (0-100):

Lead Details:
- Name: ${lead.fullName}
- Title: ${lead.title || 'N/A'}
- Company: ${lead.company || 'N/A'}
- Email: ${lead.email}
- Phone: ${lead.phone || 'N/A'}
- Lead Source: ${lead.leadSource}
- Status: ${lead.status}
- Industry: ${lead.industry || 'N/A'}
- Annual Revenue: ${lead.annualRevenue || 'N/A'}
- Number of Employees: ${lead.numberOfEmployees || 'N/A'}

Respond with ONLY a JSON object in this format:
{
  "score": <number 0-100>,
  "confidence": <number 0-1>,
  "reasoning": "<brief explanation>"
}`;

  const systemPrompt = 'You are an AI sales analyst. Analyze leads and predict conversion probability based on lead quality indicators. Always respond with valid JSON only.';

  const response = await callOpenRouter(prompt, systemPrompt);

  try {
    const parsed = JSON.parse(response);
    return {
      score: Math.min(100, Math.max(0, parsed.score)),
      confidence: Math.min(1, Math.max(0, parsed.confidence)),
      reasoning: parsed.reasoning,
    };
  } catch (error) {
    // Fallback if JSON parsing fails
    return {
      score: 50,
      confidence: 0.5,
      reasoning: 'Unable to parse AI response',
    };
  }
}

export async function predictOpportunityClose(opportunity: any): Promise<{
  predictedCloseDate: string;
  predictedAmount: number;
  winProbability: number;
  confidence: number;
  reasoning: string;
}> {
  const prompt = `Analyze this sales opportunity and predict the close date, final amount, and win probability:

Opportunity Details:
- Name: ${opportunity.name}
- Stage: ${opportunity.stage}
- Amount: $${opportunity.amount}
- Probability: ${opportunity.probability}%
- Expected Close Date: ${opportunity.expectedCloseDate || 'Not set'}
- Client: ${opportunity.client?.name || 'N/A'}
- Owner: ${opportunity.owner?.name || 'N/A'}
- Description: ${opportunity.description || 'N/A'}
- Next Steps: ${opportunity.nextSteps || 'N/A'}

Respond with ONLY a JSON object in this format:
{
  "predictedCloseDate": "<YYYY-MM-DD>",
  "predictedAmount": <number>,
  "winProbability": <number 0-100>,
  "confidence": <number 0-1>,
  "reasoning": "<brief explanation>"
}`;

  const systemPrompt = 'You are an AI sales forecasting analyst. Predict opportunity outcomes based on historical patterns and deal characteristics. Always respond with valid JSON only.';

  const response = await callOpenRouter(prompt, systemPrompt);

  try {
    const parsed = JSON.parse(response);
    // Normalize winProbability to 0-100 range
    let winProb = parsed.winProbability;
    if (winProb !== undefined && winProb !== null) {
      // If it's in 0-1 range, convert to 0-100
      if (winProb > 0 && winProb <= 1) {
        winProb = winProb * 100;
      }
      // Clamp to 0-100
      winProb = Math.min(100, Math.max(0, winProb));
    } else {
      winProb = 50; // Default fallback
    }

    return {
      predictedCloseDate: parsed.predictedCloseDate,
      predictedAmount: parsed.predictedAmount,
      winProbability: winProb,
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
      reasoning: parsed.reasoning || 'No reasoning provided',
    };
  } catch (error) {
    // Fallback
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    return {
      predictedCloseDate: futureDate.toISOString().split('T')[0],
      predictedAmount: opportunity.amount,
      winProbability: opportunity.probability,
      confidence: 0.5,
      reasoning: 'Unable to parse AI response',
    };
  }
}

export async function generateRevenueForecast(
  opportunities: any[],
  historicalData?: any
): Promise<{
  monthly: { month: string; predicted: number; confidence: number }[];
  quarterly: { quarter: string; predicted: number; confidence: number }[];
  insights: string[];
}> {
  const prompt = `Analyze these sales opportunities and generate revenue forecasts:

Total Opportunities: ${opportunities.length}
Pipeline Value: $${opportunities.reduce((sum, o) => sum + o.amount, 0).toLocaleString()}

Opportunities by Stage:
${Object.entries(
    opportunities.reduce((acc: any, o) => {
      acc[o.stage] = (acc[o.stage] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([stage, count]) => `- ${stage}: ${count}`)
    .join('\n')}

Top 5 Opportunities:
${opportunities
  .sort((a, b) => b.amount - a.amount)
  .slice(0, 5)
  .map((o) => `- ${o.name}: $${o.amount.toLocaleString()} (${o.probability}%)`)
  .join('\n')}

Generate revenue forecasts for the next 6 months and 2 quarters. Respond with ONLY a JSON object in this format:
{
  "monthly": [
    {"month": "2025-01", "predicted": <number>, "confidence": <number 0-1>},
    ...
  ],
  "quarterly": [
    {"quarter": "Q1 2025", "predicted": <number>, "confidence": <number 0-1>},
    ...
  ],
  "insights": ["<insight 1>", "<insight 2>", ...]
}`;

  const systemPrompt = 'You are an AI revenue forecasting analyst. Generate accurate revenue predictions based on pipeline data and opportunity characteristics. Always respond with valid JSON only.';

  const response = await callOpenRouter(prompt, systemPrompt);

  try {
    const parsed = JSON.parse(response);
    return parsed;
  } catch (error) {
    // Fallback
    return {
      monthly: [],
      quarterly: [],
      insights: ['Unable to generate forecast - AI response parsing failed'],
    };
  }
}

export async function generateAIInsights(
  leads: any[],
  opportunities: any[],
  activities: any[]
): Promise<{
  insights: Array<{
    type: string;
    title: string;
    description: string;
    priority: string;
    actionItems: string[];
  }>;
}> {
  const prompt = `Analyze this CRM data and generate actionable insights:

Leads Summary:
- Total Leads: ${leads.length}
- By Status: ${JSON.stringify(
    leads.reduce((acc: any, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1;
      return acc;
    }, {})
  )}

Opportunities Summary:
- Total Opportunities: ${opportunities.length}
- Total Value: $${opportunities.reduce((sum, o) => sum + o.amount, 0).toLocaleString()}
- By Stage: ${JSON.stringify(
    opportunities.reduce((acc: any, o) => {
      acc[o.stage] = (acc[o.stage] || 0) + 1;
      return acc;
    }, {})
  )}

Activities Summary:
- Total Activities: ${activities.length}
- Types: ${JSON.stringify(
    activities.reduce((acc: any, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {})
  )}

Generate 3-5 actionable insights with priorities. Respond with ONLY a JSON object in this format:
{
  "insights": [
    {
      "type": "<lead_conversion|opportunity_risk|activity_recommendation|revenue_opportunity>",
      "title": "<short title>",
      "description": "<detailed description>",
      "priority": "<HIGH|MEDIUM|LOW>",
      "actionItems": ["<action 1>", "<action 2>"]
    },
    ...
  ]
}`;

  const systemPrompt = 'You are an AI business intelligence analyst. Generate actionable insights from CRM data to help sales teams improve performance. Always respond with valid JSON only. IMPORTANT: Use only standard ASCII double quotes (") in your JSON response, never use smart quotes or curly quotes.';

  try {
    const response = await callOpenRouter(prompt, systemPrompt);
    console.log('OpenRouter AI Response:', response);

    // Try to extract JSON from response if it's wrapped in markdown or other text
    let jsonStr = response.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }

    // Replace all types of smart quotes and special characters with regular ones
    // Use a more comprehensive regex to catch all non-ASCII quote variants
    jsonStr = jsonStr
      .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")  // All single smart quotes
      .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')  // All double smart quotes
      .replace(/[\u2013\u2014]/g, '-')  // Em/en dashes
      .replace(/[\u2026]/g, '...')     // Ellipsis
      .replace(/"/g, '"')  // Left double quotation mark
      .replace(/"/g, '"')  // Right double quotation mark
      .replace(/'/g, "'")  // Left single quotation mark
      .replace(/'/g, "'"); // Right single quotation mark

    console.log('Cleaned JSON string:', jsonStr);
    const parsed = JSON.parse(jsonStr);
    return parsed;
  } catch (error: any) {
    console.error('Error generating AI insights:', error);
    console.error('Error message:', error.message);

    // Fallback
    return {
      insights: [
        {
          type: 'activity_recommendation',
          title: 'AI Analysis Unavailable',
          description: `Unable to generate insights - ${error.message}`,
          priority: 'LOW',
          actionItems: ['Check OpenRouter API configuration', 'Verify API key is valid', 'Retry analysis later'],
        },
      ],
    };
  }
}
