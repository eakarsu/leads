/**
 * @deprecated — use lib/openrouter.ts (callOpenRouter) or lib/ai-gateway.ts (callAI).
 * This shim is kept for backwards compatibility and re-exports the canonical
 * implementation, normalizing the legacy { systemPrompt, userPrompt } API to
 * the (prompt, systemPrompt, maxTokens) signature used elsewhere.
 */

import { callOpenRouter as _callOpenRouter } from './openrouter';

export interface AICallParams {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export async function callOpenRouter(params: AICallParams): Promise<string> {
  return _callOpenRouter(params.userPrompt, params.systemPrompt, params.maxTokens);
}

export function isOpenRouterConfigured(): boolean {
  return !!(
    process.env.OPENROUTER_API_KEY &&
    process.env.OPENROUTER_API_KEY !== 'sk-or-v1-your-key-here'
  );
}
