// Apply pass 5 — prompt versioning registry.
//
// PRODUCT-DECISION: keep prompts in a typed registry rather than reading from
// disk or DB. Each entry has { id, version, template }. Routes can opt-in by
// importing PROMPTS[id] and calling .render(vars) — this pass does NOT rewrite
// the existing 28 routes (kept additive).
//
// Adding a new prompt:
//   1) append to PROMPTS with an explicit version number
//   2) bump version on changes; old versions remain importable for replay
//
// Keep these as plain strings — the gateway already handles JSON-mode prompts.

export interface PromptDef {
  id: string;
  version: number;
  description: string;
  template: string;
}

function render(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => {
    const v = vars[k];
    return v == null ? '' : String(v);
  });
}

export const PROMPTS: Record<string, PromptDef> = {
  'lead-enrich': {
    id: 'lead-enrich',
    version: 1,
    description: 'Enrich a CRM lead with industry / pain-points / target-persona inference.',
    template: 'You are a B2B sales analyst. Given the following lead, return strict JSON with industry, painPoints[], buyerPersona, score (0-100): {{lead}}',
  },
  'opportunity-summary': {
    id: 'opportunity-summary',
    version: 1,
    description: 'Summarize an opportunity for an exec briefing.',
    template: 'Summarize the opportunity below in <=120 words for an exec read-out. Return strict JSON {summary, risks[], nextActions[]}: {{opportunity}}',
  },
  'email-followup': {
    id: 'email-followup',
    version: 1,
    description: 'Draft a follow-up email matching the conversation history.',
    template: 'Draft a follow-up email matching the tone of the prior thread. Return JSON {subject, body}. History: {{history}}',
  },
};

export function getPrompt(id: string): PromptDef | null {
  return PROMPTS[id] || null;
}

export function renderPrompt(id: string, vars: Record<string, unknown>): string | null {
  const p = PROMPTS[id];
  if (!p) return null;
  return render(p.template, vars);
}

export function listPrompts(): { id: string; version: number; description: string }[] {
  return Object.values(PROMPTS).map(({ id, version, description }) => ({ id, version, description }));
}
