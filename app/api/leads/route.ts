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
    const campaignId = searchParams.get('campaignId');
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    const minScore = searchParams.get('minScore');
    const leadSource = searchParams.get('leadSource');

    // For CLIENT role users, filter by their clientId
    const userClientId = session.user.role === 'CLIENT' && session.user.clientId
      ? session.user.clientId
      : null;

    const leads = await prisma.lead.findMany({
      where: {
        ...(campaignId && { campaignId }),
        ...(clientId && { clientId }),
        ...(userClientId && { clientId: userClientId }), // Filter by user's client
        ...(status && { status: status as any }),
        ...(minScore && { qualificationScore: { gte: parseInt(minScore) } }),
        ...(leadSource && { leadSource: leadSource as any }),
      },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            channel: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            activities: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(leads);
  } catch (error: any) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
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
      campaignId,
      clientId: bodyClientId,
      fullName,
      company,
      title,
      email,
      phone,
      linkedinUrl,
      website,
      source,
      status,
      qualificationScore,
      notes,
      customFields,
    } = body;

    // For CLIENT role users, use their associated clientId from session
    // For AGENCY users, use the clientId from the request body
    const clientId = session.user.role === 'CLIENT' && session.user.clientId
      ? session.user.clientId
      : bodyClientId;

    // Basic validation
    if (!fullName) {
      return NextResponse.json(
        { error: 'Full name is required' },
        { status: 400 }
      );
    }

    // For AGENCY users, clientId is required
    if (session.user.role !== 'CLIENT' && !clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Determine lead source based on user role
    const leadSource = session.user.role === 'CLIENT' ? 'CLIENT_SUBMITTED' : 'AGENCY';

    const lead = await prisma.lead.create({
      data: {
        campaignId: campaignId || null,
        clientId,
        fullName,
        company: company || null,
        title: title || null,
        email: email || null,
        phone: phone || null,
        linkedinUrl: linkedinUrl || null,
        website: website || null,
        source: source || null,
        leadSource,
        submittedBy: session.user.id,
        status: status || 'NEW',
        qualificationScore: qualificationScore || 0,
        notes: notes || null,
        customFields: customFields || {},
      },
      include: {
        campaign: true,
        client: true,
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error: any) {
    console.error('Error creating lead:', error);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
