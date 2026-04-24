const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku';

// Attempt to repair truncated JSON by closing open brackets/braces/strings
function repairTruncatedJSON(json: string): string {
  let str = json.trim();

  // If it already parses, return as-is
  try { JSON.parse(str); return str; } catch {}

  // Track open structures
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\' && inString) { escaped = true; continue; }

    if (ch === '"' && !inString) { inString = true; continue; }
    if (ch === '"' && inString) { inString = false; continue; }

    if (!inString) {
      if (ch === '{') stack.push('}');
      else if (ch === '[') stack.push(']');
      else if (ch === '}' || ch === ']') stack.pop();
    }
  }

  // Close open string
  if (inString) {
    // Truncate the last incomplete string value to a clean break
    const lastQuote = str.lastIndexOf('"');
    if (lastQuote > 0) {
      // Find if this is a value — look backwards for the colon
      const beforeQuote = str.substring(0, lastQuote).trimEnd();
      if (beforeQuote.endsWith(':') || beforeQuote.endsWith(',') || beforeQuote.endsWith('[')) {
        // We're in a value string that got truncated — close it
        str += '"';
      } else {
        // Truncate back to last complete entry
        const lastComma = str.lastIndexOf(',');
        const lastBracket = Math.max(str.lastIndexOf('['), str.lastIndexOf('{'));
        const cutPoint = Math.max(lastComma, lastBracket);
        if (cutPoint > 0) {
          str = str.substring(0, cutPoint);
          if (str.endsWith(',')) str = str.slice(0, -1);
        }
      }
    }
  }

  // Recount what needs closing after potential truncation
  const stack2: string[] = [];
  let inStr2 = false;
  let esc2 = false;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (esc2) { esc2 = false; continue; }
    if (ch === '\\' && inStr2) { esc2 = true; continue; }
    if (ch === '"') { inStr2 = !inStr2; continue; }
    if (!inStr2) {
      if (ch === '{') stack2.push('}');
      else if (ch === '[') stack2.push(']');
      else if (ch === '}' || ch === ']') stack2.pop();
    }
  }

  // Remove trailing comma before closing
  str = str.replace(/,\s*$/, '');

  // Close all open structures
  while (stack2.length > 0) {
    str += stack2.pop();
  }

  return str;
}

export async function callOpenRouter(prompt: string, systemPrompt?: string, maxTokens?: number) {
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
      max_tokens: maxTokens || 4096,
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
    console.error('Failed to parse lead score AI response:', error);
    throw new Error('AI returned invalid JSON response for lead scoring');
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
    console.error('Failed to parse opportunity prediction AI response:', error);
    throw new Error('AI returned invalid JSON response for opportunity prediction');
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

  const response = await callOpenRouter(prompt, systemPrompt, 4096);

  try {
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }
    try {
      return JSON.parse(jsonStr);
    } catch {
      return JSON.parse(repairTruncatedJSON(jsonStr));
    }
  } catch (error) {
    console.error('Failed to parse revenue forecast AI response:', error);
    throw new Error('AI returned invalid JSON response for revenue forecast');
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
    const response = await callOpenRouter(prompt, systemPrompt, 4096);

    // Try to extract JSON from response if it's wrapped in markdown or other text
    let jsonStr = response.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }

    // Replace all types of smart quotes and special characters with regular ones
    jsonStr = jsonStr
      .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")  // All single smart quotes
      .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')  // All double smart quotes
      .replace(/[\u2013\u2014]/g, '-')  // Em/en dashes
      .replace(/[\u2026]/g, '...')     // Ellipsis
      .replace(/\u201C/g, '"')  // Left double quotation mark
      .replace(/\u201D/g, '"')  // Right double quotation mark
      .replace(/\u2018/g, "'")  // Left single quotation mark
      .replace(/\u2019/g, "'"); // Right single quotation mark

    // Try parsing directly first, then repair if truncated
    try {
      return JSON.parse(jsonStr);
    } catch {
      console.warn('JSON parse failed, attempting to repair truncated response...');
      const repaired = repairTruncatedJSON(jsonStr);
      return JSON.parse(repaired);
    }
  } catch (error: any) {
    console.error('Failed to generate AI insights:', error.message);
    throw new Error(`AI insights generation failed: ${error.message}`);
  }
}
