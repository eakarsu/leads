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

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const isActive = searchParams.get('isActive');
    const category = searchParams.get('category');

    const products = await prisma.product.findMany({
      where: {
        ...(clientId && { clientId }),
        ...(isActive !== null && { isActive: isActive === 'true' }),
        ...(category && { category }),
      },
      include: {
        client: true,
        _count: {
          select: {
            lineItems: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(products);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
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
      name,
      code,
      description,
      unitPrice,
      isActive,
      category,
    } = body;

    const product = await prisma.product.create({
      data: {
        clientId,
        name,
        code,
        description,
        unitPrice,
        isActive: isActive !== undefined ? isActive : true,
        category,
      },
      include: {
        client: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
