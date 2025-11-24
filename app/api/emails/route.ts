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
    const senderId = searchParams.get('senderId');
    const status = searchParams.get('status');
    const contactId = searchParams.get('contactId');
    const opportunityId = searchParams.get('opportunityId');

    const emails = await prisma.email.findMany({
      where: {
        ...(senderId && { senderId }),
        ...(status && { status: status as any }),
        ...(contactId && { contactId }),
        ...(opportunityId && { opportunityId }),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(emails);
  } catch (error: any) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
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
      toAddress,
      ccAddress,
      bccAddress,
      subject,
      body: emailBody,
      scheduledAt,
      templateId,
      contactId,
      opportunityId,
    } = body;

    // Create email record
    const email = await prisma.email.create({
      data: {
        senderId: session.user.id,
        toAddress,
        ccAddress,
        bccAddress,
        subject,
        body: emailBody,
        status: scheduledAt ? 'DRAFT' : 'SENT',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        sentAt: scheduledAt ? null : new Date(),
        templateId,
        contactId,
        opportunityId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // TODO: Integrate with email sending service (SendGrid, AWS SES, etc.)
    // For now, we just create the record

    return NextResponse.json(email, { status: 201 });
  } catch (error: any) {
    console.error('Error creating email:', error);
    return NextResponse.json(
      { error: 'Failed to create email' },
      { status: 500 }
    );
  }
}
