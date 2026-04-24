import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parsePaginationParams, buildPrismaQuery, buildPaginatedResponse } from '@/lib/pagination';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paginationParams = parsePaginationParams(req);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const queueId = searchParams.get('queueId');
    const ownerId = searchParams.get('ownerId');

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (queueId) where.queueId = queueId;
    if (ownerId) where.ownerId = ownerId;

    const total = await prisma.case.count({ where });

    const cases = await prisma.case.findMany({
      where,
      ...buildPrismaQuery(paginationParams),
    });

    // Fetch account names for cases
    const accountIds = [...new Set(cases.map(c => c.accountId).filter(Boolean))] as string[];
    const accounts = accountIds.length > 0 ? await prisma.clientCompany.findMany({
      where: { id: { in: accountIds } },
      select: { id: true, name: true },
    }) : [];
    const accountMap = new Map(accounts.map(a => [a.id, a]));

    // Add account info to cases
    const casesWithRelations = cases.map(caseItem => ({
      ...caseItem,
      account: caseItem.accountId ? accountMap.get(caseItem.accountId) || null : null,
    }));

    // Calculate stats
    const stats = {
      totalCases: total,
      newCases: casesWithRelations.filter(c => c.status === 'NEW').length,
      openCases: casesWithRelations.filter(c => c.status === 'OPEN').length,
      inProgressCases: casesWithRelations.filter(c => c.status === 'IN_PROGRESS').length,
      escalatedCases: casesWithRelations.filter(c => c.status === 'ESCALATED').length,
      closedCases: casesWithRelations.filter(c => c.status === 'CLOSED').length,
    };

    const paginatedResponse = buildPaginatedResponse(casesWithRelations, total, paginationParams);
    return NextResponse.json({ ...paginatedResponse, stats });
  } catch (error: any) {
    console.error('Error fetching cases:', error);
    return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      subject,
      description,
      priority,
      origin,
      type,
      reason,
      contactId,
      accountId,
      queueId,
      slaDeadline,
    } = body;

    if (!subject) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }

    // Generate case number
    const caseCount = await prisma.case.count();
    const caseNumber = `CS-${String(caseCount + 1).padStart(6, '0')}`;

    const newCase = await prisma.case.create({
      data: {
        caseNumber,
        subject,
        description,
        priority: priority || 'MEDIUM',
        origin: origin || 'WEB',
        type,
        reason,
        contactId,
        accountId,
        ownerId: session.user.id,
        queueId,
        slaDeadline: slaDeadline ? new Date(slaDeadline) : null,
      },
      include: {
        queue: true,
      },
    });

    return NextResponse.json(newCase, { status: 201 });
  } catch (error: any) {
    console.error('Error creating case:', error);
    return NextResponse.json({ error: 'Failed to create case' }, { status: 500 });
  }
}
