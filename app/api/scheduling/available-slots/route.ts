import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { timeToMinutes, subtractIntervals, generateSlots, getDayFields, TimeWindow } from '@/lib/scheduling-utils';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { workOrderId, date, territoryId, skillRequirements } = body;

    if (!workOrderId || !date) {
      return NextResponse.json({ error: 'workOrderId and date are required' }, { status: 400 });
    }

    // Get work order details
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: { workType: true, territory: true },
    });

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    const durationMinutes = workOrder.workType?.estimatedDurationMinutes || 60;
    const targetTerritoryId = territoryId || workOrder.territoryId;

    // Find eligible resources: territory members in the target territory
    const resourceFilter: any = { isActive: true };
    if (targetTerritoryId) {
      const territoryMembers = await prisma.territoryMember.findMany({
        where: { territoryId: targetTerritoryId },
        select: { resourceId: true },
      });
      const memberIds = territoryMembers.map(m => m.resourceId);
      resourceFilter.id = { in: memberIds };
    }

    // If skill requirements specified, filter resources by skills
    if (skillRequirements && skillRequirements.length > 0) {
      const skilledResources = await prisma.serviceResourceSkill.findMany({
        where: {
          skill: { name: { in: skillRequirements } },
        },
        select: { resourceId: true },
      });
      const skilledIds = new Set(skilledResources.map(s => s.resourceId));
      if (resourceFilter.id) {
        resourceFilter.id.in = (resourceFilter.id.in as string[]).filter((id: string) => skilledIds.has(id));
      } else {
        resourceFilter.id = { in: Array.from(skilledIds) };
      }
    }

    const resources = await prisma.serviceResource.findMany({
      where: resourceFilter,
      include: {
        skills: { include: { skill: true } },
      },
    });

    // Get operating hours for the date
    const targetDate = new Date(date);
    const dayFields = getDayFields(targetDate);

    const operatingHoursRecords = await prisma.operatingHours.findMany({
      where: { status: 'ACTIVE' },
      take: 1,
    });

    // Default operating hours if none configured
    let defaultStart = timeToMinutes('08:00');
    let defaultEnd = timeToMinutes('17:00');

    if (operatingHoursRecords.length > 0) {
      const oh = operatingHoursRecords[0] as any;
      const startVal = oh[dayFields.startField];
      const endVal = oh[dayFields.endField];
      if (startVal && endVal) {
        defaultStart = timeToMinutes(startVal);
        defaultEnd = timeToMinutes(endVal);
      }
    }

    // For each resource, calculate available slots
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const resourceSlots = await Promise.all(
      resources.map(async (resource) => {
        // Get busy intervals: existing appointments + absences
        const appointments = await prisma.serviceAppointment.findMany({
          where: {
            resourceId: resource.id,
            status: { in: ['SCHEDULED', 'DISPATCHED', 'IN_PROGRESS'] },
            scheduledStart: { gte: startOfDay, lte: endOfDay },
          },
        });

        const absences = await prisma.resourceAbsence.findMany({
          where: {
            resourceId: resource.id,
            startTime: { lte: endOfDay },
            endTime: { gte: startOfDay },
          },
        });

        const busyIntervals: TimeWindow[] = [];

        for (const apt of appointments) {
          if (apt.scheduledStart && apt.scheduledEnd) {
            busyIntervals.push({
              start: apt.scheduledStart.getHours() * 60 + apt.scheduledStart.getMinutes(),
              end: apt.scheduledEnd.getHours() * 60 + apt.scheduledEnd.getMinutes(),
            });
          }
        }

        for (const abs of absences) {
          busyIntervals.push({
            start: Math.max(abs.startTime.getHours() * 60 + abs.startTime.getMinutes(), defaultStart),
            end: Math.min(abs.endTime.getHours() * 60 + abs.endTime.getMinutes(), defaultEnd),
          });
        }

        // Sort busy intervals by start time
        busyIntervals.sort((a, b) => a.start - b.start);

        // Subtract busy from free
        const freeWindows = subtractIntervals(
          [{ start: defaultStart, end: defaultEnd }],
          busyIntervals
        );

        // Generate slots
        const slots = generateSlots(freeWindows, durationMinutes);

        return {
          resource: {
            id: resource.id,
            name: resource.name,
            email: resource.email,
            phone: resource.phone,
            efficiencyRating: resource.efficiencyRating,
            skills: resource.skills.map(s => ({
              name: s.skill.name,
              level: s.skillLevel,
            })),
          },
          availableSlots: slots,
          existingAppointments: appointments.length,
        };
      })
    );

    // Filter out resources with no available slots
    const availableResources = resourceSlots.filter(r => r.availableSlots.length > 0);

    return NextResponse.json({
      workOrder: {
        id: workOrder.id,
        workOrderNumber: workOrder.workOrderNumber,
        subject: workOrder.subject,
        durationMinutes,
      },
      date,
      resources: availableResources,
      totalResources: resources.length,
      availableResources: availableResources.length,
    });
  } catch (error) {
    console.error('Error finding available slots:', error);
    return NextResponse.json({ error: 'Failed to find available slots' }, { status: 500 });
  }
}
