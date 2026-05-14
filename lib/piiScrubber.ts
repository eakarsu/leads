// Apply pass 5 — PII scrubber.
//
// PRODUCT-DECISION: ship a small, conservative regex-based scrubber that masks
// the most common PII surfaces (email, phone, SSN, credit card). Real PII
// classification would use an NLP model — out of scope for this pass.
//
// To wire into the gateway, callers should pass values through `scrubPII()`
// before calling `callAI`. Not auto-applied to keep the change additive.

export interface ScrubOptions {
  email?: boolean;
  phone?: boolean;
  ssn?: boolean;
  creditCard?: boolean;
  customPatterns?: { name: string; re: RegExp }[];
}

const DEFAULTS: Required<Omit<ScrubOptions, 'customPatterns'>> = {
  email: true,
  phone: true,
  ssn: true,
  creditCard: true,
};

const RE_EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
// US-style 10-digit phone numbers (loose); intentionally won't match all global formats.
const RE_PHONE = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const RE_SSN = /\b\d{3}-\d{2}-\d{4}\b/g;
const RE_CC = /\b(?:\d[ -]?){13,19}\b/g;

export interface ScrubResult {
  text: string;
  replacements: { type: string; count: number }[];
}

export function scrubPII(input: string, opts?: ScrubOptions): ScrubResult {
  const o = { ...DEFAULTS, ...(opts || {}) };
  let text = input;
  const replacements: { type: string; count: number }[] = [];

  function apply(re: RegExp, mask: string, type: string) {
    let count = 0;
    text = text.replace(re, () => {
      count++;
      return mask;
    });
    if (count > 0) replacements.push({ type, count });
  }

  if (o.email) apply(RE_EMAIL, '[REDACTED_EMAIL]', 'email');
  if (o.phone) apply(RE_PHONE, '[REDACTED_PHONE]', 'phone');
  if (o.ssn) apply(RE_SSN, '[REDACTED_SSN]', 'ssn');
  if (o.creditCard) apply(RE_CC, '[REDACTED_CC]', 'cc');

  for (const p of opts?.customPatterns || []) {
    apply(p.re, `[REDACTED_${p.name.toUpperCase()}]`, p.name);
  }

  return { text, replacements };
}
