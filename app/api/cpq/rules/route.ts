import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const rule = await prisma.productRule.create({
      data: {
        name: body.name,
        description: body.description || null,
        ruleType: body.ruleType || 'PRICING',
        isActive: true,
        conditions: body.conditions || {},
        actions: body.actions || {},
        discountType: body.discountType || null,
        discountValue: body.discountValue || null,
        priority: body.priority || 0,
      },
    });

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Error creating product rule:', error);
    return NextResponse.json({ error: 'Failed to create product rule' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    const rule = await prisma.productRule.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Error updating product rule:', error);
    return NextResponse.json({ error: 'Failed to update product rule' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Rule ID required' }, { status: 400 });
    }

    await prisma.productRule.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product rule:', error);
    return NextResponse.json({ error: 'Failed to delete product rule' }, { status: 500 });
  }
}
