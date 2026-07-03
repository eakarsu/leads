import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { authForAI, runAI } from '@/lib/aiHelpers';
import { prisma } from '@/lib/prisma';

type AgentTool =
  | 'app_summary'
  | 'list_records'
  | 'find_records'
  | 'create_record'
  | 'update_record'
  | 'delete_record'
  | 'pipeline_summary'
  | 'noop';

type AgentPlan = {
  tool: AgentTool;
  entity?: EntityKey;
  args?: Record<string, unknown>;
  summary?: string;
};

type EntityKey = keyof typeof ENTITY_CONFIG;

type EntityConfig = {
  label: string;
  route: string;
  delegate: unknown;
  searchFields: string[];
  orderBy?: object;
  defaultSelect?: object;
  prepareCreate?: (fields: Record<string, unknown>, userId: string) => Promise<Record<string, unknown>>;
  prepareUpdate?: (fields: Record<string, unknown>) => Record<string, unknown>;
};

type RuntimeDelegate = {
  findMany: (args?: object) => Promise<unknown[]>;
  create?: (args: object) => Promise<unknown>;
  update?: (args: object) => Promise<unknown>;
  delete?: (args: object) => Promise<unknown>;
};

const ENTITY_CONFIG = {
  lead: {
    label: 'Lead',
    route: '/leads',
    delegate: prisma.lead,
    searchFields: ['fullName', 'email', 'company', 'phone'],
    orderBy: { createdAt: 'desc' },
    defaultSelect: { id: true, fullName: true, email: true, company: true, status: true, qualificationScore: true, createdAt: true },
    prepareCreate: async (fields, userId) => ({
      clientId: stringOr(fields.clientId, await getDefaultClientId()),
      fullName: stringOr(fields.fullName || fields.name, 'New Lead'),
      email: nullableString(fields.email),
      phone: nullableString(fields.phone),
      company: nullableString(fields.company),
      title: nullableString(fields.title),
      status: enumValue(fields.status, ['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'WON', 'LOST'], 'NEW'),
      qualificationScore: numberOr(fields.qualificationScore, 0),
      leadSource: 'MANUAL',
      submittedBy: userId,
      notes: nullableString(fields.notes),
      customFields: { createdByAssistant: true },
    }),
    prepareUpdate: (fields) => pickDefined({
      fullName: stringOrUndefined(fields.fullName || fields.name),
      email: nullableStringOrUndefined(fields.email),
      phone: nullableStringOrUndefined(fields.phone),
      company: nullableStringOrUndefined(fields.company),
      title: nullableStringOrUndefined(fields.title),
      status: fields.status ? enumValue(fields.status, ['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'WON', 'LOST'], 'NEW') : undefined,
      qualificationScore: fields.qualificationScore === undefined ? undefined : numberOr(fields.qualificationScore, 0),
      notes: nullableStringOrUndefined(fields.notes),
    }),
  },
  contact: {
    label: 'Contact',
    route: '/contacts',
    delegate: prisma.contact,
    searchFields: ['firstName', 'lastName', 'email', 'phone', 'title'],
    orderBy: { createdAt: 'desc' },
    defaultSelect: { id: true, firstName: true, lastName: true, email: true, phone: true, title: true, createdAt: true },
    prepareCreate: async (fields, userId) => splitContactName({
      clientId: stringOr(fields.clientId, await getDefaultClientId()),
      ownerId: stringOr(fields.ownerId, userId),
      firstName: stringOr(fields.firstName, ''),
      lastName: stringOr(fields.lastName, ''),
      email: nullableString(fields.email),
      phone: nullableString(fields.phone),
      title: nullableString(fields.title),
      department: nullableString(fields.department),
      notes: nullableString(fields.notes),
      name: fields.name,
    }),
    prepareUpdate: (fields) => pickDefined({
      firstName: stringOrUndefined(fields.firstName),
      lastName: stringOrUndefined(fields.lastName),
      email: nullableStringOrUndefined(fields.email),
      phone: nullableStringOrUndefined(fields.phone),
      title: nullableStringOrUndefined(fields.title),
      department: nullableStringOrUndefined(fields.department),
      notes: nullableStringOrUndefined(fields.notes),
    }),
  },
  client: {
    label: 'Client',
    route: '/clients',
    delegate: prisma.clientCompany,
    searchFields: ['name', 'industry', 'contactName', 'contactEmail'],
    orderBy: { createdAt: 'desc' },
    defaultSelect: { id: true, name: true, industry: true, contactName: true, contactEmail: true, createdAt: true },
    prepareCreate: async (fields) => ({
      name: stringOr(fields.name, 'New Client'),
      industry: stringOr(fields.industry, 'General'),
      website: nullableString(fields.website),
      contactName: stringOr(fields.contactName, 'Primary Contact'),
      contactEmail: stringOr(fields.contactEmail || fields.email, 'contact@example.com'),
      contactPhone: nullableString(fields.contactPhone || fields.phone),
      notes: nullableString(fields.notes),
    }),
    prepareUpdate: (fields) => pickDefined({
      name: stringOrUndefined(fields.name),
      industry: stringOrUndefined(fields.industry),
      website: nullableStringOrUndefined(fields.website),
      contactName: stringOrUndefined(fields.contactName),
      contactEmail: stringOrUndefined(fields.contactEmail || fields.email),
      contactPhone: nullableStringOrUndefined(fields.contactPhone || fields.phone),
      notes: nullableStringOrUndefined(fields.notes),
    }),
  },
  opportunity: {
    label: 'Opportunity',
    route: '/opportunities',
    delegate: prisma.opportunity,
    searchFields: ['name', 'description', 'nextSteps'],
    orderBy: { createdAt: 'desc' },
    defaultSelect: { id: true, name: true, stage: true, amount: true, probability: true, expectedCloseDate: true, createdAt: true },
    prepareCreate: async (fields, userId) => ({
      clientId: stringOr(fields.clientId, await getDefaultClientId()),
      name: stringOr(fields.name, 'New Opportunity'),
      stage: enumValue(fields.stage, ['PROSPECTING', 'QUALIFICATION', 'NEEDS_ANALYSIS', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'], 'PROSPECTING'),
      amount: numberOr(fields.amount, 0),
      probability: numberOr(fields.probability, 0),
      expectedCloseDate: dateOrNull(fields.expectedCloseDate),
      ownerId: stringOr(fields.ownerId, userId),
      description: nullableString(fields.description),
      nextSteps: nullableString(fields.nextSteps),
    }),
    prepareUpdate: (fields) => pickDefined({
      name: stringOrUndefined(fields.name),
      stage: fields.stage ? enumValue(fields.stage, ['PROSPECTING', 'QUALIFICATION', 'NEEDS_ANALYSIS', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'], 'PROSPECTING') : undefined,
      amount: fields.amount === undefined ? undefined : numberOr(fields.amount, 0),
      probability: fields.probability === undefined ? undefined : numberOr(fields.probability, 0),
      expectedCloseDate: fields.expectedCloseDate === undefined ? undefined : dateOrNull(fields.expectedCloseDate),
      description: nullableStringOrUndefined(fields.description),
      nextSteps: nullableStringOrUndefined(fields.nextSteps),
    }),
  },
  task: {
    label: 'Task',
    route: '/tasks',
    delegate: prisma.task,
    searchFields: ['subject', 'description', 'relatedTo'],
    orderBy: { createdAt: 'desc' },
    defaultSelect: { id: true, subject: true, status: true, priority: true, dueDate: true, createdAt: true },
    prepareCreate: async (fields, userId) => ({
      subject: stringOr(fields.subject || fields.name, 'New Task'),
      description: nullableString(fields.description),
      dueDate: dateOrNull(fields.dueDate),
      status: enumValue(fields.status, ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DEFERRED', 'WAITING'], 'NOT_STARTED'),
      priority: enumValue(fields.priority, ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], 'MEDIUM'),
      assignedTo: stringOr(fields.assignedTo, userId),
      createdBy: userId,
      contactId: nullableString(fields.contactId),
      opportunityId: nullableString(fields.opportunityId),
      relatedTo: nullableString(fields.relatedTo),
    }),
    prepareUpdate: (fields) => pickDefined({
      subject: stringOrUndefined(fields.subject || fields.name),
      description: nullableStringOrUndefined(fields.description),
      dueDate: fields.dueDate === undefined ? undefined : dateOrNull(fields.dueDate),
      status: fields.status ? enumValue(fields.status, ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DEFERRED', 'WAITING'], 'NOT_STARTED') : undefined,
      priority: fields.priority ? enumValue(fields.priority, ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], 'MEDIUM') : undefined,
      relatedTo: nullableStringOrUndefined(fields.relatedTo),
    }),
  },
  case: {
    label: 'Case',
    route: '/cases',
    delegate: prisma.case,
    searchFields: ['caseNumber', 'subject', 'description', 'resolution'],
    orderBy: { createdAt: 'desc' },
    defaultSelect: { id: true, caseNumber: true, subject: true, status: true, priority: true, origin: true, createdAt: true },
    prepareCreate: async (fields, userId) => ({
      caseNumber: await nextCaseNumber(),
      subject: stringOr(fields.subject || fields.name, 'New Case'),
      description: nullableString(fields.description),
      priority: enumValue(fields.priority, ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], 'MEDIUM'),
      origin: enumValue(fields.origin, ['PHONE', 'EMAIL', 'WEB', 'CHAT', 'SOCIAL', 'PARTNER'], 'WEB'),
      type: nullableString(fields.type),
      reason: nullableString(fields.reason),
      ownerId: userId,
      queueId: nullableString(fields.queueId),
      slaDeadline: dateOrNull(fields.slaDeadline),
    }),
    prepareUpdate: (fields) => pickDefined({
      subject: stringOrUndefined(fields.subject || fields.name),
      description: nullableStringOrUndefined(fields.description),
      status: fields.status ? enumValue(fields.status, ['NEW', 'OPEN', 'IN_PROGRESS', 'ESCALATED', 'ON_HOLD', 'WAITING_ON_CUSTOMER', 'CLOSED', 'RESOLVED'], 'NEW') : undefined,
      priority: fields.priority ? enumValue(fields.priority, ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], 'MEDIUM') : undefined,
      resolution: nullableStringOrUndefined(fields.resolution),
    }),
  },
  product: {
    label: 'Product',
    route: '/products',
    delegate: prisma.product,
    searchFields: ['name', 'code', 'description', 'category'],
    orderBy: { createdAt: 'desc' },
    defaultSelect: { id: true, name: true, code: true, category: true, unitPrice: true, isActive: true },
    prepareCreate: async (fields) => ({
      clientId: stringOr(fields.clientId, await getDefaultClientId()),
      name: stringOr(fields.name, 'New Product'),
      code: nullableString(fields.code),
      description: nullableString(fields.description),
      unitPrice: numberOr(fields.unitPrice || fields.price, 0),
      category: nullableString(fields.category),
      isActive: fields.isActive === undefined ? true : Boolean(fields.isActive),
    }),
    prepareUpdate: (fields) => pickDefined({
      name: stringOrUndefined(fields.name),
      code: nullableStringOrUndefined(fields.code),
      description: nullableStringOrUndefined(fields.description),
      unitPrice: fields.unitPrice === undefined && fields.price === undefined ? undefined : numberOr(fields.unitPrice || fields.price, 0),
      category: nullableStringOrUndefined(fields.category),
      isActive: fields.isActive === undefined ? undefined : Boolean(fields.isActive),
    }),
  },
  email_template: {
    label: 'Email Template',
    route: '/email-templates',
    delegate: prisma.emailTemplate,
    searchFields: ['name', 'subject', 'body', 'category'],
    orderBy: { createdAt: 'desc' },
    defaultSelect: { id: true, name: true, subject: true, category: true, isActive: true, createdAt: true },
    prepareCreate: async (fields) => ({
      name: stringOr(fields.name, 'New Template'),
      subject: stringOr(fields.subject, 'Follow up'),
      body: stringOr(fields.body, 'Hi {{firstName}},\n\nFollowing up as discussed.\n\nBest,\n{{senderName}}'),
      category: nullableString(fields.category),
      isActive: fields.isActive === undefined ? true : Boolean(fields.isActive),
    }),
    prepareUpdate: (fields) => pickDefined({
      name: stringOrUndefined(fields.name),
      subject: stringOrUndefined(fields.subject),
      body: stringOrUndefined(fields.body),
      category: nullableStringOrUndefined(fields.category),
      isActive: fields.isActive === undefined ? undefined : Boolean(fields.isActive),
    }),
  },
  notification: {
    label: 'Notification',
    route: '/notifications',
    delegate: prisma.notification,
    searchFields: ['title', 'message'],
    orderBy: { createdAt: 'desc' },
    defaultSelect: { id: true, title: true, message: true, type: true, isRead: true, createdAt: true },
    prepareCreate: async (fields, userId) => ({
      userId: stringOr(fields.userId, userId),
      title: stringOr(fields.title || fields.name, 'Assistant Notification'),
      message: stringOr(fields.message || fields.description, 'Created by the CRM assistant.'),
      type: enumValue(fields.type, ['LEAD_ASSIGNED', 'TASK_ASSIGNED', 'OPPORTUNITY_WON', 'OPPORTUNITY_LOST', 'EMAIL_RECEIVED', 'MENTION', 'COMMENT', 'WORKFLOW_TRIGGERED', 'SYSTEM'], 'SYSTEM'),
      link: nullableString(fields.link),
      metadata: { createdByAssistant: true },
    }),
    prepareUpdate: (fields) => pickDefined({
      title: stringOrUndefined(fields.title || fields.name),
      message: stringOrUndefined(fields.message || fields.description),
      isRead: fields.isRead === undefined ? undefined : Boolean(fields.isRead),
    }),
  },
  note: {
    label: 'Note',
    route: '/record-activity',
    delegate: prisma.note,
    searchFields: ['content'],
    orderBy: { createdAt: 'desc' },
    defaultSelect: { id: true, content: true, leadId: true, contactId: true, opportunityId: true, createdAt: true },
    prepareCreate: async (fields, userId) => ({
      content: stringOr(fields.content || fields.note || fields.description, 'Created by the CRM assistant.'),
      createdBy: userId,
      leadId: nullableString(fields.leadId),
      contactId: nullableString(fields.contactId),
      opportunityId: nullableString(fields.opportunityId),
    }),
    prepareUpdate: (fields) => pickDefined({
      content: stringOrUndefined(fields.content || fields.note || fields.description),
    }),
  },
  field_history: {
    label: 'Field History',
    route: '/record-activity',
    delegate: prisma.fieldHistory,
    searchFields: ['objectType', 'objectId', 'fieldName', 'oldValue', 'newValue'],
    orderBy: { changedAt: 'desc' },
    defaultSelect: { id: true, objectType: true, objectId: true, fieldName: true, oldValue: true, newValue: true, changedAt: true },
    prepareCreate: async (fields, userId) => {
      const objectType = objectTypeValue(fields.objectType || fields.type || fields.entity, 'Lead');
      return {
        objectType,
        objectId: stringOr(fields.objectId || fields.recordId || fields.leadId || fields.contactId || fields.opportunityId, await getDefaultObjectId(objectType)),
        fieldName: stringOr(fields.fieldName || fields.field, 'status'),
        oldValue: nullableString(fields.oldValue || fields.before),
        newValue: nullableString(fields.newValue || fields.after),
        changedBy: userId,
      };
    },
  },
  opportunity_contact_role: {
    label: 'Opportunity Contact Role',
    route: '/opportunity-contact-roles',
    delegate: prisma.opportunityContactRole,
    searchFields: ['id', 'opportunityId', 'contactId'],
    orderBy: { createdAt: 'desc' },
    defaultSelect: { id: true, opportunityId: true, contactId: true, role: true, isPrimary: true, createdAt: true },
    prepareCreate: async (fields) => ({
      opportunityId: stringOr(fields.opportunityId, await getDefaultOpportunityId()),
      contactId: stringOr(fields.contactId, await getDefaultContactId()),
      role: enumValue(fields.role, ['DECISION_MAKER', 'INFLUENCER', 'ECONOMIC_BUYER', 'TECHNICAL_BUYER', 'CHAMPION', 'EVALUATOR', 'END_USER'], 'DECISION_MAKER'),
      isPrimary: fields.isPrimary === undefined ? false : Boolean(fields.isPrimary),
    }),
    prepareUpdate: (fields) => pickDefined({
      role: fields.role ? enumValue(fields.role, ['DECISION_MAKER', 'INFLUENCER', 'ECONOMIC_BUYER', 'TECHNICAL_BUYER', 'CHAMPION', 'EVALUATOR', 'END_USER'], 'DECISION_MAKER') : undefined,
      isPrimary: fields.isPrimary === undefined ? undefined : Boolean(fields.isPrimary),
    }),
  },
  case_queue: {
    label: 'Case Queue',
    route: '/case-queues',
    delegate: prisma.caseQueue,
    searchFields: ['name', 'description'],
    orderBy: { createdAt: 'desc' },
    defaultSelect: { id: true, name: true, description: true, memberIds: true, isActive: true, createdAt: true },
    prepareCreate: async (fields) => ({
      name: stringOr(fields.name, 'New Case Queue'),
      description: nullableString(fields.description),
      memberIds: stringArray(fields.memberIds || fields.members),
      isActive: fields.isActive === undefined ? true : Boolean(fields.isActive),
    }),
    prepareUpdate: (fields) => pickDefined({
      name: stringOrUndefined(fields.name),
      description: nullableStringOrUndefined(fields.description),
      memberIds: fields.memberIds === undefined && fields.members === undefined ? undefined : stringArray(fields.memberIds || fields.members),
      isActive: fields.isActive === undefined ? undefined : Boolean(fields.isActive),
    }),
  },
  case_milestone: {
    label: 'Case Milestone',
    route: '/case-milestones',
    delegate: prisma.caseMilestone,
    searchFields: ['milestoneName', 'status', 'caseId'],
    orderBy: { createdAt: 'desc' },
    defaultSelect: { id: true, caseId: true, milestoneName: true, targetDate: true, completedDate: true, status: true, createdAt: true },
    prepareCreate: async (fields) => ({
      caseId: stringOr(fields.caseId, await getDefaultCaseId()),
      milestoneName: stringOr(fields.milestoneName || fields.name, 'First Response'),
      targetDate: dateOr(fields.targetDate || fields.dueDate, new Date(Date.now() + 4 * 60 * 60 * 1000)),
      completedDate: dateOrNull(fields.completedDate),
      status: enumValue(fields.status, ['OPEN', 'COMPLETED', 'VIOLATED'], 'OPEN'),
    }),
    prepareUpdate: (fields) => pickDefined({
      milestoneName: stringOrUndefined(fields.milestoneName || fields.name),
      targetDate: fields.targetDate === undefined && fields.dueDate === undefined ? undefined : dateOr(fields.targetDate || fields.dueDate, new Date()),
      completedDate: fields.completedDate === undefined ? undefined : dateOrNull(fields.completedDate),
      status: fields.status ? enumValue(fields.status, ['OPEN', 'COMPLETED', 'VIOLATED'], 'OPEN') : undefined,
    }),
  },
} as const satisfies Record<string, EntityConfig>;

const ENTITY_ALIASES: Record<string, EntityKey> = {
  leads: 'lead',
  lead: 'lead',
  contacts: 'contact',
  contact: 'contact',
  clients: 'client',
  accounts: 'client',
  account: 'client',
  client: 'client',
  opportunities: 'opportunity',
  opportunity: 'opportunity',
  deals: 'opportunity',
  deal: 'opportunity',
  tasks: 'task',
  task: 'task',
  cases: 'case',
  case: 'case',
  products: 'product',
  product: 'product',
  email_templates: 'email_template',
  email_template: 'email_template',
  templates: 'email_template',
  notifications: 'notification',
  notification: 'notification',
  notes: 'note',
  note: 'note',
  audit: 'field_history',
  audit_trail: 'field_history',
  field_history: 'field_history',
  history: 'field_history',
  opportunity_contact_roles: 'opportunity_contact_role',
  opportunity_contact_role: 'opportunity_contact_role',
  contact_roles: 'opportunity_contact_role',
  buying_committee: 'opportunity_contact_role',
  case_queues: 'case_queue',
  case_queue: 'case_queue',
  queues: 'case_queue',
  queue: 'case_queue',
  case_milestones: 'case_milestone',
  case_milestone: 'case_milestone',
  milestones: 'case_milestone',
  milestone: 'case_milestone',
};

const TOOL_SCHEMA = `Return one JSON object only:
{
  "tool": "app_summary" | "list_records" | "find_records" | "create_record" | "update_record" | "delete_record" | "pipeline_summary" | "noop",
  "entity": "lead" | "contact" | "client" | "opportunity" | "task" | "case" | "product" | "email_template" | "notification" | "note" | "field_history" | "opportunity_contact_role" | "case_queue" | "case_milestone",
  "args": {
    "query": "search text",
    "id": "record id for update/delete",
    "limit": 10,
    "fields": { "name": "...", "email": "...", "status": "...", "amount": 1000 }
  },
  "summary": "short explanation"
}

Rules:
- Use create_record when the user asks to add, create, log, schedule, open, or make a row/record.
- Use update_record when the user asks to change status, edit, mark read, close, complete, or modify an existing record by id.
- Use list_records for "show/list recent/all".
- Use find_records for search by name/email/company/subject.
- Use delete_record only if the user explicitly says delete/remove and provides an id.
- If information is missing, still choose the closest entity and put available fields in args.fields; the backend fills safe defaults.
- Do not invent ids.`;

export async function POST(req: NextRequest) {
  const auth = await authForAI();
  if (auth instanceof Response) return auth;

  try {
    const body = await req.json() as { message?: string; conversationId?: string };
    const message = String(body.message || '').trim();
    if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 });

    const plan = await planFromAI(message, body.conversationId, auth.userId);
    const normalizedPlan = normalizePlan(plan, message);
    const result = await executeTool(normalizedPlan, auth.userId);

    return NextResponse.json({
      plan: normalizedPlan,
      data: result.data,
      response: formatResponse(normalizedPlan, result.data),
      route: result.route,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Assistant failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function planFromAI(message: string, conversationId: string | undefined, userId: string): Promise<AgentPlan> {
  const counts = await getAppCounts();
  const prompt = `User message: ${message}

Current app counts: ${JSON.stringify(counts)}
Available entities: ${Object.keys(ENTITY_CONFIG).join(', ')}

${TOOL_SCHEMA}`;

  return runAI<AgentPlan>({ userId }, prompt, {
    feature: 'floating-app-assistant',
    systemPrompt: 'You are a Salesforce-style CRM app operator. Convert natural language into one safe CRM action JSON object. Return valid JSON only.',
    json: true,
    temperature: 0.1,
    maxTokens: 900,
    inputPayload: { message, conversationId },
  });
}

function normalizePlan(plan: AgentPlan, message: string): AgentPlan {
  const fallbackEntity = inferEntity(message);
  const tool = isTool(plan.tool) ? plan.tool : inferTool(message);
  const entity = normalizeEntity(plan.entity) || fallbackEntity;
  const args = isRecord(plan.args) ? plan.args : {};

  return {
    tool,
    entity,
    args,
    summary: plan.summary || `Running ${tool.replace(/_/g, ' ')}${entity ? ` for ${ENTITY_CONFIG[entity].label}` : ''}.`,
  };
}

async function executeTool(plan: AgentPlan, userId: string) {
  if (plan.tool === 'app_summary') {
    return { data: await getAppCounts(), route: '/dashboard' };
  }

  if (plan.tool === 'pipeline_summary') {
    const opportunities = await prisma.opportunity.findMany({ select: { stage: true, amount: true, probability: true } });
    const byStage: Record<string, { count: number; amount: number; weighted: number }> = {};
    opportunities.forEach((opportunity) => {
      const stage = String(opportunity.stage || 'UNKNOWN');
      if (!byStage[stage]) byStage[stage] = { count: 0, amount: 0, weighted: 0 };
      byStage[stage].count += 1;
      byStage[stage].amount += Number(opportunity.amount || 0);
      byStage[stage].weighted += Number(opportunity.amount || 0) * (Number(opportunity.probability || 0) / 100);
    });
    return { data: { byStage }, route: '/opportunities' };
  }

  if (plan.tool === 'noop') {
    return { data: { message: plan.summary || 'I can help create, update, search, and summarize CRM records.' }, route: '/dashboard' };
  }

  const entity = plan.entity;
  if (!entity) throw new Error('I need a CRM object, such as lead, contact, opportunity, task, case, product, email template, notification, note, field history, opportunity contact role, case queue, or case milestone.');
  const config: EntityConfig = ENTITY_CONFIG[entity];
  const delegate = config.delegate as RuntimeDelegate;
  const args = isRecord(plan.args) ? plan.args : {};

  if (plan.tool === 'list_records') {
    const rows = await delegate.findMany({
      take: Math.min(50, numberOr(args.limit, 10)),
      orderBy: config.orderBy,
      select: config.defaultSelect,
    });
    return { data: { records: rows }, route: config.route };
  }

  if (plan.tool === 'find_records') {
    const query = String(args.query || args.q || '').trim();
    const rows = await delegate.findMany({
      where: query ? buildSearchWhere(config.searchFields, query) : {},
      take: Math.min(50, numberOr(args.limit, 10)),
      orderBy: config.orderBy,
      select: config.defaultSelect,
    });
    return { data: { query, records: rows }, route: config.route };
  }

  if (plan.tool === 'create_record') {
    if (!config.prepareCreate || !delegate.create) throw new Error(`${config.label} creation is not supported by the assistant yet.`);
    const fields = isRecord(args.fields) ? args.fields : args;
    const data = await config.prepareCreate(fields, userId);
    ensureRequiredDefaults(entity, data);
    const record = await delegate.create({ data });
    return { data: { created: true, recordType: config.label, record }, route: config.route };
  }

  if (plan.tool === 'update_record') {
    if (!config.prepareUpdate || !delegate.update) throw new Error(`${config.label} update is not supported by the assistant yet.`);
    const id = String(args.id || '');
    if (!id) throw new Error(`I need the ${config.label} id to update that record.`);
    const fields = isRecord(args.fields) ? args.fields : args;
    const data = config.prepareUpdate(fields);
    const record = await delegate.update({ where: { id }, data });
    return { data: { updated: true, recordType: config.label, record }, route: `${config.route}/${id}` };
  }

  if (plan.tool === 'delete_record') {
    if (!delegate.delete) throw new Error(`${config.label} delete is not supported by the assistant yet.`);
    const id = String(args.id || '');
    if (!id) throw new Error(`I need the ${config.label} id to delete that record.`);
    await delegate.delete({ where: { id } });
    return { data: { deleted: true, recordType: config.label, id }, route: config.route };
  }

  return { data: { message: 'No action was executed.' }, route: '/dashboard' };
}

function formatResponse(plan: AgentPlan, data: unknown) {
  if (isRecord(data) && data.error) return `I could not complete that: ${String(data.error)}`;
  const label = plan.entity ? ENTITY_CONFIG[plan.entity].label : 'CRM';

  if (plan.tool === 'create_record') return `Created ${label}. The new row is now available in ${ENTITY_CONFIG[plan.entity as EntityKey].route}.`;
  if (plan.tool === 'update_record') return `Updated ${label}.`;
  if (plan.tool === 'delete_record') return `Deleted ${label}.`;
  if (plan.tool === 'find_records' || plan.tool === 'list_records') {
    const records = isRecord(data) && Array.isArray(data.records) ? data.records : [];
    return `Found ${records.length} ${label.toLowerCase()} record${records.length === 1 ? '' : 's'}.`;
  }
  if (plan.tool === 'pipeline_summary') return 'Generated a pipeline summary by stage.';
  if (plan.tool === 'app_summary') return 'Here is the current CRM app summary.';
  return plan.summary || 'Done.';
}

async function getAppCounts() {
  const [clients, leads, contacts, opportunities, tasks, cases, products, emailTemplates, notifications, notes, fieldHistory, opportunityContactRoles, caseQueues, caseMilestones] = await Promise.all([
    prisma.clientCompany.count(),
    prisma.lead.count(),
    prisma.contact.count(),
    prisma.opportunity.count(),
    prisma.task.count(),
    prisma.case.count(),
    prisma.product.count(),
    prisma.emailTemplate.count(),
    prisma.notification.count(),
    prisma.note.count(),
    prisma.fieldHistory.count(),
    prisma.opportunityContactRole.count(),
    prisma.caseQueue.count(),
    prisma.caseMilestone.count(),
  ]);

  return { clients, leads, contacts, opportunities, tasks, cases, products, emailTemplates, notifications, notes, fieldHistory, opportunityContactRoles, caseQueues, caseMilestones };
}

function buildSearchWhere(fields: string[], query: string): Prisma.Enumerable<Prisma.JsonObject> {
  return {
    OR: fields.map((field) => ({ [field]: { contains: query, mode: 'insensitive' } })),
  } as unknown as Prisma.Enumerable<Prisma.JsonObject>;
}

function inferTool(message: string): AgentTool {
  const text = message.toLowerCase();
  if (/\b(create|add|new|log|schedule|open)\b/.test(text)) return 'create_record';
  if (/\b(update|edit|change|mark|complete|close)\b/.test(text)) return 'update_record';
  if (/\b(delete|remove)\b/.test(text)) return 'delete_record';
  if (/\b(find|search|look up)\b/.test(text)) return 'find_records';
  if (/\b(pipeline|forecast)\b/.test(text)) return 'pipeline_summary';
  if (/\b(summary|count|how many|dashboard)\b/.test(text)) return 'app_summary';
  return 'list_records';
}

function inferEntity(message: string): EntityKey | undefined {
  const text = message.toLowerCase().replace(/[\s-]+/g, '_');
  for (const [alias, entity] of Object.entries(ENTITY_ALIASES)) {
    if (text.includes(alias)) return entity;
  }
  return undefined;
}

function normalizeEntity(entity: unknown): EntityKey | undefined {
  if (!entity) return undefined;
  return ENTITY_ALIASES[String(entity).toLowerCase().replace(/[\s-]+/g, '_')];
}

function isTool(tool: unknown): tool is AgentTool {
  return ['app_summary', 'list_records', 'find_records', 'create_record', 'update_record', 'delete_record', 'pipeline_summary', 'noop'].includes(String(tool));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function getDefaultClientId() {
  const client = await prisma.clientCompany.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true } });
  if (!client?.id) throw new Error('No client exists yet. Create a client/account first.');
  return client.id;
}

async function getDefaultContactId() {
  const contact = await prisma.contact.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true } });
  if (!contact?.id) throw new Error('No contact exists yet. Create a contact first.');
  return contact.id;
}

async function getDefaultOpportunityId() {
  const opportunity = await prisma.opportunity.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true } });
  if (!opportunity?.id) throw new Error('No opportunity exists yet. Create an opportunity first.');
  return opportunity.id;
}

async function getDefaultCaseId() {
  const caseRecord = await prisma.case.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true } });
  if (!caseRecord?.id) throw new Error('No case exists yet. Create a case first.');
  return caseRecord.id;
}

async function getDefaultLeadId() {
  const lead = await prisma.lead.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true } });
  if (!lead?.id) throw new Error('No lead exists yet. Create a lead first.');
  return lead.id;
}

async function getDefaultObjectId(objectType: string) {
  if (objectType === 'Contact') return getDefaultContactId();
  if (objectType === 'Opportunity') return getDefaultOpportunityId();
  return getDefaultLeadId();
}

async function nextCaseNumber() {
  const count = await prisma.case.count();
  return `CS-${String(count + 1).padStart(6, '0')}`;
}

function ensureRequiredDefaults(entity: EntityKey, data: Record<string, unknown>) {
  if (entity === 'contact') {
    if (!data.firstName && !data.lastName) data.firstName = 'New';
    if (!data.lastName) data.lastName = 'Contact';
  }
}

function splitContactName(fields: Record<string, unknown>) {
  if ((!fields.firstName || !fields.lastName) && fields.name) {
    const parts = String(fields.name).trim().split(/\s+/);
    fields.firstName = fields.firstName || parts.shift() || 'New';
    fields.lastName = fields.lastName || parts.join(' ') || 'Contact';
  }
  return fields;
}

function pickDefined(input: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}

function stringOr(value: unknown, fallback: string) {
  const text = value === undefined || value === null ? '' : String(value).trim();
  return text || fallback;
}

function stringOrUndefined(value: unknown) {
  if (value === undefined) return undefined;
  const text = value === null ? '' : String(value).trim();
  return text || undefined;
}

function nullableString(value: unknown) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  return String(value).trim();
}

function nullableStringOrUndefined(value: unknown) {
  if (value === undefined) return undefined;
  return nullableString(value);
}

function numberOr(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function dateOrNull(value: unknown) {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateOr(value: unknown, fallback: Date) {
  if (!value) return fallback;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function enumValue(value: unknown, allowed: string[], fallback: string) {
  const normalized = String(value || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  return allowed.includes(normalized) ? normalized : fallback;
}

function stringArray(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  if (typeof value === 'string' && value.trim()) return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}

function objectTypeValue(value: unknown, fallback: string) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized.includes('contact')) return 'Contact';
  if (normalized.includes('opportunity') || normalized.includes('deal')) return 'Opportunity';
  if (normalized.includes('lead')) return 'Lead';
  return fallback;
}
