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
    const accountId = searchParams.get('accountId');

    const where: any = {};
    if (status) where.status = status;
    if (accountId) where.accountId = accountId;

    const total = await prisma.contract.count({ where });

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        lineItems: true,
        _count: { select: { lineItems: true, renewals: true } },
      },
      ...buildPrismaQuery(paginationParams),
    });

    // Fetch account names for contracts
    const accountIds = [...new Set(contracts.map(c => c.accountId))];
    const accounts = await prisma.clientCompany.findMany({
      where: { id: { in: accountIds } },
      select: { id: true, name: true },
    });
    const accountMap = new Map(accounts.map(a => [a.id, a]));

    // Add account info to contracts
    const contractsWithAccounts = contracts.map(contract => ({
      ...contract,
      account: accountMap.get(contract.accountId) || null,
    }));

    // Calculate stats
    const stats = {
      totalContracts: contractsWithAccounts.length,
      draftContracts: contractsWithAccounts.filter(c => c.status === 'DRAFT').length,
      activeContracts: contractsWithAccounts.filter(c => c.status === 'ACTIVATED').length,
      expiredContracts: contractsWithAccounts.filter(c => c.status === 'EXPIRED').length,
      totalValue: contractsWithAccounts.reduce((sum, c) => sum + (typeof c.totalValue === 'number' ? c.totalValue : 0), 0),
      expiringThisMonth: contractsWithAccounts.filter(c => {
        if (c.status !== 'ACTIVATED') return false;
        const endDate = new Date(c.endDate);
        const now = new Date();
        const daysUntilEnd = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysUntilEnd <= 30 && daysUntilEnd > 0;
      }).length,
    };

    return NextResponse.json(buildPaginatedResponse(contractsWithAccounts, total, paginationParams));
  } catch (error: any) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
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
      accountId,
      name,
      startDate,
      endDate,
      contractTerm,
      description,
      specialTerms,
      totalValue,
      lineItems,
    } = body;

    if (!accountId || !name || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Account, name, start date, and end date are required' },
        { status: 400 }
      );
    }

    // Generate contract number
    const contractCount = await prisma.contract.count();
    const contractNumber = `CON-${String(contractCount + 1).padStart(6, '0')}`;

    const contract = await prisma.contract.create({
      data: {
        contractNumber,
        accountId,
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        contractTerm: contractTerm || 12,
        description,
        specialTerms,
        totalValue: totalValue || 0,
        ownerId: session.user.id,
        lineItems: lineItems
          ? {
              create: lineItems.map((item: any) => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity || 1,
                unitPrice: item.unitPrice,
                discount: item.discount || 0,
                totalPrice: item.totalPrice,
                description: item.description,
              })),
            }
          : undefined,
      },
      include: {
        lineItems: true,
      },
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (error: any) {
    console.error('Error creating contract:', error);
    return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 });
  }
}
