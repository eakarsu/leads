/**
 * Unified AI Gateway
 * Primary: OpenRouter (more model options, cost control)
 * Fallback: Anthropic direct SDK
 *
 * Startup env checks are performed once on first call.
 */

let _startupChecked = false;

function checkEnvAtStartup() {
  if (_startupChecked) return;
  _startupChecked = true;

  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  if (!hasOpenRouter && !hasAnthropic) {
    console.error(
      '[ai-gateway] FATAL: Neither OPENROUTER_API_KEY nor ANTHROPIC_API_KEY is set. ' +
        'All AI calls will fail.'
    );
  } else if (!hasOpenRouter) {
    console.warn(
      '[ai-gateway] OPENROUTER_API_KEY not set — using Anthropic direct SDK only (no fallback).'
    );
  } else if (!hasAnthropic) {
    console.warn(
      '[ai-gateway] ANTHROPIC_API_KEY not set — Anthropic fallback unavailable. ' +
        'Using OpenRouter only.'
    );
  }
}

export interface AICallOptions {
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  /** Override the model (OpenRouter format, e.g. "anthropic/claude-3-opus") */
  model?: string;
}

/**
 * Primary AI entry point. Tries OpenRouter first; if it fails (or key is absent)
 * falls back to Anthropic SDK.
 */
export async function callAI(prompt: string, options: AICallOptions = {}): Promise<string> {
  checkEnvAtStartup();

  const { systemPrompt, maxTokens = 4096, temperature = 0.7, model } = options;

  // Try OpenRouter first
  if (process.env.OPENROUTER_API_KEY) {
    try {
      return await _callOpenRouter(prompt, { systemPrompt, maxTokens, temperature, model });
    } catch (err) {
      console.warn('[ai-gateway] OpenRouter failed, attempting Anthropic fallback:', err);
    }
  }

  // Fallback: Anthropic direct SDK
  if (process.env.ANTHROPIC_API_KEY) {
    return await _callAnthropic(prompt, { systemPrompt, maxTokens, temperature });
  }

  throw new Error(
    '[ai-gateway] No AI provider available. Set OPENROUTER_API_KEY or ANTHROPIC_API_KEY.'
  );
}

// ---------------------------------------------------------------------------
// Internal: OpenRouter
// ---------------------------------------------------------------------------

async function _callOpenRouter(
  prompt: string,
  options: { systemPrompt?: string; maxTokens?: number; temperature?: number; model?: string }
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY!;
  const resolvedModel =
    options.model || process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

  const messages: { role: string; content: string }[] = [];
  if (options.systemPrompt) {
    messages.push({ role: 'system', content: options.systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
      'X-Title': 'LeadGenFlow AI',
    },
    body: JSON.stringify({
      model: resolvedModel,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      messages,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  if (!data.choices?.length) {
    throw new Error('OpenRouter returned no choices');
  }
  return data.choices[0].message.content as string;
}

// ---------------------------------------------------------------------------
// Internal: Anthropic direct SDK
// ---------------------------------------------------------------------------

async function _callAnthropic(
  prompt: string,
  options: { systemPrompt?: string; maxTokens?: number; temperature?: number }
): Promise<string> {
  // Dynamic import so the SDK is only loaded when needed
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
    max_tokens: options.maxTokens ?? 4096,
    system: options.systemPrompt,
    messages: [{ role: 'user', content: prompt }],
    stream: false,
  });

  const block = response.content[0];
  if (block.type !== 'text') {
    throw new Error('Anthropic returned non-text content block');
  }
  return block.text;
}
