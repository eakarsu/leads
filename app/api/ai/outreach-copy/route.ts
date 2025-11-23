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
    const { channel, campaignBrief, leadPersona, leadName, leadTitle, leadCompany } = body;

    if (!channel) {
      return NextResponse.json({ error: 'Channel is required' }, { status: 400 });
    }

    const validChannels = ['EMAIL', 'LINKEDIN', 'CALL_SCRIPT'];
    if (!validChannels.includes(channel)) {
      return NextResponse.json(
        { error: `Channel must be one of: ${validChannels.join(', ')}` },
        { status: 400 }
      );
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (channel) {
      case 'EMAIL':
        systemPrompt = `You are an expert B2B cold email copywriter. Your emails are personalized, concise, value-focused, and drive action. You avoid spam triggers, generic templates, and pushy language. Your style is conversational yet professional.`;

        userPrompt = `Write a cold outreach email with the following parameters:

${campaignBrief ? `CAMPAIGN BRIEF:\n${campaignBrief}\n` : ''}
${leadPersona ? `LEAD PERSONA:\n${leadPersona}\n` : ''}
${leadName ? `Lead Name: ${leadName}\n` : ''}
${leadTitle ? `Lead Title: ${leadTitle}\n` : ''}
${leadCompany ? `Lead Company: ${leadCompany}\n` : ''}

Create a personalized cold email that:
- Has a compelling, curiosity-driven subject line
- Opens with relevant personalization
- Clearly articulates the value proposition in 2-3 sentences
- Includes a soft, low-friction call-to-action
- Is 100-150 words maximum
- Avoids spam triggers and salesy language

Format as:
SUBJECT: <subject line>

BODY:
<email body>

IMPORTANT: This must be reviewed and edited by a human before sending to any prospect.`;
        break;

      case 'LINKEDIN':
        systemPrompt = `You are an expert LinkedIn outreach specialist. You write connection requests and InMail messages that feel personal, relevant, and non-salesy. Your messages build genuine interest and curiosity.`;

        userPrompt = `Write a LinkedIn outreach message with the following parameters:

${campaignBrief ? `CAMPAIGN BRIEF:\n${campaignBrief}\n` : ''}
${leadPersona ? `LEAD PERSONA:\n${leadPersona}\n` : ''}
${leadName ? `Lead Name: ${leadName}\n` : ''}
${leadTitle ? `Lead Title: ${leadTitle}\n` : ''}
${leadCompany ? `Lead Company: ${leadCompany}\n` : ''}

Create a LinkedIn message that:
- Feels personal and human, not template-based
- References something specific about their role or company
- Explains why you're reaching out (mutual value)
- Ends with a soft question or invitation to connect
- Is 50-100 words maximum

Provide two versions:
1. CONNECTION REQUEST (300 characters max)
2. FOLLOW-UP MESSAGE (if connection is accepted)

IMPORTANT: This must be reviewed and edited by a human before sending to any prospect.`;
        break;

      case 'CALL_SCRIPT':
        systemPrompt = `You are an expert B2B cold calling coach. You write call scripts that sound natural, build rapport quickly, handle objections gracefully, and focus on discovery rather than pitching.`;

        userPrompt = `Write a cold call script with the following parameters:

${campaignBrief ? `CAMPAIGN BRIEF:\n${campaignBrief}\n` : ''}
${leadPersona ? `LEAD PERSONA:\n${leadPersona}\n` : ''}
${leadName ? `Lead Name: ${leadName}\n` : ''}
${leadTitle ? `Lead Title: ${leadTitle}\n` : ''}
${leadCompany ? `Lead Company: ${leadCompany}\n` : ''}

Create a cold call script that includes:
1. OPENER: Pattern interrupt and permission-based opening (15-20 seconds)
2. VALUE STATEMENT: Quick explanation of why you're calling (10 seconds)
3. QUALIFYING QUESTIONS: 3-4 discovery questions
4. OBJECTION HANDLING: Responses to common objections ("Not interested", "Send me info", "No budget")
5. CLOSE: How to book a meeting or advance the conversation

Keep it conversational and natural. Use brackets [like this] for guidance notes.

IMPORTANT: This must be reviewed and practiced by a human before making actual calls.`;
        break;
    }

    const aiResponse = await callOpenRouter({
      systemPrompt,
      userPrompt,
      temperature: 0.8,
      maxTokens: 2000,
    });

    return NextResponse.json({
      copy: aiResponse,
      channel,
      disclaimer: 'This AI-generated content must be reviewed and edited by a human before use with prospects.',
      success: true,
    });
  } catch (error: any) {
    console.error('Error generating outreach copy:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate outreach copy' },
      { status: 500 }
    );
  }
}
