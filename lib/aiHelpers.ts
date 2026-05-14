/**
 * Server-side AI helpers — wraps the unified AI gateway with:
 *   - per-user rate limiting (20/hr)
 *   - AIResult persistence (input/output JSONB)
 *   - parseAIJson 3-strategy parsing
 *
 * Use from API route handlers.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { prisma } from './prisma';
import { callAI, AICallOptions } from './ai-gateway';
import { parseAIJson } from './parseAIJson';
import { enforceAIRateLimit } from './aiRateLimiter';

export interface RunAIOptions extends AICallOptions {
  feature: string;
  /** Object the AI is reasoning about, for traceability */
  objectType?: string;
  objectId?: string;
  /** Optional structured input to persist alongside the prompt */
  inputPayload?: any;
  /** If true, parseAIJson() the result before returning */
  json?: boolean;
}

export interface AIRunContext {
  userId: string;
}

/**
 * Resolve the current authenticated user id from next-auth session,
 * enforce the AI rate limit, and return either { userId } or a 401/429 Response.
 */
export async function authForAI(): Promise<{ userId: string } | Response> {
  const session = await getServerSession(authOptions as any);
  const userId = (session as any)?.user?.id as string | undefined;
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const limited = await enforceAIRateLimit(userId);
  if (limited) return limited;
  return { userId };
}

/**
 * Execute an AI call, persisting to ai_results regardless of success/error.
 * On success returns the parsed (or raw) AI output.
 * On error throws — caller is responsible for HTTP envelope.
 */
export async function runAI<T = any>(
  ctx: AIRunContext,
  prompt: string,
  options: RunAIOptions
): Promise<T> {
  const started = Date.now();
  const { feature, objectType, objectId, inputPayload, json, ...callOpts } = options;

  try {
    const raw = await callAI(prompt, callOpts);
    const parsed = json ? parseAIJson<T>(raw) : ((raw as unknown) as T);

    await prisma.aIResult.create({
      data: {
        feature,
        userId: ctx.userId,
        objectType,
        objectId,
        input: inputPayload ?? { prompt: prompt.slice(0, 4000), options: callOpts },
        output: parsed as any,
        model: callOpts.model || process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
        durationMs: Date.now() - started,
        status: 'success',
      },
    });

    return parsed;
  } catch (err: any) {
    await prisma.aIResult
      .create({
        data: {
          feature,
          userId: ctx.userId,
          objectType,
          objectId,
          input: inputPayload ?? { prompt: prompt.slice(0, 2000) },
          output: {},
          status: 'error',
          errorMessage: err.message,
          durationMs: Date.now() - started,
        },
      })
      .catch(() => {});
    throw err;
  }
}
