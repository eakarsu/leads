import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const coreObjects = ['Lead', 'Contact', 'Opportunity', 'Case', 'Account'];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [
    recordTypes,
    pageLayouts,
    sharingRules,
    roles,
    permissionSets,
    permissionAssignments,
    webhookSubscriptions,
    validationRules,
    processFlows,
  ] = await Promise.all([
    prisma.recordType.findMany({ orderBy: [{ objectType: 'asc' }, { name: 'asc' }] }),
    prisma.pageLayout.findMany({ orderBy: [{ objectType: 'asc' }, { name: 'asc' }] }),
    prisma.sharingRule.findMany({ orderBy: [{ objectType: 'asc' }, { name: 'asc' }] }),
    prisma.role.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { users: true, childRoles: true } } } }),
    prisma.permissionSet.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { assignments: true } } } }),
    prisma.permissionSetAssignment.count(),
    prisma.webhookSubscription.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
    prisma.validationRule.count(),
    prisma.processFlow.count(),
  ]);

  const coverage = {
    recordTypes: coverageFor(coreObjects, recordTypes.map((item) => item.objectType)),
    pageLayouts: coverageFor(coreObjects, pageLayouts.map((item) => item.objectType)),
    sharingRules: coverageFor(['Lead', 'Opportunity', 'Case'], sharingRules.map((item) => item.objectType)),
    permissionSets: permissionSets.length,
    roleHierarchy: roles.length,
    webhooks: webhookSubscriptions.length,
    validationRules,
    processFlows,
  };

  const checks = [
    { key: 'record-types', label: 'Record Types', complete: coverage.recordTypes.percent >= 80, detail: `${coverage.recordTypes.present.length}/${coreObjects.length} core objects covered` },
    { key: 'page-layouts', label: 'Page Layouts', complete: coverage.pageLayouts.percent >= 80, detail: `${coverage.pageLayouts.present.length}/${coreObjects.length} core objects covered` },
    { key: 'sharing', label: 'Sharing Rules', complete: coverage.sharingRules.percent >= 67, detail: `${coverage.sharingRules.present.length}/3 controlled objects covered` },
    { key: 'permissions', label: 'Permission Sets', complete: permissionSets.length >= 3, detail: `${permissionSets.length} permission sets` },
    { key: 'roles', label: 'Role Hierarchy', complete: roles.length >= 3, detail: `${roles.length} roles` },
    { key: 'webhooks', label: 'Webhook Subscriptions', complete: webhookSubscriptions.length >= 1, detail: `${webhookSubscriptions.length} active/inactive subscriptions shown` },
    { key: 'automation', label: 'Automation Controls', complete: validationRules + processFlows >= 3, detail: `${validationRules} validation rules, ${processFlows} process flows` },
  ];

  const completenessScore = Math.round((checks.filter((check) => check.complete).length / checks.length) * 100);

  return NextResponse.json({
    completenessScore,
    checks,
    coverage,
    recordTypes,
    pageLayouts,
    sharingRules,
    roles,
    permissionSets,
    permissionAssignments,
    webhookSubscriptions,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { pack = 'enterprise-salesforce-parity' } = await req.json().catch(() => ({}));
  if (pack !== 'enterprise-salesforce-parity') {
    return NextResponse.json({ error: 'Unsupported setup pack' }, { status: 400 });
  }

  const created = {
    recordTypes: await ensureRecordTypes(),
    pageLayouts: await ensurePageLayouts(),
    roles: await ensureRoles(),
    permissionSets: await ensurePermissionSets(),
    sharingRules: await ensureSharingRules(),
    webhookSubscriptions: await ensureWebhooks(session.user.id),
  };

  return NextResponse.json({ applied: true, created });
}

function coverageFor(required: string[], presentValues: string[]) {
  const presentSet = new Set(presentValues);
  const present = required.filter((item) => presentSet.has(item));
  const missing = required.filter((item) => !presentSet.has(item));
  return { present, missing, percent: Math.round((present.length / required.length) * 100) };
}

async function ensureRecordTypes() {
  const definitions = [
    { objectType: 'Lead', name: 'Inbound', description: 'Inbound demand and web-submitted leads.', isDefault: true },
    { objectType: 'Lead', name: 'Outbound', description: 'Sales-sourced outbound leads.', isDefault: false },
    { objectType: 'Opportunity', name: 'New Business', description: 'Net-new revenue motion.', isDefault: true },
    { objectType: 'Opportunity', name: 'Renewal', description: 'Renewal and expansion motion.', isDefault: false },
    { objectType: 'Case', name: 'Customer Support', description: 'Customer support service request.', isDefault: true },
    { objectType: 'Contact', name: 'Buyer', description: 'Decision maker, influencer, or champion.', isDefault: true },
    { objectType: 'Account', name: 'Customer Account', description: 'Customer, partner, or prospect account.', isDefault: true },
  ];

  const out = [];
  for (const definition of definitions) {
    const item = await prisma.recordType.upsert({
      where: { objectType_name: { objectType: definition.objectType, name: definition.name } },
      update: definition,
      create: definition,
    });
    out.push(item);
  }
  return out;
}

async function ensurePageLayouts() {
  const definitions = coreObjects.map((objectType) => ({
    name: `${objectType} Revenue Layout`,
    objectType,
    layoutConfig: {
      sections: [
        { label: 'Highlights', fields: ['name', 'status', 'ownerId'], columns: 3 },
        { label: 'Qualification', fields: ['source', 'score', 'stage', 'priority'], columns: 2 },
        { label: 'Activity', relatedLists: ['tasks', 'events', 'notes', 'files'] },
      ],
    },
    isDefault: true,
  }));

  const out = [];
  for (const definition of definitions) {
    const existing = await prisma.pageLayout.findFirst({
      where: { objectType: definition.objectType, name: definition.name },
    });
    const item = existing
      ? await prisma.pageLayout.update({ where: { id: existing.id }, data: definition })
      : await prisma.pageLayout.create({ data: definition });
    out.push(item);
  }
  return out;
}

async function ensureRoles() {
  const ceo = await upsertRole('CEO', 'CEO', null, true);
  const vpSales = await upsertRole('VP_Sales', 'VP Sales', ceo.id, true);
  const salesManager = await upsertRole('Sales_Manager', 'Sales Manager', vpSales.id, true);
  const serviceManager = await upsertRole('Service_Manager', 'Service Manager', ceo.id, false);
  return [ceo, vpSales, salesManager, serviceManager];
}

async function upsertRole(name: string, label: string, parentRoleId: string | null, allowForecast: boolean) {
  const existing = await prisma.role.findUnique({ where: { name } });
  const data = {
    name,
    label,
    parentRoleId,
    allowForecast,
    caseAccessLevel: 'READ_WRITE_TRANSFER',
    opportunityAccessLevel: allowForecast ? 'READ_WRITE_TRANSFER' : 'READ_ONLY',
    contactAccessLevel: 'CONTROLLED_BY_PARENT',
  };
  return existing
    ? prisma.role.update({ where: { id: existing.id }, data })
    : prisma.role.create({ data });
}

async function ensurePermissionSets() {
  const definitions = [
    {
      name: 'Sales_Operations_Admin',
      label: 'Sales Operations Admin',
      description: 'Manage core sales objects, forecasts, reports, and dashboards.',
      permissions: {
        objects: { Lead: 'CRUD', Contact: 'CRUD', Opportunity: 'CRUD', Campaign: 'CRUD', Report: 'CRUD' },
        setup: ['validationRules', 'workflows', 'dashboards'],
      },
    },
    {
      name: 'Service_Manager_Access',
      label: 'Service Manager Access',
      description: 'Manage cases, knowledge, entitlements, and service dashboards.',
      permissions: {
        objects: { Case: 'CRUD', Contact: 'READ', Knowledge: 'CRUD', Entitlement: 'CRUD' },
        setup: ['queues', 'serviceDashboards'],
      },
    },
    {
      name: 'Agentforce_Operator',
      label: 'Agentforce Operator',
      description: 'Run approved AI agent actions and review AI history.',
      permissions: {
        objects: { Lead: 'UPDATE', Opportunity: 'UPDATE', Task: 'CREATE' },
        ai: ['agentActions', 'aiHistory', 'setupRecommendations'],
      },
    },
  ];

  const out = [];
  for (const definition of definitions) {
    const existing = await prisma.permissionSet.findUnique({ where: { name: definition.name } });
    const item = existing
      ? await prisma.permissionSet.update({ where: { id: existing.id }, data: { ...definition, isCustom: true } })
      : await prisma.permissionSet.create({ data: { ...definition, isCustom: true } });
    out.push(item);
  }
  return out;
}

async function ensureSharingRules() {
  const definitions = [
    {
      name: 'Share Qualified Leads With Sales Managers',
      objectType: 'Lead',
      description: 'Managers can edit qualified leads for coaching and routing.',
      sharedFrom: 'Sales_Manager',
      sharedFromType: 'ROLE',
      sharedTo: 'VP_Sales',
      sharedToType: 'ROLE',
      accessLevel: 'EDIT',
      criteria: { status: ['QUALIFIED'], qualificationScore: { gte: 70 } },
    },
    {
      name: 'Share Large Opportunities With VP Sales',
      objectType: 'Opportunity',
      description: 'Executive review for high-value opportunities.',
      sharedFrom: 'Sales_Manager',
      sharedFromType: 'ROLE',
      sharedTo: 'VP_Sales',
      sharedToType: 'ROLE',
      accessLevel: 'EDIT',
      criteria: { amount: { gte: 50000 } },
    },
    {
      name: 'Share Escalated Cases With Service Managers',
      objectType: 'Case',
      description: 'Service managers can edit escalated cases.',
      sharedFrom: 'Service_Manager',
      sharedFromType: 'ROLE',
      sharedTo: 'CEO',
      sharedToType: 'ROLE',
      accessLevel: 'EDIT',
      criteria: { priority: ['HIGH', 'CRITICAL'], status: ['ESCALATED'] },
    },
  ];

  const out = [];
  for (const definition of definitions) {
    const existing = await prisma.sharingRule.findFirst({ where: { name: definition.name, objectType: definition.objectType } });
    const item = existing
      ? await prisma.sharingRule.update({ where: { id: existing.id }, data: { ...definition, isActive: true } })
      : await prisma.sharingRule.create({ data: { ...definition, isActive: true } });
    out.push(item);
  }
  return out;
}

async function ensureWebhooks(userId: string) {
  const definitions = [
    {
      name: 'Revenue Ops Event Bus',
      url: 'https://example.test/webhooks/revenue-ops',
      events: ['lead.created', 'lead.updated', 'opportunity.updated', 'task.created'],
      createdBy: userId,
      isActive: false,
    },
    {
      name: 'Security Event Monitor',
      url: 'https://example.test/webhooks/security-events',
      events: ['user.updated', 'permission.assigned', 'ai.agent_action'],
      createdBy: userId,
      isActive: false,
    },
  ];

  const out = [];
  for (const definition of definitions) {
    const existing = await prisma.webhookSubscription.findFirst({ where: { name: definition.name } });
    const item = existing
      ? await prisma.webhookSubscription.update({ where: { id: existing.id }, data: definition })
      : await prisma.webhookSubscription.create({ data: definition });
    out.push(item);
  }
  return out;
}
