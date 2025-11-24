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
    const ownerId = searchParams.get('ownerId');
    const accountId = searchParams.get('accountId');
    const isPrimary = searchParams.get('isPrimary');

    const contacts = await prisma.contact.findMany({
      where: {
        ...(clientId && { clientId }),
        ...(ownerId && { ownerId }),
        ...(accountId && { accountId }),
        ...(isPrimary !== null && { isPrimary: isPrimary === 'true' }),
      },
      include: {
        client: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        account: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            opportunities: true,
            tasks: true,
            events: true,
            subContacts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(contacts);
  } catch (error: any) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
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
      leadId,
      firstName,
      lastName,
      email,
      phone,
      title,
      department,
      linkedinUrl,
      isPrimary,
      accountId,
      ownerId,
      notes,
    } = body;

    const contact = await prisma.contact.create({
      data: {
        clientId,
        leadId,
        firstName,
        lastName,
        email,
        phone,
        title,
        department,
        linkedinUrl,
        isPrimary: isPrimary || false,
        accountId,
        ownerId,
        notes,
      },
      include: {
        client: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        account: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error: any) {
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}
