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
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const searchQuery = query.toLowerCase();
    const results: any[] = [];

    // Search Leads
    const leads = await prisma.lead.findMany({
      where: {
        OR: [
          { fullName: { contains: searchQuery, mode: 'insensitive' } },
          { email: { contains: searchQuery, mode: 'insensitive' } },
          { company: { contains: searchQuery, mode: 'insensitive' } },
          { title: { contains: searchQuery, mode: 'insensitive' } },
          { phone: { contains: searchQuery, mode: 'insensitive' } },
        ],
      },
      include: {
        campaign: {
          select: { name: true },
        },
      },
      take: 10,
    });

    leads.forEach((lead) => {
      results.push({
        id: lead.id,
        type: 'lead',
        title: lead.fullName,
        subtitle: `${lead.company} • ${lead.title || 'No title'}`,
        metadata: lead.campaign ? `Campaign: ${lead.campaign.name}` : '',
      });
    });

    // Search Contacts
    const contacts = await prisma.contact.findMany({
      where: {
        OR: [
          { firstName: { contains: searchQuery, mode: 'insensitive' } },
          { lastName: { contains: searchQuery, mode: 'insensitive' } },
          { email: { contains: searchQuery, mode: 'insensitive' } },
          { phone: { contains: searchQuery, mode: 'insensitive' } },
          { title: { contains: searchQuery, mode: 'insensitive' } },
          { department: { contains: searchQuery, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });

    // Fetch account names for contacts
    const contactClientIds = [...new Set(contacts.map(c => c.clientId))];
    const contactAccounts = await prisma.clientCompany.findMany({
      where: { id: { in: contactClientIds } },
      select: { id: true, name: true },
    });
    const contactAccountMap = new Map(contactAccounts.map(a => [a.id, a]));

    contacts.forEach((contact) => {
      const account = contactAccountMap.get(contact.clientId);
      results.push({
        id: contact.id,
        type: 'contact',
        title: `${contact.firstName} ${contact.lastName}`,
        subtitle: `${contact.email} • ${contact.title || 'No title'}`,
        metadata: `${account?.name || 'Unknown'}${contact.isPrimary ? ' • Primary Contact' : ''}`,
      });
    });

    // Search Opportunities
    const opportunities = await prisma.opportunity.findMany({
      where: {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } },
        ],
      },
      include: {
        contact: {
          select: { firstName: true, lastName: true },
        },
      },
      take: 10,
    });

    // Fetch account names for opportunities
    const oppClientIds = [...new Set(opportunities.map(o => o.clientId))];
    const oppAccounts = await prisma.clientCompany.findMany({
      where: { id: { in: oppClientIds } },
      select: { id: true, name: true },
    });
    const oppAccountMap = new Map(oppAccounts.map(a => [a.id, a]));

    opportunities.forEach((opp) => {
      const account = oppAccountMap.get(opp.clientId);
      results.push({
        id: opp.id,
        type: 'opportunity',
        title: opp.name,
        subtitle: `${opp.stage.replace('_', ' ')} • $${opp.amount.toLocaleString()}`,
        metadata: `${account?.name || 'Unknown'}${opp.contact ? ` • ${opp.contact.firstName} ${opp.contact.lastName}` : ''}`,
      });
    });

    // Search Accounts (ClientCompany)
    const accounts = await prisma.clientCompany.findMany({
      where: {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { industry: { contains: searchQuery, mode: 'insensitive' } },
          { website: { contains: searchQuery, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });

    accounts.forEach((account) => {
      results.push({
        id: account.id,
        type: 'account',
        title: account.name,
        subtitle: account.industry || 'No industry',
        metadata: account.website || '',
      });
    });

    // Search Campaigns
    const campaigns = await prisma.campaign.findMany({
      where: {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });

    campaigns.forEach((campaign) => {
      results.push({
        id: campaign.id,
        type: 'campaign',
        title: campaign.name,
        subtitle: `${campaign.status} • ${campaign.channel}`,
        metadata: '',
      });
    });

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
