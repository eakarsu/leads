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
    const { territoryId, dateRange } = body;

    // Get resource counts
    const resourceWhere: any = { isActive: true };
    if (territoryId) resourceWhere.territoryId = territoryId;

    const resources = await prisma.serviceResource.findMany({
      where: resourceWhere,
      select: { id: true, name: true, efficiencyRating: true },
    });

    // Get work order backlog
    const woWhere: any = { status: { in: ['NEW', 'PENDING', 'OPEN'] } };
    if (territoryId) woWhere.territoryId = territoryId;

    const pendingWorkOrders = await prisma.workOrder.count({ where: woWhere });
    const workOrdersByPriority = await prisma.workOrder.groupBy({
      by: ['priority'],
      where: woWhere,
      _count: true,
    });

    // Get upcoming appointments
    const now = new Date();
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingAppointments = await prisma.serviceAppointment.count({
      where: {
        scheduledStart: { gte: now, lte: weekEnd },
        status: { in: ['SCHEDULED', 'DISPATCHED'] },
        ...(territoryId ? { territoryId } : {}),
      },
    });

    // Get absences this week
    const absences = await prisma.resourceAbsence.count({
      where: {
        startTime: { lte: weekEnd },
        endTime: { gte: now },
        ...(territoryId
          ? { resource: { territoryId } }
          : {}),
      },
    });

    const prompt = `Analyze field service capacity and provide planning recommendations:

CAPACITY DATA:
- Active Resources: ${resources.length}
- Pending Work Orders: ${pendingWorkOrders}
- Work Orders by Priority: ${workOrdersByPriority.map(w => `${w.priority}: ${w._count}`).join(', ')}
- Upcoming Appointments (7 days): ${upcomingAppointments}
- Resource Absences (7 days): ${absences}
- Average Efficiency: ${resources.length > 0 ? (resources.reduce((sum, r) => sum + (r.efficiencyRating || 3), 0) / resources.length).toFixed(1) : 'N/A'}

Respond with ONLY a JSON object:
{
  "capacityScore": 75,
  "capacityStatus": "ADEQUATE",
  "workloadPerResource": 3.5,
  "bottlenecks": ["description of bottleneck"],
  "recommendations": [
    {"action": "Hire 2 more technicians", "priority": "HIGH", "impact": "Reduce backlog by 40%"}
  ],
  "forecast": {
    "nextWeek": "Manageable with current staff",
    "nextMonth": "May need additional resources"
  },
  "riskFactors": ["risk description"]
}`;

    const response = await callOpenRouter(
      prompt,
      'You are a workforce capacity planning AI for field service operations. Analyze workload data and provide actionable recommendations. Always respond with valid JSON only.'
    );

    let parsed;
    try {
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = {
        capacityScore: 50,
        capacityStatus: 'UNKNOWN',
        workloadPerResource: pendingWorkOrders / Math.max(resources.length, 1),
        bottlenecks: [],
        recommendations: [{ action: response, priority: 'MEDIUM', impact: 'See AI analysis' }],
        forecast: {},
        riskFactors: [],
      };
    }

    return NextResponse.json({
      ...parsed,
      rawData: {
        totalResources: resources.length,
        pendingWorkOrders,
        upcomingAppointments,
        absences,
        workOrdersByPriority,
      },
    });
  } catch (error) {
    console.error('Error analyzing capacity:', error);
    return NextResponse.json({ error: 'Failed to analyze capacity' }, { status: 500 });
  }
}
