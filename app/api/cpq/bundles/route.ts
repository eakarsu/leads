import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const bundle = await prisma.productBundle.create({
      data: {
        name: body.name,
        description: body.description || null,
        bundleType: body.bundleType || 'STATIC',
        isActive: true,
        basePrice: body.basePrice || null,
        discountPercent: body.discountPercent || null,
      },
    });

    return NextResponse.json({ bundle });
  } catch (error) {
    console.error('Error creating product bundle:', error);
    return NextResponse.json({ error: 'Failed to create product bundle' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    const bundle = await prisma.productBundle.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ bundle });
  } catch (error) {
    console.error('Error updating product bundle:', error);
    return NextResponse.json({ error: 'Failed to update product bundle' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Bundle ID required' }, { status: 400 });
    }

    await prisma.productBundle.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product bundle:', error);
    return NextResponse.json({ error: 'Failed to delete product bundle' }, { status: 500 });
  }
}
