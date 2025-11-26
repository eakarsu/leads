import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Get campaign influence records
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get('campaignId');
    const opportunityId = searchParams.get('opportunityId');
    const contactId = searchParams.get('contactId');

    const where: any = {};
    if (campaignId) where.campaignId = campaignId;
    if (opportunityId) where.opportunityId = opportunityId;
    if (contactId) where.contactId = contactId;

    const influences = await prisma.campaignInfluence.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Fetch related data separately
    const campaignIds = [...new Set(influences.map(i => i.campaignId))];
    const opportunityIds = [...new Set(influences.map(i => i.opportunityId))];
    const contactIds = [...new Set(influences.map(i => i.contactId).filter(Boolean))] as string[];

    const [campaigns, opportunities, contacts] = await Promise.all([
      prisma.campaign.findMany({
        where: { id: { in: campaignIds } },
        select: { id: true, name: true, channel: true, status: true },
      }),
      prisma.opportunity.findMany({
        where: { id: { in: opportunityIds } },
        select: { id: true, name: true, amount: true, stage: true },
      }),
      contactIds.length > 0 ? prisma.contact.findMany({
        where: { id: { in: contactIds } },
        select: { id: true, firstName: true, lastName: true, email: true },
      }) : [],
    ]);

    const campaignMap = new Map(campaigns.map(c => [c.id, c]));
    const opportunityMap = new Map(opportunities.map(o => [o.id, o]));
    const contactMap = new Map(contacts.map(c => [c.id, c]));

    const influencesWithRelations = influences.map(inf => ({
      ...inf,
      campaign: campaignMap.get(inf.campaignId),
      opportunity: opportunityMap.get(inf.opportunityId),
      contact: inf.contactId ? contactMap.get(inf.contactId) : null,
    }));

    return NextResponse.json(influencesWithRelations);
  } catch (error: any) {
    console.error('Error fetching campaign influences:', error);
    return NextResponse.json({ error: 'Failed to fetch influences' }, { status: 500 });
  }
}

// Create campaign influence (manual attribution)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { campaignId, opportunityId, contactId, influencePercent, isPrimary } = body;

    if (!campaignId || !opportunityId) {
      return NextResponse.json(
        { error: 'Campaign ID and Opportunity ID are required' },
        { status: 400 }
      );
    }

    // Check if influence already exists
    const existing = await prisma.campaignInfluence.findFirst({
      where: { campaignId, opportunityId },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Campaign influence already exists for this opportunity' },
        { status: 400 }
      );
    }

    // If setting as primary, remove primary from others
    if (isPrimary) {
      await prisma.campaignInfluence.updateMany({
        where: { opportunityId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const influence = await prisma.campaignInfluence.create({
      data: {
        campaignId,
        opportunityId,
        contactId,
        influencePercent: influencePercent || 0,
        isPrimary: isPrimary ?? false,
      },
    });

    return NextResponse.json(influence, { status: 201 });
  } catch (error: any) {
    console.error('Error creating campaign influence:', error);
    return NextResponse.json({ error: 'Failed to create influence' }, { status: 500 });
  }
}

// Update campaign influence
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, influencePercent, isPrimary } = body;

    if (!id) {
      return NextResponse.json({ error: 'Influence ID is required' }, { status: 400 });
    }

    const existing = await prisma.campaignInfluence.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Influence not found' }, { status: 404 });
    }

    // If setting as primary, remove primary from others
    if (isPrimary && !existing.isPrimary) {
      await prisma.campaignInfluence.updateMany({
        where: { opportunityId: existing.opportunityId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const influence = await prisma.campaignInfluence.update({
      where: { id },
      data: {
        influencePercent,
        isPrimary,
      },
    });

    return NextResponse.json(influence);
  } catch (error: any) {
    console.error('Error updating campaign influence:', error);
    return NextResponse.json({ error: 'Failed to update influence' }, { status: 500 });
  }
}

// Delete campaign influence
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Influence ID is required' }, { status: 400 });
    }

    await prisma.campaignInfluence.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting campaign influence:', error);
    return NextResponse.json({ error: 'Failed to delete influence' }, { status: 500 });
  }
}
