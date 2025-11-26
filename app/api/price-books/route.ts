import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const priceBooks = await prisma.priceBook.findMany({
      where: { isActive: true },
      include: {
        entries: true,
        _count: { select: { entries: true } },
      },
      orderBy: [{ isStandard: 'desc' }, { name: 'asc' }],
    });

    return NextResponse.json(priceBooks);
  } catch (error: any) {
    console.error('Error fetching price books:', error);
    return NextResponse.json({ error: 'Failed to fetch price books' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, isStandard, entries } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // If this is being set as standard, unset other standard price books
    if (isStandard) {
      await prisma.priceBook.updateMany({
        where: { isStandard: true },
        data: { isStandard: false },
      });
    }

    const priceBook = await prisma.priceBook.create({
      data: {
        name,
        description,
        isStandard: isStandard || false,
        entries: entries
          ? {
              create: entries.map((entry: any) => ({
                productId: entry.productId,
                unitPrice: entry.unitPrice,
                isActive: entry.isActive ?? true,
                useStandardPrice: entry.useStandardPrice || false,
              })),
            }
          : undefined,
      },
      include: {
        entries: true,
      },
    });

    return NextResponse.json(priceBook, { status: 201 });
  } catch (error: any) {
    console.error('Error creating price book:', error);
    return NextResponse.json({ error: 'Failed to create price book' }, { status: 500 });
  }
}
