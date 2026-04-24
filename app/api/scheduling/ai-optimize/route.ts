import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { callOpenRouter } from '@/lib/openrouter';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { date, territoryId } = body;

    // Fetch pending work orders
    const workOrders = await prisma.workOrder.findMany({
      where: {
        status: { in: ['NEW', 'PENDING', 'OPEN'] },
        ...(territoryId ? { territoryId } : {}),
      },
      include: {
        workType: true,
        territory: { select: { name: true } },
      },
      take: 20,
    });

    // Fetch available resources
    const resources = await prisma.serviceResource.findMany({
      where: {
        isActive: true,
        ...(territoryId ? { territoryId } : {}),
      },
      include: {
        skills: { include: { skill: true } },
        territory: { select: { name: true } },
      },
    });

    // Fetch existing appointments for the date
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await prisma.serviceAppointment.findMany({
      where: {
        scheduledStart: { gte: startOfDay, lte: endOfDay },
        status: { in: ['SCHEDULED', 'DISPATCHED'] },
      },
      include: { resource: { select: { name: true } } },
    });

    const prompt = `Optimize the field service schedule for ${targetDate.toISOString().split('T')[0]}.

WORK ORDERS TO SCHEDULE (${workOrders.length}):
${workOrders.map(wo => `- ${wo.workOrderNumber}: ${wo.subject} (Priority: ${wo.priority}, Duration: ${wo.workType?.estimatedDurationMinutes || 60}min, Territory: ${wo.territory?.name || 'Unassigned'}, Location: ${wo.city || 'N/A'}, ${wo.state || 'N/A'})`).join('\n')}

AVAILABLE RESOURCES (${resources.length}):
${resources.map(r => `- ${r.name} (Skills: ${r.skills.map(s => s.skill.name).join(', ') || 'None'}, Territory: ${r.territory?.name || 'Unassigned'}, Efficiency: ${r.efficiencyRating || 'N/A'})`).join('\n')}

EXISTING APPOINTMENTS: ${existingAppointments.length}

Create an optimized schedule. Respond with ONLY a JSON object:
{
  "schedule": [
    {
      "workOrderNumber": "WO-000001",
      "resourceName": "John Doe",
      "suggestedTime": "09:00",
      "reason": "Best skill match, closest location"
    }
  ],
  "unschedulable": ["WO-000003"],
  "insights": ["insight1", "insight2"],
  "utilizationScore": 85
}`;

    const response = await callOpenRouter(
      prompt,
      'You are a field service scheduling optimization AI. Create efficient schedules that minimize travel time and match skills. Always respond with valid JSON only.'
    );

    let parsed;
    try {
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = { schedule: [], unschedulable: [], insights: [response], utilizationScore: 0 };
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Error optimizing schedule:', error);
    return NextResponse.json({ error: 'Failed to optimize schedule' }, { status: 500 });
  }
}
