import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { role, isPrimary } = body;

    const existingRole = await prisma.opportunityContactRole.findUnique({
      where: { id },
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: 'Contact role not found' },
        { status: 404 }
      );
    }

    // If setting as primary, unset other primary contacts for this opportunity
    if (isPrimary) {
      await prisma.opportunityContactRole.updateMany({
        where: {
          opportunityId: existingRole.opportunityId,
          isPrimary: true,
          id: { not: id },
        },
        data: { isPrimary: false },
      });
    }

    const updatedRole = await prisma.opportunityContactRole.update({
      where: { id },
      data: {
        ...(role !== undefined && { role }),
        ...(isPrimary !== undefined && { isPrimary }),
      },
    });

    // Fetch contact and opportunity data separately
    const [contact, opportunity] = await Promise.all([
      prisma.contact.findUnique({
        where: { id: updatedRole.contactId },
        select: { id: true, firstName: true, lastName: true, email: true, phone: true, title: true },
      }),
      prisma.opportunity.findUnique({
        where: { id: updatedRole.opportunityId },
        select: { id: true, name: true },
      }),
    ]);

    return NextResponse.json({ ...updatedRole, contact, opportunity });
  } catch (error: any) {
    console.error('Error updating opportunity contact role:', error);
    return NextResponse.json(
      { error: 'Failed to update opportunity contact role' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.opportunityContactRole.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting opportunity contact role:', error);
    return NextResponse.json(
      { error: 'Failed to delete opportunity contact role' },
      { status: 500 }
    );
  }
}
