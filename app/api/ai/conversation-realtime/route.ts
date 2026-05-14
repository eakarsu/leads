import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { callOpenRouter } from '@/lib/openrouter';
import { checkAIRateLimit } from '@/lib/aiRateLimiter';

// Conversation Intelligence Realtime — live coaching prompts while a sales call is ongoing.
// Accepts a streaming transcript window; returns coach suggestions every chunk.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rl = checkAIRateLimit(session.user.id);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded', resetAt: rl.resetAt }, { status: 429 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    transcriptWindow?: string;
    callId?: string;
    speaker?: string;
    opportunityContext?: { name?: string; stage?: string; amount?: number };
  };
  if (!body.transcriptWindow || body.transcriptWindow.length < 20) {
    return NextResponse.json({ error: 'transcriptWindow (>=20 chars) required' }, { status: 400 });
  }

  const sys = 'You are a real-time sales coach. From the most recent transcript window, surface up to 3 prompts: objection coach, next-question-to-ask, risk-flag. Be terse (<=15 words each). Output JSON: { prompts: [{ type, prompt }], detectedIntent }.';
  const user = `Opportunity: ${JSON.stringify(body.opportunityContext || {})}\nSpeaker: ${body.speaker || 'unknown'}\nTranscript window:\n${body.transcriptWindow.slice(-3000)}`;
  const raw = await callOpenRouter(user, sys, 600);
  return NextResponse.json({ raw, callId: body.callId || null, at: new Date().toISOString() });
}
