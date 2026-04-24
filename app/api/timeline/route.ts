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
    const globalMode = !contactId && !leadId && !opportunityId;
    const globalLimit = 50;

    const timeline: any[] = [];

    // Fetch Notes
    const noteWhere: any = {};
    if (contactId) noteWhere.contactId = contactId;
    if (leadId) noteWhere.leadId = leadId;
    if (opportunityId) noteWhere.opportunityId = opportunityId;

    const notes = await prisma.note.findMany({
      where: noteWhere,
      include: {
        creator: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      ...(globalMode && { take: globalLimit }),
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
    if (contactId || opportunityId || globalMode) {
      const taskWhere: any = {};
      if (contactId) taskWhere.contactId = contactId;
      if (opportunityId) taskWhere.opportunityId = opportunityId;

      const tasks = await prisma.task.findMany({
        where: taskWhere,
        include: {
          assignee: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        ...(globalMode && { take: globalLimit }),
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
    if (contactId || opportunityId || globalMode) {
      const eventWhere: any = {};
      if (contactId) eventWhere.contactId = contactId;
      if (opportunityId) eventWhere.opportunityId = opportunityId;

      const events = await prisma.event.findMany({
        where: eventWhere,
        include: {
          owner: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        ...(globalMode && { take: globalLimit }),
      });

      events.forEach((event) => {
        timeline.push({
          id: `event-${event.id}`,
          type: 'event',
          timestamp: event.startTime.toISOString(),
          title: event.subject,
          description: `${event.isAllDay ? 'All Day' : ''} ${new Date(event.startTime).toLocaleString()}${event.location ? ` • ${event.location}` : ''}`,
          user: event.owner,
        });
      });
    }

    // Fetch Attachments
    const attachmentWhere: any = {};
    if (contactId) attachmentWhere.contactId = contactId;
    if (leadId) attachmentWhere.leadId = leadId;
    if (opportunityId) attachmentWhere.opportunityId = opportunityId;

    const attachments = await prisma.attachment.findMany({
      where: attachmentWhere,
      include: {
        uploader: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      ...(globalMode && { take: globalLimit }),
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
    if (leadId || globalMode) {
      const leadActivityWhere: any = {};
      if (leadId) leadActivityWhere.leadId = leadId;

      const leadActivities = await prisma.leadActivity.findMany({
        where: leadActivityWhere,
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
        orderBy: { timestamp: 'desc' },
        ...(globalMode && { take: globalLimit }),
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

    // Fetch Emails
    if (contactId || globalMode) {
      const emailWhere: any = {};
      if (contactId) emailWhere.contactId = contactId;

      const emails = await prisma.email.findMany({
        where: emailWhere,
        include: {
          sender: {
            select: { id: true, name: true },
          },
        },
        orderBy: { sentAt: 'desc' },
        take: globalMode ? globalLimit : 50,
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

    // Sort by timestamp descending and limit for global mode
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json(globalMode ? timeline.slice(0, globalLimit) : timeline);
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
