import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parsePaginationParams, buildPrismaQuery, buildPaginatedResponse } from '@/lib/pagination';

// GET - List entitlements and SLAs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const status = searchParams.get('status');
    const type = searchParams.get('type'); // 'entitlements', 'processes', or 'milestones'

    if (type === 'processes') {
      const processes = await prisma.entitlementProcess.findMany({
        where: { isActive: true },
        include: {
          milestones: {
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      });
      return NextResponse.json({ processes });
    }

    const paginationParams = parsePaginationParams(request);

    const whereClause: any = {};

    if (accountId) {
      whereClause.accountId = accountId;
    }

    if (status) {
      whereClause.status = status;
    }

    const total = await prisma.entitlement.count({ where: whereClause });

    const entitlements = await prisma.entitlement.findMany({
      where: whereClause,
      ...buildPrismaQuery(paginationParams),
    });

    // Fetch account names for entitlements
    const accountIds = [...new Set(entitlements.map(e => e.accountId))];
    const accounts = await prisma.clientCompany.findMany({
      where: { id: { in: accountIds } },
      select: { id: true, name: true },
    });
    const accountMap = new Map(accounts.map(a => [a.id, a]));

    // Fetch process names for entitlements
    const processIds = [...new Set(entitlements.map(e => e.slaProcessId).filter(Boolean))] as string[];
    const processes = processIds.length > 0 ? await prisma.entitlementProcess.findMany({
      where: { id: { in: processIds } },
      select: { id: true, name: true },
    }) : [];
    const processMap = new Map(processes.map(p => [p.id, p]));

    // Add account and process info to entitlements
    const entitlementsWithRelations = entitlements.map(entitlement => ({
      ...entitlement,
      account: accountMap.get(entitlement.accountId) || null,
      process: entitlement.slaProcessId ? processMap.get(entitlement.slaProcessId) || null : null,
    }));

    // Calculate stats
    const stats = {
      totalEntitlements: entitlementsWithRelations.length,
      activeEntitlements: entitlementsWithRelations.filter(e => e.status === 'ACTIVE').length,
      expiringSoon: entitlementsWithRelations.filter(e => {
        if (!e.endDate) return false;
        const daysUntilExpiry = Math.ceil((new Date(e.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
      }).length,
      totalCasesRemaining: entitlementsWithRelations.reduce((sum, e) => sum + (e.remainingCases || 0), 0),
    };

    return NextResponse.json(buildPaginatedResponse(entitlementsWithRelations, total, paginationParams));
  } catch (error) {
    console.error('Error fetching entitlements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new entitlement or process
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body;

    if (type === 'process') {
      const { name, description, isActive, milestones } = body;

      const process = await prisma.entitlementProcess.create({
        data: {
          name,
          description,
          isActive: isActive !== false,
        },
      });

      // Create milestones
      if (milestones && milestones.length > 0) {
        for (let i = 0; i < milestones.length; i++) {
          await prisma.entitlementMilestone.create({
            data: {
              processId: process.id,
              name: milestones[i].name,
              description: milestones[i].description,
              minutesToComplete: milestones[i].targetMinutes || 60,
              sortOrder: i + 1,
              recurrenceType: milestones[i].recurrenceType || 'NO_RECURRENCE',
            },
          });
        }
      }

      const createdProcess = await prisma.entitlementProcess.findUnique({
        where: { id: process.id },
        include: { milestones: true },
      });

      return NextResponse.json(createdProcess, { status: 201 });
    }

    // Create entitlement
    const {
      name,
      accountId,
      assetId,
      contractId,
      slaProcessId,
      startDate,
      endDate,
      remainingCases,
      remainingWorkOrders,
      status,
      perIncident,
      description,
    } = body;

    const entitlement = await prisma.entitlement.create({
      data: {
        name,
        accountId,
        assetId,
        contractId,
        slaProcessId,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year
        remainingCases,
        remainingWorkOrders,
        status: status || 'ACTIVE',
        perIncident: perIncident || false,
        description,
      },
      include: {
        slaProcess: true,
      },
    });

    return NextResponse.json(entitlement, { status: 201 });
  } catch (error) {
    console.error('Error creating entitlement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update an entitlement or process
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, type } = body;

    if (type === 'process') {
      const { name, description, isActive, milestones } = body;

      // Update process
      await prisma.entitlementProcess.update({
        where: { id },
        data: { name, description, isActive },
      });

      // Update milestones if provided
      if (milestones) {
        await prisma.entitlementMilestone.deleteMany({
          where: { processId: id },
        });

        for (let i = 0; i < milestones.length; i++) {
          await prisma.entitlementMilestone.create({
            data: {
              processId: id,
              name: milestones[i].name,
              description: milestones[i].description,
              minutesToComplete: milestones[i].targetMinutes || 60,
              sortOrder: i + 1,
              recurrenceType: milestones[i].recurrenceType || 'NO_RECURRENCE',
            },
          });
        }
      }

      const process = await prisma.entitlementProcess.findUnique({
        where: { id },
        include: { milestones: true },
      });

      return NextResponse.json(process);
    }

    // Update entitlement
    const {
      name,
      slaProcessId,
      startDate,
      endDate,
      remainingCases,
      remainingWorkOrders,
      status,
      description,
      perIncident,
      decrementCase, // Special flag to decrement remaining cases
    } = body;

    if (decrementCase) {
      const entitlement = await prisma.entitlement.findUnique({
        where: { id },
      });

      if (entitlement && entitlement.remainingCases && entitlement.remainingCases > 0) {
        await prisma.entitlement.update({
          where: { id },
          data: {
            remainingCases: entitlement.remainingCases - 1,
          },
        });
      }

      return NextResponse.json({ success: true });
    }

    const entitlement = await prisma.entitlement.update({
      where: { id },
      data: {
        name,
        slaProcessId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        remainingCases,
        remainingWorkOrders,
        status,
        description,
        perIncident,
      },
      include: {
        slaProcess: true,
      },
    });

    return NextResponse.json(entitlement);
  } catch (error) {
    console.error('Error updating entitlement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete an entitlement or process
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    if (type === 'process') {
      await prisma.entitlementMilestone.deleteMany({
        where: { processId: id },
      });
      await prisma.entitlementProcess.delete({
        where: { id },
      });
    } else {
      await prisma.entitlement.delete({
        where: { id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting entitlement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
