import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { workOrderId, resourceId, date, startTime, endTime, territoryId } = body;

    if (!workOrderId || !resourceId || !date || !startTime) {
      return NextResponse.json(
        { error: 'workOrderId, resourceId, date, and startTime are required' },
        { status: 400 }
      );
    }

    // Verify work order exists and is schedulable
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: { workType: true },
    });

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    if (['COMPLETED', 'CANCELLED', 'CLOSED'].includes(workOrder.status)) {
      return NextResponse.json(
        { error: 'Work order is not in a schedulable status' },
        { status: 400 }
      );
    }

    // Verify resource exists
    const resource = await prisma.serviceResource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Calculate times
    const durationMinutes = workOrder.workType?.estimatedDurationMinutes || 60;
    const [startHour, startMin] = startTime.split(':').map(Number);

    const scheduledStart = new Date(date);
    scheduledStart.setHours(startHour, startMin, 0, 0);

    let scheduledEnd: Date;
    if (endTime) {
      const [endHour, endMin] = endTime.split(':').map(Number);
      scheduledEnd = new Date(date);
      scheduledEnd.setHours(endHour, endMin, 0, 0);
    } else {
      scheduledEnd = new Date(scheduledStart.getTime() + durationMinutes * 60 * 1000);
    }

    // Use transaction to create appointment and update work order atomically
    const result = await prisma.$transaction(async (tx) => {
      // Generate appointment number
      const count = await tx.serviceAppointment.count();
      const appointmentNumber = `SA-${String(count + 1).padStart(6, '0')}`;

      // Create service appointment
      const appointment = await tx.serviceAppointment.create({
        data: {
          appointmentNumber,
          workOrderId,
          subject: workOrder.subject,
          status: 'SCHEDULED',
          scheduledStart,
          scheduledEnd,
          durationMinutes,
          resourceId,
          territoryId: territoryId || workOrder.territoryId,
          address: workOrder.address,
          city: workOrder.city,
          state: workOrder.state,
        },
      });

      // Update work order status
      const updatedWorkOrder = await tx.workOrder.update({
        where: { id: workOrderId },
        data: { status: 'IN_PROGRESS' },
      });

      return { appointment, workOrder: updatedWorkOrder };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error booking appointment:', error);
    return NextResponse.json({ error: 'Failed to book appointment' }, { status: 500 });
  }
}
