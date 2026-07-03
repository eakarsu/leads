import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const DEFAULT_QUEUES = [
  {
    name: 'Tier 1 Support',
    description: 'General intake queue for new web, email, phone, and chat cases.',
  },
  {
    name: 'Priority Support',
    description: 'High-priority and escalated customer issues requiring fast response.',
  },
  {
    name: 'Technical Support',
    description: 'Product defects, integration problems, and advanced troubleshooting.',
  },
  {
    name: 'Billing & Account Support',
    description: 'Invoice, payment, subscription, and account administration cases.',
  },
  {
    name: 'Customer Success',
    description: 'Adoption, onboarding, renewal risk, and proactive customer follow-up.',
  },
  {
    name: 'Enterprise Support',
    description: 'Named-account support for enterprise customers with premium SLAs.',
  },
  {
    name: 'Implementation Support',
    description: 'Configuration, go-live, and deployment assistance for new customers.',
  },
  {
    name: 'Integrations Support',
    description: 'API, CRM integration, SSO, webhook, and data synchronization issues.',
  },
  {
    name: 'Renewals Desk',
    description: 'Renewal questions, contract timing, expansion requests, and churn-risk cases.',
  },
  {
    name: 'Product Feedback',
    description: 'Enhancement requests, usability feedback, and product idea triage.',
  },
  {
    name: 'Security Response',
    description: 'Security, privacy, access, authentication, and compliance-related cases.',
  },
  {
    name: 'Data Operations',
    description: 'Import, export, deduplication, enrichment, and data quality support.',
  },
  {
    name: 'Partner Support',
    description: 'Partner portal, reseller, channel, and implementation partner cases.',
  },
  {
    name: 'Training & Enablement',
    description: 'User education, documentation, adoption, and enablement requests.',
  },
  {
    name: 'Escalation Desk',
    description: 'Executive escalations, breached SLAs, and urgent cross-functional incidents.',
  },
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureDefaultQueues();

    const queues = await prisma.caseQueue.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { cases: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(queues);
  } catch (error) {
    console.error('Error fetching case queues:', error);
    return NextResponse.json({ error: 'Failed to fetch queues' }, { status: 500 });
  }
}

async function ensureDefaultQueues() {
  const existingQueues = await prisma.caseQueue.findMany({
    select: { id: true, name: true },
  });
  const existingNames = new Set(existingQueues.map((queue) => queue.name));
  const missingQueues = DEFAULT_QUEUES.filter((queue) => !existingNames.has(queue.name));
  if (!missingQueues.length && existingQueues.length >= DEFAULT_QUEUES.length) {
    await assignUnqueuedCases(existingQueues);
    return;
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    take: 8,
    select: { id: true },
  });
  const memberIds = users.map((user) => user.id);

  const createdQueues = await Promise.all(
    missingQueues.map((queue) => prisma.caseQueue.create({
      data: {
        ...queue,
        memberIds,
        isActive: true,
      },
    }))
  );

  await assignUnqueuedCases([...existingQueues, ...createdQueues]);
}

async function assignUnqueuedCases(queues: Array<{ id: string; name: string }>) {
  const cases = await prisma.case.findMany({
    where: { queueId: null },
    select: { id: true, priority: true, type: true, reason: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!cases.length || !queues.length) return;

  const queueByName = new Map(queues.map((queue) => [queue.name, queue.id]));
  await prisma.$transaction(
    cases.map((caseRecord, index) => prisma.case.update({
      where: { id: caseRecord.id },
      data: { queueId: selectDefaultQueue(caseRecord, queueByName, queues[index % queues.length].id) },
    }))
  );
}

function selectDefaultQueue(
  caseRecord: { priority: string; type: string | null; reason: string | null },
  queueByName: Map<string, string>,
  fallbackQueueId: string
) {
  const text = `${caseRecord.type || ''} ${caseRecord.reason || ''}`.toLowerCase();
  if (caseRecord.priority === 'HIGH' || caseRecord.priority === 'CRITICAL') {
    return queueByName.get('Priority Support') || fallbackQueueId;
  }
  if (text.includes('billing') || text.includes('invoice') || text.includes('payment') || text.includes('account')) {
    return queueByName.get('Billing & Account Support') || fallbackQueueId;
  }
  if (text.includes('bug') || text.includes('technical') || text.includes('integration') || text.includes('installation')) {
    return queueByName.get('Technical Support') || fallbackQueueId;
  }
  if (text.includes('onboarding') || text.includes('renewal') || text.includes('education')) {
    return queueByName.get('Customer Success') || fallbackQueueId;
  }
  return queueByName.get('Tier 1 Support') || fallbackQueueId;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, memberIds } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const queue = await prisma.caseQueue.create({
      data: {
        name,
        description,
        memberIds: memberIds || [],
      },
    });

    return NextResponse.json(queue, { status: 201 });
  } catch (error) {
    console.error('Error creating case queue:', error);
    return NextResponse.json({ error: 'Failed to create queue' }, { status: 500 });
  }
}
