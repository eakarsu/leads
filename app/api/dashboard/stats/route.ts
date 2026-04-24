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

    // Get counts
    const [
      totalClients,
      totalCampaigns,
      activeCampaigns,
      totalLeads,
      qualifiedLeads,
      wonLeads,
      openCases,
      activeContracts,
      pendingTasks,
      totalOpportunities,
    ] = await Promise.all([
      prisma.clientCompany.count(),
      prisma.campaign.count(),
      prisma.campaign.count({ where: { status: 'ACTIVE' } }),
      prisma.lead.count(),
      prisma.lead.count({ where: { status: 'QUALIFIED' } }),
      prisma.lead.count({ where: { status: 'WON' } }),
      prisma.case.count({ where: { status: { in: ['NEW', 'OPEN', 'IN_PROGRESS', 'ESCALATED'] } } }),
      prisma.contract.count({ where: { status: 'ACTIVATED' } }),
      prisma.task.count({ where: { status: { in: ['NOT_STARTED', 'IN_PROGRESS'] } } }),
      prisma.opportunity.count({ where: { stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } } }),
    ]);

    // Get lead status breakdown
    const leadsByStatus = await prisma.lead.groupBy({
      by: ['status'],
      _count: true,
    });

    // Get recent activities
    const recentActivities = await prisma.leadActivity.findMany({
      take: 10,
      orderBy: {
        timestamp: 'desc',
      },
      include: {
        lead: {
          select: {
            id: true,
            fullName: true,
            company: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Get top campaigns by lead count
    const topCampaigns = await prisma.campaign.findMany({
      take: 5,
      include: {
        client: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            leads: true,
          },
        },
      },
      orderBy: {
        leads: {
          _count: 'desc',
        },
      },
    });

    const stats = {
      totalClients,
      totalCampaigns,
      activeCampaigns,
      totalLeads,
      qualifiedLeads,
      wonLeads,
      openCases,
      activeContracts,
      pendingTasks,
      totalOpportunities,
      leadsByStatus: leadsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      recentActivities,
      topCampaigns,
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
