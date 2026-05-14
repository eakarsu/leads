import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/webhooks/deliveries?subscriptionId=xxx&success=false&limit=50
 * Fetch delivery log entries.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subscriptionId = searchParams.get('subscriptionId');
    const successParam = searchParams.get('success');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200);

    const where = {
      ...(subscriptionId && { subscriptionId }),
      ...(successParam !== null && { success: successParam === 'true' }),
    };

    const deliveries = await prisma.webhookDelivery.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        subscription: { select: { id: true, url: true, name: true } },
      },
    });

    return NextResponse.json({ deliveries, total: deliveries.length });
  } catch (error: any) {
    console.error('Error fetching webhook deliveries:', error);
    return NextResponse.json({ error: 'Failed to fetch webhook deliveries' }, { status: 500 });
  }
}
