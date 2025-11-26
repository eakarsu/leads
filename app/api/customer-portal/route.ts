import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - List customer portal users and their access
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');

    // Get contacts with customer portal access
    const whereClause: any = {
      isPortalUser: true,
    };

    if (clientId) {
      whereClause.clientId = clientId;
    }

    if (status) {
      whereClause.portalStatus = status;
    }

    const portalUsers = await prisma.contact.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    // Fetch client companies for portal users
    const clientIds = [...new Set(portalUsers.map(u => u.clientId))];
    const clients = await prisma.clientCompany.findMany({
      where: { id: { in: clientIds } },
      select: {
        id: true,
        name: true,
        type: true,
      },
    });
    const clientMap = new Map(clients.map(c => [c.id, c]));

    // Add account info to portal users
    const portalUsersWithAccount = portalUsers.map(user => ({
      ...user,
      account: clientMap.get(user.clientId) || null,
    }));

    // Get portal statistics - count cases for portal users
    const portalUserIds = portalUsers.map(u => u.id);

    const totalCases = await prisma.case.count({
      where: {
        contactId: { in: portalUserIds },
      },
    });

    const openCases = await prisma.case.count({
      where: {
        contactId: { in: portalUserIds },
        status: {
          in: ['NEW', 'OPEN', 'IN_PROGRESS', 'ESCALATED'],
        },
      },
    });

    return NextResponse.json({
      portalUsers: portalUsersWithAccount,
      stats: {
        totalUsers: portalUsers.length,
        activeUsers: portalUsers.filter(u => u.portalStatus === 'ACTIVE').length,
        totalCases,
        openCases,
      },
    });
  } catch (error) {
    console.error('Error fetching customer portal data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Enable customer portal access for a contact
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contactId, sendWelcomeEmail } = body;

    const contact = await prisma.contact.update({
      where: { id: contactId },
      data: {
        isPortalUser: true,
        portalStatus: 'ACTIVE',
      },
    });

    // Fetch the client company
    const client = await prisma.clientCompany.findUnique({
      where: { id: contact.clientId },
    });

    // In a real implementation, you would send a welcome email here
    if (sendWelcomeEmail) {
      console.log(`Would send welcome email to ${contact.email}`);
    }

    return NextResponse.json({ ...contact, account: client }, { status: 201 });
  } catch (error) {
    console.error('Error enabling customer portal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update customer portal settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contactId, portalStatus } = body;

    const contact = await prisma.contact.update({
      where: { id: contactId },
      data: { portalStatus },
    });

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error updating customer portal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Disable customer portal access
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');

    if (!contactId) {
      return NextResponse.json({ error: 'Contact ID required' }, { status: 400 });
    }

    await prisma.contact.update({
      where: { id: contactId },
      data: {
        isPortalUser: false,
        portalStatus: 'DISABLED',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disabling customer portal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
