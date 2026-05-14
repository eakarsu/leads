/**
 * parseAIJson — 3-strategy JSON parsing for resilient LLM output handling.
 *
 * Strategy 1: direct JSON.parse (after smart-quote normalization).
 * Strategy 2: extract JSON from markdown code fence (```json ... ```).
 * Strategy 3: repair truncated/unterminated JSON by closing brackets/strings.
 *
 * Throws if all 3 strategies fail.
 */
export function parseAIJson<T = any>(raw: string): T {
  if (!raw || typeof raw !== 'string') {
    throw new Error('parseAIJson: empty input');
  }
  // Normalize smart quotes / em-dashes that some models emit
  const normalized = raw
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...');

  const trimmed = normalized.trim();

  // Strategy 1: direct
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    /* fall through */
  }

  // Strategy 2: markdown code fence
  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) {
    const inner = fenceMatch[1].trim();
    try {
      return JSON.parse(inner) as T;
    } catch {
      try {
        return JSON.parse(repairTruncatedJSON(inner)) as T;
      } catch {
        /* fall through */
      }
    }
  }

  // Strategy 3: repair truncated JSON
  try {
    return JSON.parse(repairTruncatedJSON(trimmed)) as T;
  } catch (err: any) {
    throw new Error(`parseAIJson: all 3 strategies failed: ${err.message}`);
  }
}

function repairTruncatedJSON(json: string): string {
  let str = json.trim();

  // Strip leading text up to first { or [
  const firstBrace = str.search(/[\{\[]/);
  if (firstBrace > 0) str = str.substring(firstBrace);

  // Remove trailing comma
  str = str.replace(/,\s*$/, '');

  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\' && inString) { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (!inString) {
      if (ch === '{') stack.push('}');
      else if (ch === '[') stack.push(']');
      else if (ch === '}' || ch === ']') stack.pop();
    }
  }

  if (inString) str += '"';
  str = str.replace(/,\s*$/, '');
  while (stack.length > 0) str += stack.pop();
  return str;
}
