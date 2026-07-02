import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const samplePeople = [
  ['Avery Stone', 'Avery', 'Stone', 'avery.stone@example.test', 'Northstar Retail'],
  ['Maya Chen', 'Maya', 'Chen', 'maya.chen@example.test', 'Veridian Health'],
  ['Jordan Reed', 'Jordan', 'Reed', 'jordan.reed@example.test', 'Apex Manufacturing'],
  ['Sofia Martin', 'Sofia', 'Martin', 'sofia.martin@example.test', 'Atlas Financial'],
  ['Noah Patel', 'Noah', 'Patel', 'noah.patel@example.test', 'Summit Software'],
];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [clients, leads, contacts, opportunities] = await Promise.all([
    prisma.clientCompany.count(),
    prisma.lead.count(),
    prisma.contact.count(),
    prisma.opportunity.count(),
  ]);

  const preview = await prisma.lead.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, fullName: true, email: true, phone: true, company: true },
  });

  return NextResponse.json({
    counts: { clients, leads, contacts, opportunities },
    preview: preview.map((lead, index) => maskLead(lead, index)),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { action = 'seed', count = 5 } = await req.json().catch(() => ({}));

  if (action === 'preview-mask') {
    const leads = await prisma.lead.findMany({
      take: Math.min(25, Math.max(1, Number(count) || 5)),
      orderBy: { createdAt: 'desc' },
      select: { id: true, fullName: true, email: true, phone: true, company: true },
    });
    return NextResponse.json({ action, records: leads.map(maskLead) });
  }

  if (action !== 'seed') {
    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  }

  const created = await seedSafeData(session.user.id, Math.min(25, Math.max(1, Number(count) || 5)));
  return NextResponse.json({ action, created });
}

async function seedSafeData(userId: string, count: number) {
  const client = await prisma.clientCompany.create({
    data: {
      name: `Safe Demo Account ${new Date().toISOString().slice(0, 10)}`,
      industry: 'Technology',
      businessSector: 'B2B_SAAS',
      website: 'https://example.test',
      contactName: 'Demo Owner',
      contactEmail: 'demo.owner@example.test',
      contactPhone: '555-0100',
      notes: 'Synthetic account created by Data Mask & Seed.',
      type: 'Prospect',
    },
  });

  const campaign = await prisma.campaign.create({
    data: {
      clientId: client.id,
      name: 'Safe Demo Demand Campaign',
      description: 'Synthetic campaign for demos and QA.',
      status: 'ACTIVE',
      channel: 'MULTI_CHANNEL',
      targetPersona: 'Operations and revenue leaders',
      targetRegions: 'US',
      ownerId: userId,
    },
  });

  const leads = [];
  const contacts = [];
  const opportunities = [];
  for (let index = 0; index < count; index++) {
    const person = samplePeople[index % samplePeople.length];
    const lead = await prisma.lead.create({
      data: {
        clientId: client.id,
        campaignId: campaign.id,
        fullName: `${person[0]} ${index + 1}`,
        company: person[4],
        title: index % 2 === 0 ? 'VP Operations' : 'Revenue Director',
        email: person[3].replace('@', `+${index + 1}@`),
        phone: `555-01${String(index).padStart(2, '0')}`,
        leadSource: 'IMPORTED',
        submittedBy: userId,
        status: index % 3 === 0 ? 'QUALIFIED' : 'NEW',
        qualificationScore: 60 + ((index * 7) % 35),
        notes: 'Synthetic lead created for safe testing.',
        customFields: { synthetic: true, source: 'data-mask-seed' },
      },
    });
    leads.push(lead);

    const contact = await prisma.contact.create({
      data: {
        clientId: client.id,
        leadId: lead.id,
        firstName: person[1],
        lastName: `${person[2]} ${index + 1}`,
        email: lead.email,
        phone: lead.phone,
        title: lead.title,
        ownerId: userId,
        notes: 'Synthetic contact created for safe testing.',
      },
    });
    contacts.push(contact);

    const opportunity = await prisma.opportunity.create({
      data: {
        clientId: client.id,
        contactId: contact.id,
        leadId: lead.id,
        name: `${person[4]} Demo Opportunity ${index + 1}`,
        stage: index % 2 === 0 ? 'QUALIFICATION' : 'PROPOSAL',
        amount: 25000 + index * 7500,
        probability: 35 + index * 5,
        expectedCloseDate: new Date(Date.now() + (20 + index * 5) * 24 * 60 * 60 * 1000),
        ownerId: userId,
        description: 'Synthetic opportunity created for safe testing.',
        nextSteps: 'Run demo workflow and validate reporting.',
      },
    });
    opportunities.push(opportunity);
  }

  return { client, campaign, leads, contacts, opportunities };
}

function maskLead(lead: any, index = 0) {
  return {
    ...lead,
    fullName: `Masked Lead ${index + 1}`,
    email: `masked.lead.${index + 1}@example.test`,
    phone: lead.phone ? '555-0100' : null,
    company: lead.company ? `Masked Company ${index + 1}` : null,
  };
}
