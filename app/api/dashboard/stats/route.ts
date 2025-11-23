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
    ] = await Promise.all([
      prisma.clientCompany.count(),
      prisma.campaign.count(),
      prisma.campaign.count({ where: { status: 'ACTIVE' } }),
      prisma.lead.count(),
      prisma.lead.count({ where: { status: 'QUALIFIED' } }),
      prisma.lead.count({ where: { status: 'WON' } }),
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
