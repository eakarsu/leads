import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOperationsActor } from '@/lib/lead-operations/auth';

export async function POST(request: NextRequest) {
  try {
    const actor = await requireOperationsActor();
    const body = await request.json().catch(() => ({}));
    const prompt = String(body?.prompt || '').trim();
    if (!prompt || prompt.length > 8000) return NextResponse.json({ error: 'Prompt must contain 1 through 8000 characters' }, { status: 400 });
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL;
    const baseUrl = process.env.OPENROUTER_BASE_URL;
    if (!apiKey || !model || !baseUrl) return NextResponse.json({ error: 'OpenRouter is not configured' }, { status: 503 });
    const startedAt = Date.now();
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: 'You are a governed lead-operations reviewer. Return concise risks, evidence gaps, next actions, uncertainty, and decisions requiring human approval.' },
          { role: 'user', content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(60000),
    });
    if (!response.ok) return NextResponse.json({ error: `OpenRouter returned ${response.status}` }, { status: 502 });
    const payload = await response.json();
    const content = String(payload?.choices?.[0]?.message?.content || '').trim();
    const providerReceipt = {
      id: String(payload?.id || response.headers.get('x-request-id') || ''),
      created: payload?.created ?? null,
      upstreamModel: String(payload?.model || model),
    };
    if (!content || !providerReceipt.id) return NextResponse.json({ error: 'OpenRouter returned an incomplete response' }, { status: 502 });
    const id = crypto.randomUUID();
    await prisma.aIResult.create({
      data: {
        id,
        feature: 'runtime_lead_advice',
        userId: actor.id,
        input: { prompt },
        output: { content, provider: 'openrouter', providerReceipt },
        model,
        durationMs: Date.now() - startedAt,
      },
    });
    return NextResponse.json({ id, content, provider: 'openrouter', model, providerReceipt });
  } catch (error) {
    const status = typeof error === 'object' && error && 'status' in error ? Number(error.status) : 500;
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: status >= 500 ? 'Internal server error' : message }, { status });
  }
}
