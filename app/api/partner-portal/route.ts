import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - List partner portal users and their access
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');

    // Get contacts with partner portal access
    const whereClause: any = {
      isPartnerUser: true,
    };

    if (clientId) {
      whereClause.clientId = clientId;
    }

    if (status) {
      whereClause.portalStatus = status;
    }

    const partnerUsers = await prisma.contact.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    // Fetch client companies for partner users
    const clientIds = [...new Set(partnerUsers.map(u => u.clientId))];
    const clients = await prisma.clientCompany.findMany({
      where: { id: { in: clientIds } },
      select: {
        id: true,
        name: true,
        isPartner: true,
        partnerLevel: true,
      },
    });
    const clientMap = new Map(clients.map(c => [c.id, c]));

    // Add account info to partner users
    const partnerUsersWithAccount = partnerUsers.map(user => ({
      ...user,
      account: clientMap.get(user.clientId) || null,
    }));

    // Get partner accounts (client companies marked as partners)
    const partnerAccounts = await prisma.clientCompany.findMany({
      where: { isPartner: true },
    });

    // Get lead and opportunity counts for partner accounts
    const partnerAccountIds = partnerAccounts.map(a => a.id);

    const leadCounts = await prisma.lead.groupBy({
      by: ['clientId'],
      where: { clientId: { in: partnerAccountIds } },
      _count: { id: true },
    });
    const leadCountMap = new Map(leadCounts.map(l => [l.clientId, l._count.id]));

    const oppCounts = await prisma.opportunity.groupBy({
      by: ['clientId'],
      where: { clientId: { in: partnerAccountIds } },
      _count: { id: true },
    });
    const oppCountMap = new Map(oppCounts.map(o => [o.clientId, o._count.id]));

    const partnerAccountsWithCounts = partnerAccounts.map(account => ({
      ...account,
      _count: {
        leads: leadCountMap.get(account.id) || 0,
        opportunities: oppCountMap.get(account.id) || 0,
      },
    }));

    return NextResponse.json({
      partnerUsers: partnerUsersWithAccount,
      partnerAccounts: partnerAccountsWithCounts,
      stats: {
        totalPartners: partnerAccounts.length,
        activeUsers: partnerUsers.filter(u => u.portalStatus === 'ACTIVE').length,
        totalLeads: partnerAccountsWithCounts.reduce((sum, a) => sum + a._count.leads, 0),
        totalOpportunities: partnerAccountsWithCounts.reduce((sum, a) => sum + a._count.opportunities, 0),
      },
    });
  } catch (error) {
    console.error('Error fetching partner portal data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Enable partner portal access for a contact
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contactId, accountId, enablePortalAccess, partnerLevel } = body;

    // Update client company as partner if needed
    if (accountId && partnerLevel) {
      await prisma.clientCompany.update({
        where: { id: accountId },
        data: {
          isPartner: true,
          partnerLevel,
          type: 'Partner',
        },
      });
    }

    // Enable portal access for contact
    if (contactId && enablePortalAccess) {
      const contact = await prisma.contact.update({
        where: { id: contactId },
        data: {
          isPartnerUser: true,
          portalStatus: 'ACTIVE',
        },
      });

      // Fetch the client company
      const client = await prisma.clientCompany.findUnique({
        where: { id: contact.clientId },
      });

      return NextResponse.json({ ...contact, account: client }, { status: 201 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error enabling partner portal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update partner portal settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contactId, portalStatus, accountId, partnerLevel } = body;

    if (contactId) {
      await prisma.contact.update({
        where: { id: contactId },
        data: { portalStatus },
      });
    }

    if (accountId && partnerLevel) {
      await prisma.clientCompany.update({
        where: { id: accountId },
        data: { partnerLevel },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating partner portal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
