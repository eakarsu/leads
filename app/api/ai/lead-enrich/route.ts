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
    const { fullName, title, company, website, linkedinUrl, customFields } = body;

    if (!fullName) {
      return NextResponse.json(
        { error: 'Full name is required' },
        { status: 400 }
      );
    }

    const isB2C = !company || company === 'Not provided';

    const systemPrompt = isB2C
      ? `You are an expert consumer demographic and behavioral analyst. Based on the limited information provided about a consumer lead, infer and estimate useful demographic, behavioral, and psychographic data points.

IMPORTANT:
- You are making educated inferences based on patterns and typical consumer profiles, not fetching real data
- You MUST respond ONLY with valid JSON format, no other text
- Focus on providing useful estimations that can help with lead qualification, personalization, and outreach strategy

Consider factors like: name patterns, location, expressed needs, communication preferences, buying behavior indicators, and life stage.`
      : `You are an expert B2B data enrichment specialist. Based on the limited information provided about a lead, infer and estimate additional data points using your knowledge of business patterns, industry standards, and typical company profiles.

IMPORTANT:
- You are making educated inferences based on patterns, not fetching real data
- You MUST respond ONLY with valid JSON format, no other text
- Be clear when you're making assumptions
- Focus on providing useful estimations that can help with lead qualification and outreach personalization`;

    const customFieldsInfo = customFields && Object.keys(customFields).length > 0
      ? `\n\nAdditional Context:\n${Object.entries(customFields)
          .map(([key, value]) => `- ${key}: ${value}`)
          .join('\n')}`
      : '';

    const userPrompt = isB2C
      ? `Based on the following consumer lead information, provide enrichment data with reasonable inferences:

Lead Name: ${fullName}
Email: ${website || 'Not provided'}
Phone/Contact: ${linkedinUrl || 'Not provided'}${customFieldsInfo}

IMPORTANT: Return ONLY valid JSON. Do not include any explanatory text before or after the JSON.

Please infer and provide useful consumer insights in the following JSON structure:

{
  "companySize": "Consumer/Homeowner or similar consumer classification",
  "industry": "Likely demographic segment (e.g., Homeowner - Middle Income, Professional Consumer, Small Business Owner)",
  "techStack": "Consumer technology preferences and digital savviness (e.g., Mobile-first consumer, likely uses smartphone for research)",
  "location": "Most probable geographic location (city, state, or region)",
  "decisionMakerRelevance": "Consumer profile and decision-making authority (e.g., Primary household decision-maker)",
  "additionalInsights": {
    "ageRange": "Estimated age range based on name patterns",
    "homeownerStatus": "Likely homeowner status",
    "purchaseIntent": "Purchase intent and urgency indicators",
    "communicationPreferences": "Preferred communication methods",
    "priceSensitivity": "Price sensitivity indicators",
    "lifeStage": "Life stage (young professional, family with kids, retiree, etc.)"
  }
}

Be specific and actionable. Return ONLY the JSON object, no other text.`
      : `Based on the following B2B lead information, provide enrichment data with reasonable inferences:

Lead Name: ${fullName}
Job Title: ${title || 'Not provided'}
Company: ${company}
Website: ${website || 'Not provided'}
LinkedIn: ${linkedinUrl || 'Not provided'}${customFieldsInfo}

IMPORTANT: Return ONLY valid JSON. Do not include any explanatory text before or after the JSON.

Provide your response in this exact JSON structure:

{
  "companySize": "Estimate the number of employees (e.g., 50-200, 1000-5000)",
  "industry": "Most likely industry category",
  "techStack": "Probable technologies they use based on their industry and size",
  "location": "Most probable headquarters location",
  "decisionMakerRelevance": "Based on the job title, assess if this person is likely a decision-maker for B2B purchases",
  "additionalInsights": {
    "revenueRange": "Estimated annual revenue range",
    "companyStage": "Company stage (startup, growth, mature, enterprise)",
    "likelihood": "Confidence level of these inferences"
  }
}

Be realistic and indicate when you're making assumptions. Return ONLY the JSON object, no other text.`;

    const aiResponse = await callOpenRouter({
      systemPrompt,
      userPrompt,
      temperature: 0.3, // Lower temperature for more consistent JSON output
      maxTokens: 1500,
    });

    console.log('AI Response:', aiResponse);

    // Parse JSON response
    let parsedResponse;
    try {
      // Try multiple patterns to extract JSON
      let jsonStr = aiResponse;

      // Pattern 1: JSON code block
      const codeBlockMatch = aiResponse.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
      } else {
        // Pattern 2: Find JSON object in text
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
      }

      parsedResponse = JSON.parse(jsonStr.trim());
      console.log('Parsed successfully:', parsedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw AI response:', aiResponse);

      // Try to extract useful information from the text response
      const lines = aiResponse.split('\n');
      parsedResponse = {
        companySize: 'Unable to parse - see raw response',
        industry: 'Unable to parse - see raw response',
        techStack: 'Unable to parse - see raw response',
        location: 'Unable to parse - see raw response',
        decisionMakerRelevance: 'Unable to parse - see raw response',
        additionalInsights: {
          rawResponse: aiResponse,
          parseError: parseError instanceof Error ? parseError.message : String(parseError)
        },
      };
    }

    return NextResponse.json({
      ...parsedResponse,
      success: true,
    });
  } catch (error: any) {
    console.error('Error enriching lead:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to enrich lead data' },
      { status: 500 }
    );
  }
}
