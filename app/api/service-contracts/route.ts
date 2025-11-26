import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const contracts = await prisma.serviceContract.findMany({
      include: {
        account: {
          select: { id: true, name: true },
        },
        lineItems: true,
        _count: {
          select: { lineItems: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const stats = {
      totalContracts: contracts.length,
      draftContracts: contracts.filter((c) => c.status === 'DRAFT').length,
      activeContracts: contracts.filter((c) => c.status === 'ACTIVE').length,
      expiredContracts: contracts.filter((c) => c.status === 'EXPIRED').length,
      cancelledContracts: contracts.filter((c) => c.status === 'CANCELLED').length,
      totalValue: contracts.reduce((sum, c) => sum + (c.contractValue || 0), 0),
      expiringThisMonth: contracts.filter(
        (c) => c.status === 'ACTIVE' && new Date(c.endDate) <= thirtyDaysFromNow && new Date(c.endDate) > now
      ).length,
    };

    return NextResponse.json({ contracts, stats });
  } catch (error) {
    console.error('Error fetching service contracts:', error);
    return NextResponse.json({ error: 'Failed to fetch service contracts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const contractNumber = `SC-${Date.now().toString(36).toUpperCase()}`;

    const contract = await prisma.serviceContract.create({
      data: {
        contractNumber,
        name: body.name,
        accountId: body.accountId,
        contactId: body.contactId || null,
        status: 'DRAFT',
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        contractType: body.contractType || 'SUPPORT',
        responseTimeHours: body.responseTimeHours || null,
        resolutionTimeHours: body.resolutionTimeHours || null,
        supportHours: body.supportHours || null,
        contractValue: body.contractValue || 0,
        billingFrequency: body.billingFrequency || null,
        autoRenew: body.autoRenew || false,
        renewalTermMonths: body.renewalTermMonths || null,
        terms: body.terms || null,
        specialConditions: body.specialConditions || null,
      },
      include: {
        account: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ contract });
  } catch (error) {
    console.error('Error creating service contract:', error);
    return NextResponse.json({ error: 'Failed to create service contract' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, ...updateData } = body;

    if (action === 'activate') {
      const contract = await prisma.serviceContract.update({
        where: { id },
        data: { status: 'ACTIVE' },
      });
      return NextResponse.json({ contract });
    }

    if (action === 'cancel') {
      const contract = await prisma.serviceContract.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });
      return NextResponse.json({ contract });
    }

    const contract = await prisma.serviceContract.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ contract });
  } catch (error) {
    console.error('Error updating service contract:', error);
    return NextResponse.json({ error: 'Failed to update service contract' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Contract ID required' }, { status: 400 });
    }

    await prisma.serviceContract.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting service contract:', error);
    return NextResponse.json({ error: 'Failed to delete service contract' }, { status: 500 });
  }
}
