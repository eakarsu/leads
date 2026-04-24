import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
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
    const {
      createContact,
      contactData,
      opportunityData,
    } = body;

    // Get the lead
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        client: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Check if already converted
    const existingOpportunity = await prisma.opportunity.findUnique({
      where: { leadId: id },
    });

    if (existingOpportunity) {
      return NextResponse.json(
        { error: 'Lead already converted to opportunity' },
        { status: 400 }
      );
    }

    let contactId = null;

    // Create contact if requested
    if (createContact && contactData) {
      const contact = await prisma.contact.create({
        data: {
          clientId: lead.clientId,
          leadId: lead.id,
          firstName: contactData.firstName || (lead.fullName?.split(' ')[0]) || '',
          lastName: contactData.lastName || (lead.fullName?.split(' ').slice(1).join(' ')) || '',
          email: contactData.email || lead.email,
          phone: contactData.phone || lead.phone,
          title: contactData.title || lead.title,
          linkedinUrl: lead.linkedinUrl,
          ownerId: session.user.id,
          isPrimary: true,
        },
      });
      contactId = contact.id;
    }

    // Create opportunity
    const opportunity = await prisma.opportunity.create({
      data: {
        clientId: lead.clientId,
        leadId: lead.id,
        contactId,
        name: opportunityData?.name || `${lead.fullName || 'Unknown'} - ${lead.client.name}`,
        stage: opportunityData?.stage || 'QUALIFICATION',
        amount: opportunityData?.amount || 0,
        probability: opportunityData?.probability || 25,
        expectedCloseDate: opportunityData?.expectedCloseDate
          ? new Date(opportunityData.expectedCloseDate)
          : null,
        ownerId: session.user.id,
        description: opportunityData?.description || lead.notes,
      },
      include: {
        client: true,
        contact: true,
        lead: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update lead status
    await prisma.lead.update({
      where: { id },
      data: {
        status: 'QUALIFIED',
      },
    });

    return NextResponse.json({
      opportunity,
      message: 'Lead successfully converted to opportunity',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error converting lead:', error);
    return NextResponse.json(
      { error: 'Failed to convert lead to opportunity' },
      { status: 500 }
    );
  }
}
