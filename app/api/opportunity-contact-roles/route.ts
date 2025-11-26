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
    const opportunityId = searchParams.get('opportunityId');

    if (!opportunityId) {
      return NextResponse.json(
        { error: 'opportunityId is required' },
        { status: 400 }
      );
    }

    const roles = await prisma.opportunityContactRole.findMany({
      where: { opportunityId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });

    // Fetch contacts and opportunity data separately
    const contactIds = [...new Set(roles.map(r => r.contactId))];
    const [contacts, opportunity] = await Promise.all([
      prisma.contact.findMany({
        where: { id: { in: contactIds } },
        select: { id: true, firstName: true, lastName: true, email: true, phone: true, title: true },
      }),
      prisma.opportunity.findUnique({
        where: { id: opportunityId },
        select: { id: true, name: true },
      }),
    ]);
    const contactMap = new Map(contacts.map(c => [c.id, c]));

    const rolesWithRelations = roles.map(r => ({
      ...r,
      contact: contactMap.get(r.contactId),
      opportunity,
    }));

    return NextResponse.json(rolesWithRelations);
  } catch (error: any) {
    console.error('Error fetching opportunity contact roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunity contact roles' },
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
    const { opportunityId, contactId, role, isPrimary } = body;

    if (!opportunityId || !contactId || !role) {
      return NextResponse.json(
        { error: 'opportunityId, contactId, and role are required' },
        { status: 400 }
      );
    }

    // Check if relationship already exists
    const existing = await prisma.opportunityContactRole.findFirst({
      where: {
        opportunityId,
        contactId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'This contact is already associated with this opportunity' },
        { status: 400 }
      );
    }

    // If setting as primary, unset other primary contacts
    if (isPrimary) {
      await prisma.opportunityContactRole.updateMany({
        where: { opportunityId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const contactRole = await prisma.opportunityContactRole.create({
      data: {
        opportunityId,
        contactId,
        role,
        isPrimary: isPrimary || false,
      },
    });

    // Fetch contact and opportunity data separately
    const [contact, opportunity] = await Promise.all([
      prisma.contact.findUnique({
        where: { id: contactId },
        select: { id: true, firstName: true, lastName: true, email: true, phone: true, title: true },
      }),
      prisma.opportunity.findUnique({
        where: { id: opportunityId },
        select: { id: true, name: true },
      }),
    ]);

    return NextResponse.json({ ...contactRole, contact, opportunity }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating opportunity contact role:', error);
    return NextResponse.json(
      { error: 'Failed to create opportunity contact role' },
      { status: 500 }
    );
  }
}
