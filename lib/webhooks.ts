/**
 * Webhook delivery utility
 * - Dispatches events to registered subscriber URLs
 * - Retries up to 3 times with exponential backoff (1s, 4s, 16s)
 * - Logs every attempt in WebhookDelivery
 */

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export type WebhookEventType =
  | 'lead.created'
  | 'lead.updated'
  | 'lead.deleted'
  | 'deal.created'
  | 'deal.updated'
  | 'deal.closed'
  | 'opportunity.won'
  | 'opportunity.lost'
  | 'contact.created'
  | 'campaign.completed';

interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: Record<string, any>;
}

const MAX_ATTEMPTS = 3;
/** Backoff delays in ms: attempt 0→1s, 1→4s, 2→16s */
const BACKOFF_MS = [1000, 4000, 16000];

/**
 * Fire a webhook event to all active subscribers for that event type.
 * Runs asynchronously — does NOT block the calling request.
 */
export function emitWebhookEvent(
  event: WebhookEventType,
  data: Record<string, any>
): void {
  // Fire-and-forget with error swallowing at top level
  _dispatchEvent(event, data).catch((err) =>
    console.error('[webhooks] top-level dispatch error:', err)
  );
}

async function _dispatchEvent(
  event: WebhookEventType,
  data: Record<string, any>
): Promise<void> {
  const subscribers = await prisma.webhookSubscription.findMany({
    where: { isActive: true, events: { has: event } },
  });

  if (subscribers.length === 0) return;

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  await Promise.all(
    subscribers.map((sub) => _deliverWithRetry(sub, payload))
  );
}

async function _deliverWithRetry(
  sub: { id: string; url: string; secret: string | null },
  payload: WebhookPayload
): Promise<void> {
  // Create delivery record
  const delivery = await prisma.webhookDelivery.create({
    data: {
      subscriptionId: sub.id,
      eventType: payload.event,
      payload: payload as any,
      attempts: 0,
    },
  });

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await _sleep(BACKOFF_MS[attempt - 1]);
    }

    try {
      const body = JSON.stringify(payload);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'LeadGenFlow-AI-Webhooks/1.0',
        'X-Webhook-Event': payload.event,
        'X-Delivery-Id': delivery.id,
        'X-Attempt': String(attempt + 1),
      };

      // HMAC signature if secret configured
      if (sub.secret) {
        const sig = crypto
          .createHmac('sha256', sub.secret)
          .update(body)
          .digest('hex');
        headers['X-Webhook-Signature'] = `sha256=${sig}`;
      }

      const resp = await fetch(sub.url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(10000), // 10s timeout per attempt
      });

      const responseBody = (await resp.text()).slice(0, 2000);
      const success = resp.status >= 200 && resp.status < 300;

      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          attempts: attempt + 1,
          statusCode: resp.status,
          responseBody,
          success,
          nextRetryAt: success || attempt === MAX_ATTEMPTS - 1 ? null : new Date(Date.now() + BACKOFF_MS[attempt]),
        },
      });

      if (success) return; // Done
    } catch (err: any) {
      const isLastAttempt = attempt === MAX_ATTEMPTS - 1;
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          attempts: attempt + 1,
          responseBody: `Error: ${err.message}`.slice(0, 2000),
          success: false,
          nextRetryAt: isLastAttempt ? null : new Date(Date.now() + BACKOFF_MS[attempt]),
        },
      });
    }
  }
}

function _sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
