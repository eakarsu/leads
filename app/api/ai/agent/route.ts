import { NextRequest, NextResponse } from 'next/server';
import { authForAI, runAI } from '@/lib/aiHelpers';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/ai/agent
 * Conversational CRM agent. Tool-calling style: the LLM is given a JSON tool
 * schema describing the supported queries, and returns a structured plan
 * which this handler executes against Prisma. Outputs both the plan and
 * the resolved data so the UI can render either.
 *
 * Body: { message: string, conversationId?: string }
 */

const TOOL_SCHEMA = `Tools (return ONE of these in your "tool" field):
- pipeline_summary: { tool: "pipeline_summary", args: { territoryId?: string } }
- stalled_opportunities: { tool: "stalled_opportunities", args: { daysIdle: number } }
- top_leads: { tool: "top_leads", args: { limit: number, status?: string } }
- forecast_by_stage: { tool: "forecast_by_stage", args: {} }
- create_followups: { tool: "create_followups", args: { ownerId?: string, opportunityIds: string[] } }
- find_record: { tool: "find_record", args: { entity: "Lead"|"Contact"|"Opportunity", query: string } }
- noop: { tool: "noop", args: {}, summary: "..." }`;

export async function POST(req: NextRequest) {
  const auth = await authForAI();
  if (auth instanceof Response) return auth;

  try {
    const { message, conversationId } = await req.json();
    if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 });

    const systemPrompt = `You are a CRM agent for LeadGenFlow. Translate user requests into
ONE tool call from the schema below, returning ONLY JSON like:
{
  "tool": "...",
  "args": { ... },
  "summary": "1-sentence explanation",
  "narrative": "human-friendly answer based on returned data, written after the tool runs"
}

${TOOL_SCHEMA}`;

    const plan: any = await runAI(auth, message, {
      feature: 'agent',
      systemPrompt,
      json: true,
      temperature: 0.2,
      maxTokens: 768,
      inputPayload: { message, conversationId },
    });

    // Execute tool
    let data: any = null;
    try {
      data = await executeTool(plan.tool, plan.args || {});
    } catch (e: any) {
      data = { error: e.message };
    }

    return NextResponse.json({ plan, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function executeTool(tool: string, args: any): Promise<any> {
  switch (tool) {
    case 'pipeline_summary': {
      // territoryId filter is best-effort — Opportunity may not have it.
      const where: any = {};
      if (args?.ownerId) where.ownerId = args.ownerId;
      const opps = await prisma.opportunity.findMany({
        where,
        select: { stage: true, amount: true },
      });
      const byStage: Record<string, { count: number; total: number }> = {};
      for (const o of opps) {
        const s = (o as any).stage || 'Unknown';
        if (!byStage[s]) byStage[s] = { count: 0, total: 0 };
        byStage[s].count += 1;
        byStage[s].total += Number(o.amount ?? 0);
      }
      return { byStage, total: opps.reduce((s, o) => s + Number(o.amount ?? 0), 0) };
    }
    case 'stalled_opportunities': {
      const cutoff = new Date(Date.now() - (args.daysIdle || 30) * 24 * 60 * 60 * 1000);
      return prisma.opportunity.findMany({
        where: { updatedAt: { lt: cutoff } },
        take: 50,
        orderBy: { updatedAt: 'asc' },
        select: { id: true, name: true, stage: true, amount: true, updatedAt: true },
      });
    }
    case 'top_leads': {
      return prisma.lead.findMany({
        take: Math.min(50, args.limit || 10),
        where: args.status ? { status: args.status } : {},
        orderBy: { createdAt: 'desc' },
        select: { id: true, fullName: true, company: true, status: true, email: true },
      });
    }
    case 'forecast_by_stage': {
      const opps = await prisma.opportunity.findMany({
        select: { stage: true, amount: true, probability: true },
      });
      const out: Record<string, number> = {};
      for (const o of opps) {
        const s = (o as any).stage || 'Unknown';
        out[s] = (out[s] || 0) + Number(o.amount ?? 0) * (Number(o.probability ?? 50) / 100);
      }
      return out;
    }
    case 'find_record': {
      const q = String(args.query || '').trim();
      if (!q) return [];
      if (args.entity === 'Lead')
        return prisma.lead.findMany({
          where: { OR: [{ fullName: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] },
          take: 10,
        });
      if (args.entity === 'Contact')
        return prisma.contact.findMany({
          where: { OR: [{ firstName: { contains: q, mode: 'insensitive' } }, { lastName: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] },
          take: 10,
        });
      if (args.entity === 'Opportunity')
        return prisma.opportunity.findMany({
          where: { name: { contains: q, mode: 'insensitive' } },
          take: 10,
        });
      return [];
    }
    case 'create_followups': {
      // Returns a draft list (does not yet write Tasks — caller can confirm)
      return { draft: (args.opportunityIds || []).map((id: string) => ({ opportunityId: id, type: 'CALL', subject: 'Follow-up' })) };
    }
    case 'noop':
    default:
      return null;
  }
}
