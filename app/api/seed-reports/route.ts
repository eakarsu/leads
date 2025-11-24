import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Starting report snapshots seeding...');

    // Get all clients and campaigns
    const clients = await prisma.clientCompany.findMany({
      take: 20,
    });

    const campaigns = await prisma.campaign.findMany({
      take: 10,
    });

    if (clients.length === 0) {
      return NextResponse.json({ error: 'No clients found' }, { status: 400 });
    }

    let reportsCreated = 0;

    // Create report snapshots for the last 6 months
    const today = new Date();

    for (let monthsAgo = 0; monthsAgo < 6; monthsAgo++) {
      const periodEnd = new Date(today);
      periodEnd.setMonth(today.getMonth() - monthsAgo);
      periodEnd.setDate(1); // First day of month

      const periodStart = new Date(periodEnd);
      periodStart.setMonth(periodEnd.getMonth() - 1);

      // Create 3-5 reports per month
      const numReportsThisMonth = 3 + Math.floor(Math.random() * 3);

      for (let i = 0; i < numReportsThisMonth && i < clients.length; i++) {
        const client = clients[i % clients.length];
        const campaign = Math.random() > 0.3 && campaigns.length > 0
          ? campaigns[Math.floor(Math.random() * campaigns.length)]
          : null;

        // Generate realistic metrics
        const emailsSent = 100 + Math.floor(Math.random() * 500);
        const delivered = Math.floor(emailsSent * (0.92 + Math.random() * 0.06)); // 92-98% delivered
        const opens = Math.floor(delivered * (0.15 + Math.random() * 0.25)); // 15-40% open rate
        const clicks = Math.floor(opens * (0.1 + Math.random() * 0.3)); // 10-40% click rate
        const replies = Math.floor(clicks * (0.05 + Math.random() * 0.15)); // 5-20% reply rate
        const bounced = emailsSent - delivered;
        const leadsGenerated = Math.floor(replies * (0.3 + Math.random() * 0.4)); // 30-70% convert to leads
        const opportunities = Math.floor(leadsGenerated * (0.4 + Math.random() * 0.3)); // 40-70% become opportunities
        const won = Math.floor(opportunities * (0.2 + Math.random() * 0.3)); // 20-50% win rate

        const openRate = delivered > 0 ? ((opens / delivered) * 100).toFixed(2) + '%' : '0%';
        const clickRate = opens > 0 ? ((clicks / opens) * 100).toFixed(2) + '%' : '0%';
        const replyRate = delivered > 0 ? ((replies / delivered) * 100).toFixed(2) + '%' : '0%';
        const conversionRate = opportunities > 0 ? ((won / opportunities) * 100).toFixed(2) + '%' : '0%';

        const metrics = {
          emailsSent,
          delivered,
          bounced,
          opens,
          openRate,
          clicks,
          clickRate,
          replies,
          replyRate,
          leadsGenerated,
          opportunities,
          won,
          conversionRate,
          revenue: won * (5000 + Math.floor(Math.random() * 50000)),
        };

        const aiSummaries = [
          `Strong performance this period with ${opens} email opens and ${replies} replies. Lead generation is up ${10 + Math.floor(Math.random() * 30)}% compared to last period. The campaign shows consistent engagement with ${client.name}.`,
          `Email engagement for ${client.name} shows healthy open rates at ${openRate}. ${won} opportunities closed this period. Consider increasing send volume to capitalize on strong performance.`,
          `${client.name} campaign delivered solid results with ${leadsGenerated} new leads generated. Click-through rate of ${clickRate} indicates strong message resonance. Focus on nurturing the ${opportunities} open opportunities.`,
          `This period's campaign achieved ${openRate} open rate and generated $${metrics.revenue.toLocaleString()} in revenue. The ${replies} responses indicate good audience targeting. Recommend continuing current strategy.`,
        ];

        await prisma.reportSnapshot.create({
          data: {
            clientId: client.id,
            campaignId: campaign?.id,
            periodStart,
            periodEnd,
            metrics,
            aiSummary: aiSummaries[Math.floor(Math.random() * aiSummaries.length)],
          },
        });

        reportsCreated++;
      }
    }

    console.log('Report snapshots seeding completed!');

    return NextResponse.json({
      success: true,
      message: 'Report snapshots seeded successfully',
      summary: {
        reportsCreated,
        clientsUsed: clients.length,
        campaignsUsed: campaigns.length,
      },
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
