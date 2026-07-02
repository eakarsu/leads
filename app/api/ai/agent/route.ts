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
- create_lead: { tool: "create_lead", args: { fullName: string, email?: string, company?: string, title?: string, phone?: string, clientId?: string, status?: "NEW"|"CONTACTED"|"QUALIFIED"|"UNQUALIFIED" } }
- update_lead: { tool: "update_lead", args: { id: string, status?: "NEW"|"CONTACTED"|"QUALIFIED"|"UNQUALIFIED"|"WON"|"LOST", qualificationScore?: number, notes?: string } }
- create_task: { tool: "create_task", args: { subject: string, description?: string, dueDate?: "YYYY-MM-DD", priority?: "LOW"|"MEDIUM"|"HIGH"|"URGENT", assignedTo?: string, opportunityId?: string, contactId?: string, relatedTo?: string } }
- update_opportunity: { tool: "update_opportunity", args: { id: string, stage?: "PROSPECTING"|"QUALIFICATION"|"NEEDS_ANALYSIS"|"PROPOSAL"|"NEGOTIATION"|"CLOSED_WON"|"CLOSED_LOST", probability?: number, nextSteps?: string, expectedCloseDate?: "YYYY-MM-DD" } }
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
      data = await executeTool(plan.tool, plan.args || {}, auth.userId);
    } catch (e: any) {
      data = { error: e.message };
    }

    return NextResponse.json({ plan, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function executeTool(tool: string, args: any, userId: string): Promise<any> {
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
      const opportunityIds = Array.isArray(args.opportunityIds) ? args.opportunityIds.slice(0, 10) : [];
      const tasks = await Promise.all(
        opportunityIds.map((id: string) =>
          prisma.task.create({
            data: {
              subject: 'Follow up on stalled opportunity',
              description: 'Created by Agentforce agent from a follow-up request.',
              priority: 'HIGH',
              status: 'NOT_STARTED',
              opportunityId: id,
              assignedTo: args.ownerId || userId,
              createdBy: userId,
              dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          })
        )
      );
      return { created: tasks.length, tasks };
    }
    case 'create_lead': {
      if (!args.fullName) throw new Error('fullName is required to create a lead');
      const clientId = args.clientId || (await getDefaultClientId());
      if (!clientId) throw new Error('No client account exists. Create a client before creating leads.');

      const lead = await prisma.lead.create({
        data: {
          clientId,
          fullName: String(args.fullName),
          email: args.email ? String(args.email) : null,
          company: args.company ? String(args.company) : null,
          title: args.title ? String(args.title) : null,
          phone: args.phone ? String(args.phone) : null,
          status: normalizeLeadStatus(args.status),
          qualificationScore: normalizeScore(args.qualificationScore),
          leadSource: 'MANUAL',
          submittedBy: userId,
          notes: 'Created by Agentforce agent.',
          customFields: { createdByAgent: true },
        },
      });
      return { created: true, recordType: 'Lead', record: lead };
    }
    case 'update_lead': {
      if (!args.id) throw new Error('id is required to update a lead');
      const existing = await prisma.lead.findUnique({ where: { id: String(args.id) } });
      if (!existing) throw new Error('Lead not found');

      const data: any = {};
      if (args.status) data.status = normalizeLeadStatus(args.status);
      if (args.qualificationScore !== undefined) data.qualificationScore = normalizeScore(args.qualificationScore);
      if (args.notes !== undefined) data.notes = String(args.notes);

      const updated = await prisma.lead.update({ where: { id: existing.id }, data });
      await recordFieldChanges('Lead', existing.id, existing, data, userId);
      return { updated: true, recordType: 'Lead', record: updated };
    }
    case 'create_task': {
      if (!args.subject) throw new Error('subject is required to create a task');
      const task = await prisma.task.create({
        data: {
          subject: String(args.subject),
          description: args.description ? String(args.description) : null,
          dueDate: args.dueDate ? new Date(args.dueDate) : null,
          priority: normalizeTaskPriority(args.priority),
          status: 'NOT_STARTED',
          assignedTo: args.assignedTo || userId,
          createdBy: userId,
          contactId: args.contactId || null,
          opportunityId: args.opportunityId || null,
          relatedTo: args.relatedTo || null,
        },
      });
      return { created: true, recordType: 'Task', record: task };
    }
    case 'update_opportunity': {
      if (!args.id) throw new Error('id is required to update an opportunity');
      const existing = await prisma.opportunity.findUnique({ where: { id: String(args.id) } });
      if (!existing) throw new Error('Opportunity not found');

      const data: any = {};
      if (args.stage) data.stage = normalizeOpportunityStage(args.stage);
      if (args.probability !== undefined) data.probability = Math.min(100, Math.max(0, Number(args.probability) || 0));
      if (args.nextSteps !== undefined) data.nextSteps = String(args.nextSteps);
      if (args.expectedCloseDate) data.expectedCloseDate = new Date(args.expectedCloseDate);

      const updated = await prisma.opportunity.update({ where: { id: existing.id }, data });
      await recordFieldChanges('Opportunity', existing.id, existing, data, userId);
      return { updated: true, recordType: 'Opportunity', record: updated };
    }
    case 'noop':
    default:
      return null;
  }
}

async function getDefaultClientId() {
  const client = await prisma.clientCompany.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true } });
  return client?.id;
}

function normalizeLeadStatus(value: any) {
  const allowed = ['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'WON', 'LOST'];
  return allowed.includes(String(value)) ? String(value) as any : 'NEW';
}

function normalizeOpportunityStage(value: any) {
  const allowed = ['PROSPECTING', 'QUALIFICATION', 'NEEDS_ANALYSIS', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
  return allowed.includes(String(value)) ? String(value) as any : 'PROSPECTING';
}

function normalizeTaskPriority(value: any) {
  const allowed = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  return allowed.includes(String(value)) ? String(value) as any : 'MEDIUM';
}

function normalizeScore(value: any) {
  return Math.min(100, Math.max(0, Number(value) || 0));
}

async function recordFieldChanges(objectType: string, objectId: string, existing: any, data: any, userId: string) {
  const changes = Object.entries(data).filter(([key, value]) => String(existing[key] ?? '') !== String(value ?? ''));
  if (changes.length === 0) return;

  await prisma.fieldHistory.createMany({
    data: changes.map(([fieldName, newValue]) => ({
      objectType,
      objectId,
      fieldName,
      oldValue: existing[fieldName] === null || existing[fieldName] === undefined ? null : String(existing[fieldName]),
      newValue: newValue === null || newValue === undefined ? null : String(newValue),
      changedBy: userId,
    })),
  });
}
