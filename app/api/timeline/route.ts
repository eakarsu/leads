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
    const contactId = searchParams.get('contactId');
    const leadId = searchParams.get('leadId');
    const opportunityId = searchParams.get('opportunityId');

    const timeline: any[] = [];

    // Fetch Notes
    const notes = await prisma.note.findMany({
      where: {
        ...(contactId && { contactId }),
        ...(leadId && { leadId }),
        ...(opportunityId && { opportunityId }),
      },
      include: {
        creator: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    notes.forEach((note) => {
      timeline.push({
        id: `note-${note.id}`,
        type: 'note',
        timestamp: note.createdAt.toISOString(),
        title: 'Note Added',
        description: note.content.substring(0, 100) + (note.content.length > 100 ? '...' : ''),
        user: note.creator,
      });
    });

    // Fetch Tasks
    if (contactId || opportunityId) {
      const tasks = await prisma.task.findMany({
        where: {
          ...(contactId && { contactId }),
          ...(opportunityId && { opportunityId }),
        },
        include: {
          assignee: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      tasks.forEach((task) => {
        timeline.push({
          id: `task-${task.id}`,
          type: 'task',
          timestamp: task.createdAt.toISOString(),
          title: task.subject,
          description: `${task.status} • Priority: ${task.priority}`,
          user: task.assignee,
        });
      });
    }

    // Fetch Events
    if (contactId || opportunityId) {
      const events = await prisma.event.findMany({
        where: {
          ...(contactId && { contactId }),
          ...(opportunityId && { opportunityId }),
        },
        include: {
          owner: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      events.forEach((event) => {
        timeline.push({
          id: `event-${event.id}`,
          type: 'event',
          timestamp: event.startTime.toISOString(),
          title: event.subject,
          description: `${event.eventType} • ${new Date(event.startTime).toLocaleString()}`,
          user: event.owner,
        });
      });
    }

    // Fetch Attachments
    const attachments = await prisma.attachment.findMany({
      where: {
        ...(contactId && { contactId }),
        ...(leadId && { leadId }),
        ...(opportunityId && { opportunityId }),
      },
      include: {
        uploader: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    attachments.forEach((attachment) => {
      timeline.push({
        id: `attachment-${attachment.id}`,
        type: 'attachment',
        timestamp: attachment.createdAt.toISOString(),
        title: 'File Attached',
        description: `${attachment.fileName} (${formatFileSize(attachment.fileSize)})`,
        user: attachment.uploader,
      });
    });

    // Fetch Lead Activities
    if (leadId) {
      const leadActivities = await prisma.leadActivity.findMany({
        where: { leadId },
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
        orderBy: { timestamp: 'desc' },
      });

      leadActivities.forEach((activity) => {
        timeline.push({
          id: `lead-activity-${activity.id}`,
          type: 'lead_activity',
          timestamp: activity.timestamp.toISOString(),
          title: `${activity.type} Activity`,
          description: activity.content.substring(0, 100) + (activity.content.length > 100 ? '...' : ''),
          user: activity.user,
        });
      });
    }

    // Fetch Emails (only for contacts, not leads)
    if (contactId) {
      const emails = await prisma.email.findMany({
        where: {
          contactId: contactId,
        },
        include: {
          sender: {
            select: { id: true, name: true },
          },
        },
        orderBy: { sentAt: 'desc' },
        take: 50,
      });

      emails.forEach((email) => {
        if (email.sentAt) {
          timeline.push({
            id: `email-${email.id}`,
            type: 'email',
            timestamp: email.sentAt.toISOString(),
            title: email.subject,
            description: `Status: ${email.status} • To: ${email.toAddress}`,
            user: email.sender,
          });
        }
      });
    }

    // Sort by timestamp descending
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json(timeline);
  } catch (error: any) {
    console.error('Error fetching timeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline' },
      { status: 500 }
    );
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
