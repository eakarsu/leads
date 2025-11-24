import { prisma } from './prisma';
import { NotificationType } from '@prisma/client';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: any;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
        metadata: params.metadata,
      },
    });

    return { success: true, notification };
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  }
}

export async function notifyLeadAssigned(leadId: string, userId: string, leadName: string) {
  return createNotification({
    userId,
    type: 'LEAD_ASSIGNED',
    title: 'New Lead Assigned',
    message: `You have been assigned a new lead: ${leadName}`,
    link: `/leads/${leadId}`,
    metadata: { leadId },
  });
}

export async function notifyTaskAssigned(taskId: string, userId: string, taskSubject: string) {
  return createNotification({
    userId,
    type: 'TASK_ASSIGNED',
    title: 'New Task Assigned',
    message: `You have been assigned a new task: ${taskSubject}`,
    link: `/tasks?taskId=${taskId}`,
    metadata: { taskId },
  });
}

export async function notifyOpportunityWon(opportunityId: string, userId: string, opportunityName: string, amount: number) {
  return createNotification({
    userId,
    type: 'OPPORTUNITY_WON',
    title: 'Opportunity Won!',
    message: `Congratulations! ${opportunityName} has been won for $${amount.toLocaleString()}`,
    link: `/opportunities/${opportunityId}`,
    metadata: { opportunityId, amount },
  });
}

export async function notifyOpportunityLost(opportunityId: string, userId: string, opportunityName: string) {
  return createNotification({
    userId,
    type: 'OPPORTUNITY_LOST',
    title: 'Opportunity Lost',
    message: `${opportunityName} has been marked as lost`,
    link: `/opportunities/${opportunityId}`,
    metadata: { opportunityId },
  });
}

export async function notifyWorkflowTriggered(userId: string, workflowName: string, objectType: string, objectId: string) {
  return createNotification({
    userId,
    type: 'WORKFLOW_TRIGGERED',
    title: 'Workflow Executed',
    message: `Workflow "${workflowName}" has been triggered for ${objectType}`,
    link: `/${objectType.toLowerCase()}s/${objectId}`,
    metadata: { workflowName, objectType, objectId },
  });
}

export async function notifySystem(userId: string, title: string, message: string, link?: string) {
  return createNotification({
    userId,
    type: 'SYSTEM',
    title,
    message,
    link,
  });
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error.message };
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error: error.message };
  }
}

export async function getUnreadCount(userId: string) {
  try {
    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { success: true, count };
  } catch (error: any) {
    console.error('Error getting unread count:', error);
    return { success: false, error: error.message, count: 0 };
  }
}
