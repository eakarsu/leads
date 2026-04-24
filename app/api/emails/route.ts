import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail, sendEmailFromTemplate } from '@/lib/email';
import { parsePaginationParams, buildPrismaQuery, buildPaginatedResponse } from '@/lib/pagination';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paginationParams = parsePaginationParams(req);

    const { searchParams } = new URL(req.url);
    const senderId = searchParams.get('senderId');
    const status = searchParams.get('status');
    const contactId = searchParams.get('contactId');
    const opportunityId = searchParams.get('opportunityId');

    const where = {
      ...(senderId && { senderId }),
      ...(status && { status: status as any }),
      ...(contactId && { contactId }),
      ...(opportunityId && { opportunityId }),
    };

    const total = await prisma.email.count({ where });

    const emails = await prisma.email.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      ...buildPrismaQuery(paginationParams),
    });

    return NextResponse.json(buildPaginatedResponse(emails, total, paginationParams));
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

    let emailHtml = emailBody;
    let templateVariables: Record<string, string> = {};

    // If template is used, fetch and apply it
    if (templateId) {
      const template = await prisma.emailTemplate.findUnique({
        where: { id: templateId },
      });

      if (template) {
        emailHtml = template.body;
        // Extract variables from body (for template variable replacement)
        templateVariables = body.variables || {};
      }
    }

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

    // Send email immediately if not scheduled
    if (!scheduledAt) {
      try {
        const sendResult = templateId
          ? await sendEmailFromTemplate(emailHtml, templateVariables, {
              to: toAddress,
              subject,
              cc: ccAddress,
              bcc: bccAddress,
            })
          : await sendEmail({
              to: toAddress,
              subject,
              html: emailHtml,
              cc: ccAddress,
              bcc: bccAddress,
            });

        if (sendResult.success) {
          // Update email status to DELIVERED
          await prisma.email.update({
            where: { id: email.id },
            data: { status: 'DELIVERED' },
          });
        } else {
          // Update email status to FAILED
          await prisma.email.update({
            where: { id: email.id },
            data: { status: 'FAILED' },
          });
        }
      } catch (error) {
        console.error('Error sending email:', error);
        // Update email status to FAILED
        await prisma.email.update({
          where: { id: email.id },
          data: { status: 'FAILED' },
        });
      }
    }

    return NextResponse.json(email, { status: 201 });
  } catch (error: any) {
    console.error('Error creating email:', error);
    return NextResponse.json(
      { error: 'Failed to create email' },
      { status: 500 }
    );
  }
}
