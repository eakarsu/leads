import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Get approval processes and pending approvals
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'processes' or 'pending'
    const objectType = searchParams.get('objectType');
    const submittedBy = searchParams.get('submittedBy');

    // Get submissions by current user
    if (submittedBy === 'me') {
      const submissions = await prisma.approvalInstance.findMany({
        where: { submittedBy: session.user.id },
        include: {
          process: {
            include: { steps: { orderBy: { stepNumber: 'asc' } } },
          },
          actions: { orderBy: { actionAt: 'desc' } },
        },
        orderBy: { submittedAt: 'desc' },
      });
      return NextResponse.json(submissions);
    }

    if (type === 'processes') {
      const where: any = { isActive: true };
      if (objectType) where.objectType = objectType;

      const processes = await prisma.approvalProcess.findMany({
        where,
        include: {
          steps: { orderBy: { stepNumber: 'asc' } },
          _count: { select: { instances: true } },
        },
        orderBy: { name: 'asc' },
      });

      return NextResponse.json(processes);
    }

    // Get pending approval instances for current user
    const pendingApprovals = await prisma.approvalInstance.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        process: {
          include: {
            steps: { orderBy: { stepNumber: 'asc' } },
          },
        },
        actions: { orderBy: { actionAt: 'desc' } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    // Filter approvals where current user is an approver for the current step
    const userPendingApprovals = pendingApprovals.filter((instance) => {
      const currentStep = instance.process.steps.find(
        (s) => s.stepNumber === instance.currentStep
      );
      return currentStep?.approverIds.includes(session.user.id);
    });

    return NextResponse.json(userPendingApprovals);
  } catch (error: any) {
    console.error('Error fetching approvals:', error);
    return NextResponse.json({ error: 'Failed to fetch approvals' }, { status: 500 });
  }
}

// Create approval process
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, objectType, entryCriteria, allowRecall, steps } = body;

    if (!name || !objectType) {
      return NextResponse.json(
        { error: 'Name and object type are required' },
        { status: 400 }
      );
    }

    const process = await prisma.approvalProcess.create({
      data: {
        name,
        description,
        objectType,
        entryCriteria: entryCriteria || {},
        allowRecall: allowRecall ?? true,
        steps: steps
          ? {
              create: steps.map((step: any, index: number) => ({
                stepNumber: index + 1,
                name: step.name,
                description: step.description,
                approverType: step.approverType || 'USER',
                approverIds: step.approverIds || [],
                unanimousApproval: step.unanimousApproval || false,
                rejectBehavior: step.rejectBehavior || 'FINAL',
              })),
            }
          : undefined,
      },
      include: {
        steps: { orderBy: { stepNumber: 'asc' } },
      },
    });

    return NextResponse.json(process, { status: 201 });
  } catch (error: any) {
    console.error('Error creating approval process:', error);
    return NextResponse.json({ error: 'Failed to create approval process' }, { status: 500 });
  }
}

// Submit for approval or take action on approval
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, instanceId, processId, objectType, objectId, comments } = body;

    // Submit for approval
    if (action === 'submit') {
      if (!processId || !objectType || !objectId) {
        return NextResponse.json(
          { error: 'Process ID, object type, and object ID are required' },
          { status: 400 }
        );
      }

      const instance = await prisma.approvalInstance.create({
        data: {
          processId,
          objectType,
          objectId,
          submittedBy: session.user.id,
          comments,
        },
        include: {
          process: {
            include: { steps: true },
          },
        },
      });

      return NextResponse.json(instance);
    }

    // Approve or reject
    if (action === 'approve' || action === 'reject') {
      if (!instanceId) {
        return NextResponse.json({ error: 'Instance ID is required' }, { status: 400 });
      }

      const instance = await prisma.approvalInstance.findUnique({
        where: { id: instanceId },
        include: {
          process: {
            include: { steps: { orderBy: { stepNumber: 'asc' } } },
          },
        },
      });

      if (!instance) {
        return NextResponse.json({ error: 'Approval instance not found' }, { status: 404 });
      }

      // Record the action
      await prisma.approvalAction.create({
        data: {
          instanceId,
          stepNumber: instance.currentStep,
          actorId: session.user.id,
          action: action === 'approve' ? 'APPROVED' : 'REJECTED',
          comments,
        },
      });

      // Update instance status
      if (action === 'reject') {
        await prisma.approvalInstance.update({
          where: { id: instanceId },
          data: {
            status: 'REJECTED',
            completedAt: new Date(),
          },
        });
      } else {
        // Check if there are more steps
        const maxStep = instance.process.steps.length;
        if (instance.currentStep >= maxStep) {
          await prisma.approvalInstance.update({
            where: { id: instanceId },
            data: {
              status: 'APPROVED',
              completedAt: new Date(),
            },
          });
        } else {
          await prisma.approvalInstance.update({
            where: { id: instanceId },
            data: {
              currentStep: instance.currentStep + 1,
            },
          });
        }
      }

      const updatedInstance = await prisma.approvalInstance.findUnique({
        where: { id: instanceId },
        include: {
          process: true,
          actions: { orderBy: { actionAt: 'desc' } },
        },
      });

      return NextResponse.json(updatedInstance);
    }

    // Recall
    if (action === 'recall') {
      if (!instanceId) {
        return NextResponse.json({ error: 'Instance ID is required' }, { status: 400 });
      }

      const instance = await prisma.approvalInstance.findUnique({
        where: { id: instanceId },
        include: { process: true },
      });

      if (!instance) {
        return NextResponse.json({ error: 'Approval instance not found' }, { status: 404 });
      }

      if (!instance.process.allowRecall) {
        return NextResponse.json({ error: 'Recall is not allowed for this process' }, { status: 400 });
      }

      if (instance.submittedBy !== session.user.id) {
        return NextResponse.json({ error: 'Only the submitter can recall' }, { status: 403 });
      }

      await prisma.approvalAction.create({
        data: {
          instanceId,
          stepNumber: instance.currentStep,
          actorId: session.user.id,
          action: 'RECALLED',
          comments,
        },
      });

      const updatedInstance = await prisma.approvalInstance.update({
        where: { id: instanceId },
        data: {
          status: 'RECALLED',
          completedAt: new Date(),
        },
        include: {
          process: true,
          actions: { orderBy: { actionAt: 'desc' } },
        },
      });

      return NextResponse.json(updatedInstance);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error processing approval:', error);
    return NextResponse.json({ error: 'Failed to process approval' }, { status: 500 });
  }
}
