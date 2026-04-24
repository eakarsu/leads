import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parsePaginationParams, buildPrismaQuery, buildPaginatedResponse } from '@/lib/pagination';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paginationParams = parsePaginationParams(req);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status) where.status = status;

    const total = await prisma.massEmailJob.count({ where });

    const jobs = await prisma.massEmailJob.findMany({
      where,
      ...buildPrismaQuery(paginationParams),
    });

    // Calculate stats
    const stats = {
      totalJobs: jobs.length,
      draftJobs: jobs.filter(j => j.status === 'DRAFT').length,
      scheduledJobs: jobs.filter(j => j.status === 'SCHEDULED').length,
      completedJobs: jobs.filter(j => j.status === 'COMPLETED').length,
      totalSent: jobs.reduce((sum, j) => sum + (j.sentCount || 0), 0),
      totalOpened: jobs.reduce((sum, j) => sum + (j.openedCount || 0), 0),
      totalClicked: jobs.reduce((sum, j) => sum + (j.clickedCount || 0), 0),
    };

    return NextResponse.json(buildPaginatedResponse(jobs, total, paginationParams, { stats }));
  } catch (error: any) {
    console.error('Error fetching mass email jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      templateId,
      subject,
      body: emailBody,
      recipientType,
      recipientIds,
      filterCriteria,
      scheduledAt,
    } = body;

    if (!name || !subject || !emailBody || !recipientType) {
      return NextResponse.json(
        { error: 'Name, subject, body, and recipient type are required' },
        { status: 400 }
      );
    }

    // Calculate total recipients
    let totalRecipients = 0;
    if (recipientIds && recipientIds.length > 0) {
      totalRecipients = recipientIds.length;
    } else if (filterCriteria) {
      // Count matching records
      if (recipientType === 'Lead') {
        totalRecipients = await prisma.lead.count({ where: filterCriteria });
      } else if (recipientType === 'Contact') {
        totalRecipients = await prisma.contact.count({ where: filterCriteria });
      }
    }

    const job = await prisma.massEmailJob.create({
      data: {
        name,
        templateId,
        subject,
        body: emailBody,
        recipientType,
        recipientIds: recipientIds || [],
        filterCriteria,
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        totalRecipients,
        ownerId: session.user.id,
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error: any) {
    console.error('Error creating mass email job:', error);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}

// Send mass email
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { jobId, action } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const job = await prisma.massEmailJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (action === 'send') {
      // Update status to sending
      await prisma.massEmailJob.update({
        where: { id: jobId },
        data: {
          status: 'SENDING',
          startedAt: new Date(),
        },
      });

      // Get recipients
      let recipients: any[] = [];
      if (job.recipientIds.length > 0) {
        if (job.recipientType === 'Lead') {
          recipients = await prisma.lead.findMany({
            where: { id: { in: job.recipientIds } },
            select: { id: true, email: true, fullName: true },
          });
        } else if (job.recipientType === 'Contact') {
          recipients = await prisma.contact.findMany({
            where: { id: { in: job.recipientIds } },
            select: { id: true, email: true, firstName: true, lastName: true },
          });
        }
      } else if (job.filterCriteria) {
        const filter = job.filterCriteria as any;
        if (job.recipientType === 'Lead') {
          recipients = await prisma.lead.findMany({
            where: filter,
            select: { id: true, email: true, fullName: true },
          });
        } else if (job.recipientType === 'Contact') {
          recipients = await prisma.contact.findMany({
            where: filter,
            select: { id: true, email: true, firstName: true, lastName: true },
          });
        }
      }

      // Filter recipients with valid emails
      recipients = recipients.filter((r) => r.email);

      let sentCount = 0;
      let failedCount = 0;

      // Create individual emails (in production, you'd send these via email service)
      for (const recipient of recipients) {
        try {
          // Replace merge fields in subject and body
          let personalizedSubject = job.subject;
          let personalizedBody = job.body;

          if (job.recipientType === 'Lead') {
            personalizedSubject = personalizedSubject.replace(/\{\{fullName\}\}/g, recipient.fullName || '');
            personalizedBody = personalizedBody.replace(/\{\{fullName\}\}/g, recipient.fullName || '');
          } else {
            const fullName = `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim();
            personalizedSubject = personalizedSubject.replace(/\{\{fullName\}\}/g, fullName);
            personalizedBody = personalizedBody.replace(/\{\{fullName\}\}/g, fullName);
          }

          // Create email record
          await prisma.email.create({
            data: {
              senderId: session.user.id,
              toAddress: recipient.email,
              subject: personalizedSubject,
              body: personalizedBody,
              status: 'SENT',
              sentAt: new Date(),
              contactId: job.recipientType === 'Contact' ? recipient.id : null,
            },
          });

          sentCount++;
        } catch (err) {
          failedCount++;
        }

        // Update progress
        await prisma.massEmailJob.update({
          where: { id: jobId },
          data: {
            sentCount,
            failedCount,
          },
        });
      }

      // Mark as completed
      const completedJob = await prisma.massEmailJob.update({
        where: { id: jobId },
        data: {
          status: failedCount === recipients.length ? 'FAILED' : 'COMPLETED',
          completedAt: new Date(),
          sentCount,
          failedCount,
        },
      });

      return NextResponse.json(completedJob);
    }

    if (action === 'cancel') {
      const cancelledJob = await prisma.massEmailJob.update({
        where: { id: jobId },
        data: { status: 'DRAFT' },
      });

      return NextResponse.json(cancelledJob);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error processing mass email:', error);
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}
