import { AssignmentMethod, CaseOrigin, CasePriority, ContactRole, NotificationType, OpportunityStage } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const names = [
  'Acme Corporation',
  'Northstar Health',
  'Pioneer Manufacturing',
  'Summit Financial',
  'Urban Retail Group',
  'BluePeak Software',
  'Harbor Logistics',
  'Keystone Legal',
  'Evergreen Energy',
  'Atlas Telecom',
  'Canyon BioLabs',
  'Metro Hospitality',
  'Cobalt Insurance',
  'Vertex Media',
  'BrightPath Education',
];

export async function ensureDefaultEmailTemplates() {
  const templates = [
    ['Prospecting Intro', 'Quick question about {{company}}', 'Sales Outreach'],
    ['Post Demo Follow-up', 'Next steps from our demo', 'Sales Outreach'],
    ['Renewal Reminder', 'Upcoming renewal for {{company}}', 'Renewals'],
    ['Case Resolution', 'Your support case has been resolved', 'Service'],
    ['Onboarding Welcome', 'Welcome to LeadGenFlow AI', 'Onboarding'],
    ['Meeting Confirmation', 'Confirming our meeting', 'Sales Outreach'],
    ['Executive Check-in', 'Executive follow-up for {{company}}', 'Customer Success'],
    ['Contract Sent', 'Contract ready for review', 'Sales Operations'],
    ['Invoice Reminder', 'Invoice reminder for {{company}}', 'Finance'],
    ['Product Update', 'New capabilities available', 'Marketing'],
    ['Trial Ending', 'Your trial is ending soon', 'Lifecycle'],
    ['Reactivation', 'Can we reconnect?', 'Marketing'],
    ['Partner Intro', 'Partner program introduction', 'Partner'],
    ['Security Review', 'Security review documents', 'Enterprise'],
    ['Implementation Kickoff', 'Implementation kickoff agenda', 'Implementation'],
  ];

  const existing = await prisma.emailTemplate.findMany({ select: { name: true } });
  const existingNames = new Set(existing.map((item) => item.name));
  const missing = templates.filter(([name]) => !existingNames.has(name));
  if (!missing.length) return;

  await prisma.emailTemplate.createMany({
    data: missing.map(([name, subject, category]) => ({
      name,
      subject,
      category,
      isActive: true,
      body: `Hi {{firstName}},\n\n${subject}. This template was seeded so the CRM feature has realistic test data.\n\nBest,\n{{senderName}}`,
    })),
  });
}

export async function ensureDefaultWorkflowRules() {
  const rules = names.map((name, index) => ({
    name: `${name} Workflow Rule`,
    description: `Automation rule for ${name} sales and service operations.`,
    objectType: ['Lead', 'Opportunity', 'Case', 'Contact', 'Account'][index % 5],
    triggerType: ['CREATE', 'UPDATE', 'STATUS_CHANGE'][index % 3],
    conditions: { field: ['status', 'stage', 'priority', 'industry'][index % 4], operator: 'equals', value: ['NEW', 'QUALIFIED', 'HIGH', 'SaaS'][index % 4] },
    actions: { type: ['CREATE_TASK', 'SEND_EMAIL', 'UPDATE_FIELD', 'NOTIFY_OWNER'][index % 4], target: 'owner', value: `Seeded action ${index + 1}` },
    isActive: index % 5 !== 0,
    priority: 100 - index,
  }));

  const existing = await prisma.workflowRule.findMany({ select: { name: true } });
  const existingNames = new Set(existing.map((item) => item.name));
  const missing = rules.filter((rule) => !existingNames.has(rule.name));
  if (!missing.length) return;
  await prisma.workflowRule.createMany({ data: missing });
}

export async function ensureDefaultLeadAssignmentRules(userId: string) {
  const rules = names.map((name, index) => ({
    name: `${name} Assignment Rule`,
    description: `Routes ${name} leads based on source, region, and qualification score.`,
    criteria: { conditions: [{ field: ['leadSource', 'qualificationScore', 'company', 'status'][index % 4], operator: index % 2 ? 'gte' : 'equals', value: index % 2 ? '70' : 'WEB' }] },
    assignmentMethod: [AssignmentMethod.ROUND_ROBIN, AssignmentMethod.LOAD_BALANCED, AssignmentMethod.MANUAL][index % 3],
    assignToUserIds: [userId],
    isActive: true,
    priority: 200 - index,
  }));

  const existing = await prisma.leadAssignmentRule.findMany({ select: { name: true } });
  const existingNames = new Set(existing.map((item) => item.name));
  const missing = rules.filter((rule) => !existingNames.has(rule.name));
  if (!missing.length) return;
  await prisma.leadAssignmentRule.createMany({ data: missing });
}

export async function ensureDefaultChatterGroups(userId: string) {
  const groups = [
    'Sales Strategy',
    'Enterprise Deals',
    'Customer Success',
    'Support Escalations',
    'Product Feedback',
    'Marketing Campaigns',
    'Partner Channel',
    'Revenue Operations',
    'Implementation Team',
    'Security Reviews',
    'Renewals Desk',
    'Data Quality',
    'AI Studio Builders',
    'Field Service Dispatch',
    'Executive Updates',
  ];

  const existing = await prisma.chatterGroup.findMany({ select: { id: true, name: true } });
  const existingNames = new Set(existing.map((item) => item.name));
  const created = await Promise.all(groups.filter((name) => !existingNames.has(name)).map((name, index) => prisma.chatterGroup.create({
    data: {
      name,
      description: `${name} collaboration group seeded for realistic Chatter testing.`,
      isPublic: index % 4 !== 0,
      isArchived: false,
      ownerId: userId,
      members: { create: { userId, role: 'OWNER' } },
    },
  })));

  const allGroups = [...existing, ...created];
  await prisma.$transaction(allGroups.slice(0, 15).map((group) => prisma.groupMember.upsert({
    where: { groupId_userId: { groupId: group.id, userId } },
    update: {},
    create: { groupId: group.id, userId, role: 'MEMBER' },
  })));
}

export async function ensureDefaultNotifications(userId: string) {
  const notifications = names.map((name, index) => ({
    userId,
    type: [NotificationType.SYSTEM, NotificationType.LEAD_ASSIGNED, NotificationType.TASK_ASSIGNED, NotificationType.OPPORTUNITY_WON, NotificationType.EMAIL_RECEIVED, NotificationType.WORKFLOW_TRIGGERED][index % 6],
    title: `${name} Alert`,
    message: `Seed notification ${index + 1} for ${name}. Review the linked CRM activity and follow up if needed.`,
    link: ['/dashboard', '/leads', '/tasks', '/opportunities', '/email-center', '/workflow-rules'][index % 6],
    isRead: index % 3 === 0,
    metadata: { seeded: true, sequence: index + 1 },
  }));

  const existing = await prisma.notification.findMany({ where: { userId }, select: { title: true } });
  const existingTitles = new Set(existing.map((item) => item.title));
  const missing = notifications.filter((item) => !existingTitles.has(item.title));
  if (!missing.length) return;
  await prisma.notification.createMany({ data: missing });
}

export async function ensureDefaultBookingData(userId: string) {
  const calendars = names.map((name, index) => ({
    name: `${name} Booking Calendar`,
    type: ['PERSONAL', 'TEAM', 'SERVICE'][index % 3],
    ownerId: userId,
    duration: [30, 45, 60][index % 3],
    availability: { weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], start: '09:00', end: '17:00', timezone: 'America/New_York' },
  }));

  const existing = await prisma.bookingCalendar.findMany({ select: { id: true, name: true, duration: true } });
  const existingNames = new Set(existing.map((item) => item.name));
  const created = await Promise.all(calendars.filter((calendar) => !existingNames.has(calendar.name)).map((calendar) => prisma.bookingCalendar.create({ data: calendar })));
  const allCalendars = [...existing, ...created];

  const existingBookings = await prisma.booking.findMany({ select: { bookerEmail: true } });
  const existingEmails = new Set(existingBookings.map((item) => item.bookerEmail));
  const bookings = names.map((name, index) => {
    const calendar = allCalendars[index % allCalendars.length];
    const start = new Date(Date.now() + (index + 1) * 86400000);
    start.setHours(9 + (index % 7), index % 2 ? 30 : 0, 0, 0);
    const end = new Date(start.getTime() + calendar.duration * 60000);
    return {
      calendarId: calendar.id,
      bookerName: `${name} Contact`,
      bookerEmail: `booking${index + 1}@example.com`,
      startTime: start,
      endTime: end,
      status: ['CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'][index % 4],
      notes: `Seed booking for ${name}.`,
    };
  }).filter((booking) => !existingEmails.has(booking.bookerEmail));

  if (bookings.length) await prisma.booking.createMany({ data: bookings });
}

export async function ensureDefaultPriceBooks() {
  const products = await ensureDefaultProducts();
  const books = names.map((name, index) => ({
    name: index === 0 ? 'Standard Price Book' : `${name} Price Book`,
    description: `Seeded price book for ${name} sales motions.`,
    isActive: true,
    isStandard: index === 0,
  }));

  const existing = await prisma.priceBook.findMany({ include: { entries: true } });
  const existingNames = new Set(existing.map((item) => item.name));
  const missingBooks = books.filter((book) => !existingNames.has(book.name));
  if (missingBooks.length) await prisma.priceBook.createMany({ data: missingBooks });
  const allBooks = await prisma.priceBook.findMany({ include: { entries: true }, orderBy: { createdAt: 'asc' } });

  for (const book of allBooks.slice(0, 15)) {
    const existingProductIds = new Set(book.entries?.map((entry) => entry.productId) || []);
    const entries = products.slice(0, 5).filter((product) => !existingProductIds.has(product.id)).map((product, index) => ({
      priceBookId: book.id,
      productId: product.id,
      unitPrice: Math.round(product.unitPrice * (1 + index * 0.03)),
      isActive: true,
      useStandardPrice: book.isStandard,
    }));
    if (entries.length) await prisma.priceBookEntry.createMany({ data: entries, skipDuplicates: true });
  }
}

export async function ensureDefaultCaseMilestones(userId: string) {
  const cases = await ensureDefaultCases(userId);
  const milestoneNames = ['First Response', 'Triage Complete', 'Customer Update', 'Engineering Review', 'Resolution Target'];
  const existing = await prisma.caseMilestone.findMany({ select: { caseId: true, milestoneName: true } });
  const existingKeys = new Set(existing.map((item) => `${item.caseId}:${item.milestoneName}`));
  const milestones = cases.slice(0, 15).map((caseRecord, index) => ({
    caseId: caseRecord.id,
    milestoneName: milestoneNames[index % milestoneNames.length],
    targetDate: new Date(Date.now() + (index + 1) * 3600000),
    completedDate: index % 4 === 0 ? new Date() : null,
    status: index % 5 === 0 ? 'VIOLATED' : index % 4 === 0 ? 'COMPLETED' : 'OPEN',
  })).filter((item) => !existingKeys.has(`${item.caseId}:${item.milestoneName}`));
  if (milestones.length) await prisma.caseMilestone.createMany({ data: milestones });
}

export async function ensureDefaultOpportunityContactRoles(userId: string, opportunityId?: string) {
  const clientId = await getDefaultClientId();
  const opportunity = opportunityId
    ? await prisma.opportunity.findUnique({ where: { id: opportunityId }, select: { id: true } })
    : null;
  const opportunities = opportunity ? [opportunity] : await ensureDefaultOpportunities(clientId, userId);
  const contacts = await ensureDefaultContacts(clientId, userId);
  const roles = ['DECISION_MAKER', 'INFLUENCER', 'ECONOMIC_BUYER', 'TECHNICAL_BUYER', 'CHAMPION', 'EVALUATOR', 'END_USER'];
  const targetOpportunity = opportunities[0];
  if (!targetOpportunity) return;

  const existing = await prisma.opportunityContactRole.findMany({
    where: { opportunityId: targetOpportunity.id },
    select: { contactId: true },
  });
  const existingContacts = new Set(existing.map((item) => item.contactId));
  const missing = contacts.slice(0, 15).filter((contact) => !existingContacts.has(contact.id)).map((contact, index) => ({
    opportunityId: targetOpportunity.id,
    contactId: contact.id,
    role: roles[index % roles.length] as ContactRole,
    isPrimary: index === 0,
  }));
  if (missing.length) await prisma.opportunityContactRole.createMany({ data: missing, skipDuplicates: true });
}

async function getDefaultClientId() {
  const client = await prisma.clientCompany.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true } });
  if (client) return client.id;
  const created = await prisma.clientCompany.create({
    data: {
      name: 'Seed CRM Account',
      industry: 'Technology',
      contactName: 'Seed Admin',
      contactEmail: 'seed-account@example.com',
    },
    select: { id: true },
  });
  return created.id;
}

async function ensureDefaultProducts() {
  const clientId = await getDefaultClientId();
  const existing = await prisma.product.findMany({ orderBy: { createdAt: 'asc' } });
  if (existing.length >= 15) return existing;
  const existingNames = new Set(existing.map((item) => item.name));
  const missing = names.filter((name) => !existingNames.has(`${name} Subscription`)).map((name, index) => ({
    clientId,
    name: `${name} Subscription`,
    code: `SKU-${String(index + 1).padStart(3, '0')}`,
    description: `Seed product package for ${name}.`,
    unitPrice: 99 + index * 25,
    category: ['Platform', 'Service', 'Support'][index % 3],
    isActive: true,
  }));
  if (missing.length) await prisma.product.createMany({ data: missing });
  return prisma.product.findMany({ orderBy: { createdAt: 'asc' } });
}

async function ensureDefaultCases(userId: string) {
  const existing = await prisma.case.findMany({ orderBy: { createdAt: 'asc' }, select: { id: true } });
  if (existing.length >= 15) return existing;
  const missing = names.slice(existing.length).map((name, index) => ({
    caseNumber: `CS-SEED-${String(existing.length + index + 1).padStart(4, '0')}`,
    subject: `${name} Support Request`,
    description: `Seed support case for ${name}.`,
    priority: [CasePriority.LOW, CasePriority.MEDIUM, CasePriority.HIGH, CasePriority.CRITICAL][index % 4],
    origin: [CaseOrigin.WEB, CaseOrigin.EMAIL, CaseOrigin.PHONE, CaseOrigin.CHAT][index % 4],
    type: ['Question', 'Bug', 'Billing', 'Feature Request'][index % 4],
    reason: ['User Education', 'Installation', 'Account Issue', 'Product Feedback'][index % 4],
    ownerId: userId,
  }));
  if (missing.length) await prisma.case.createMany({ data: missing });
  return prisma.case.findMany({ orderBy: { createdAt: 'asc' }, select: { id: true } });
}

async function ensureDefaultContacts(clientId: string, userId: string) {
  const existing = await prisma.contact.findMany({ orderBy: { createdAt: 'asc' }, select: { id: true } });
  if (existing.length >= 15) return existing;
  const missing = names.slice(existing.length).map((name, index) => {
    const [firstName, ...rest] = name.split(' ');
    return {
      clientId,
      ownerId: userId,
      firstName,
      lastName: rest.join(' ') || 'Contact',
      email: `contact${existing.length + index + 1}@example.com`,
      phone: `555-03${String(index).padStart(2, '0')}`,
      title: ['CEO', 'VP Sales', 'Operations Lead', 'Procurement Manager'][index % 4],
      isPrimary: index === 0,
    };
  });
  if (missing.length) await prisma.contact.createMany({ data: missing });
  return prisma.contact.findMany({ orderBy: { createdAt: 'asc' }, select: { id: true } });
}

async function ensureDefaultOpportunities(clientId: string, userId: string) {
  const existing = await prisma.opportunity.findMany({ orderBy: { createdAt: 'asc' }, select: { id: true } });
  if (existing.length >= 15) return existing;
  const missing = names.slice(existing.length).map((name, index) => ({
    clientId,
    ownerId: userId,
    name: `${name} Expansion Opportunity`,
    stage: [OpportunityStage.PROSPECTING, OpportunityStage.QUALIFICATION, OpportunityStage.NEEDS_ANALYSIS, OpportunityStage.PROPOSAL, OpportunityStage.NEGOTIATION][index % 5],
    amount: 25000 + index * 7500,
    probability: 20 + (index % 6) * 10,
    expectedCloseDate: new Date(Date.now() + (index + 15) * 86400000),
    description: `Seed opportunity for ${name}.`,
    nextSteps: 'Schedule stakeholder review and confirm commercial fit.',
  }));
  if (missing.length) await prisma.opportunity.createMany({ data: missing });
  return prisma.opportunity.findMany({ orderBy: { createdAt: 'asc' }, select: { id: true } });
}
