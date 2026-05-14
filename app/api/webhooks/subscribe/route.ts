import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const VALID_EVENTS = [
  'lead.created',
  'lead.updated',
  'lead.deleted',
  'deal.created',
  'deal.updated',
  'deal.closed',
  'opportunity.won',
  'opportunity.lost',
  'contact.created',
  'campaign.completed',
] as const;

/**
 * POST /api/webhooks/subscribe
 * Register a URL to receive CRM events.
 *
 * Body:
 * {
 *   url: string,
 *   events: string[],   // subset of VALID_EVENTS
 *   name?: string,
 *   secret?: string,    // optional HMAC secret
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { url, events, name, secret } = body as {
      url: string;
      events: string[];
      name?: string;
      secret?: string;
    };

    if (!url) {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'url must be a valid URL' }, { status: 400 });
    }

    if (!events?.length) {
      return NextResponse.json({ error: 'events array is required and must not be empty' }, { status: 400 });
    }

    const invalidEvents = events.filter((e) => !VALID_EVENTS.includes(e as any));
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid event types: ${invalidEvents.join(', ')}`,
          validEvents: VALID_EVENTS,
        },
        { status: 400 }
      );
    }

    const subscription = await prisma.webhookSubscription.create({
      data: {
        url,
        events,
        name: name ?? null,
        secret: secret ?? null,
        createdBy: session.user.id,
        isActive: true,
      },
    });

    // Never return the secret in the response
    const { secret: _omit, ...safeSubscription } = subscription as any;

    return NextResponse.json({ subscription: safeSubscription }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating webhook subscription:', error);
    return NextResponse.json({ error: 'Failed to create webhook subscription' }, { status: 500 });
  }
}

/**
 * GET /api/webhooks/subscribe
 * List all webhook subscriptions (secrets redacted).
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptions = await prisma.webhookSubscription.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { deliveries: true } },
      },
    });

    // Redact secrets
    const safe = subscriptions.map(({ secret: _s, ...rest }) => rest);

    return NextResponse.json({ subscriptions: safe });
  } catch (error: any) {
    console.error('Error listing webhook subscriptions:', error);
    return NextResponse.json({ error: 'Failed to list webhook subscriptions' }, { status: 500 });
  }
}

/**
 * DELETE /api/webhooks/subscribe?id=xxx
 * Deactivate (soft-delete) a subscription.
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await prisma.webhookSubscription.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting webhook subscription:', error);
    return NextResponse.json({ error: 'Failed to delete webhook subscription' }, { status: 500 });
  }
}
