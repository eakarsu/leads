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
    const clientId = searchParams.get('clientId');
    const stage = searchParams.get('stage');
    const ownerId = searchParams.get('ownerId');

    const where = {
      ...(clientId && { clientId }),
      ...(stage && { stage: stage as any }),
      ...(ownerId && { ownerId }),
    };

    const total = await prisma.opportunity.count({ where });

    const opportunities = await prisma.opportunity.findMany({
      where,
      include: {
        client: true,
        contact: true,
        lead: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lineItems: {
          include: {
            product: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            events: true,
          },
        },
      },
      ...buildPrismaQuery(paginationParams),
    });

    return NextResponse.json(buildPaginatedResponse(opportunities, total, paginationParams));
  } catch (error: any) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunities' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      clientId,
      contactId,
      leadId,
      name,
      stage,
      amount,
      probability,
      expectedCloseDate,
      ownerId,
      description,
      nextSteps,
      lineItems,
    } = body;

    const opportunity = await prisma.opportunity.create({
      data: {
        clientId,
        contactId,
        leadId,
        name,
        stage: stage || 'PROSPECTING',
        amount: amount || 0,
        probability: probability || 0,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        ownerId,
        description,
        nextSteps,
        ...(lineItems && {
          lineItems: {
            create: lineItems.map((item: any) => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice,
              discount: item.discount || 0,
              totalPrice: item.totalPrice,
              description: item.description,
            })),
          },
        }),
      },
      include: {
        client: true,
        contact: true,
        lead: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lineItems: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(opportunity, { status: 201 });
  } catch (error: any) {
    console.error('Error creating opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to create opportunity' },
      { status: 500 }
    );
  }
}
