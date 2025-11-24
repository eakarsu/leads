import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [
      opportunities,
      contacts,
      tasks,
      events,
      products,
      emailTemplates,
      territories,
      emails,
    ] = await Promise.all([
      prisma.opportunity.count(),
      prisma.contact.count(),
      prisma.task.count(),
      prisma.event.count(),
      prisma.product.count(),
      prisma.emailTemplate.count(),
      prisma.territory.count(),
      prisma.email.count(),
    ]);

    // Get sample opportunities
    const sampleOpportunities = await prisma.opportunity.findMany({
      take: 5,
      include: {
        client: true,
        contact: true,
        owner: true,
      },
    });

    return NextResponse.json({
      counts: {
        opportunities,
        contacts,
        tasks,
        events,
        products,
        emailTemplates,
        territories,
        emails,
      },
      sampleOpportunities: sampleOpportunities.map((opp) => ({
        id: opp.id,
        name: opp.name,
        client: opp.client.name,
        stage: opp.stage,
        amount: opp.amount,
        owner: opp.owner.name,
      })),
    });
  } catch (error: any) {
    console.error('Error counting data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
