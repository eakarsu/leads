import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/lead-operations/api';
import { LeadOperationsError } from '@/lib/lead-operations/errors';
import { queueSyncOperation } from '@/lib/lead-operations/service';

function signatureMatches(secret: string, timestamp: string, body: string, supplied: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${body}`).digest();
  const raw = supplied.startsWith('sha256=') ? supplied.slice(7) : supplied;
  let actual: Buffer;
  try { actual = Buffer.from(raw, 'hex'); } catch { return false; }
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ connectorId: string }> }) {
  try {
    const length = Number(request.headers.get('content-length') || 0);
    if (length > 1024 * 1024) throw new LeadOperationsError('PAYLOAD_TOO_LARGE', 'Webhook body exceeds 1 MiB', 413);
    const { connectorId } = await params;
    const connector = await prisma.leadConnector.findUnique({ where: { id: connectorId } });
    if (!connector || !connector.enabled || !['INBOUND', 'BOTH'].includes(connector.syncDirection)) {
      throw new LeadOperationsError('CONNECTOR_NOT_FOUND', 'Enabled inbound connector not found', 404);
    }
    const timestamp = request.headers.get('x-sync-timestamp') || '';
    const parsedTimestamp = Number(timestamp);
    if (!Number.isFinite(parsedTimestamp) || Math.abs(Date.now() - parsedTimestamp * 1000) > 5 * 60 * 1000) {
      throw new LeadOperationsError('WEBHOOK_TIMESTAMP_INVALID', 'Webhook timestamp is outside the five-minute window', 401);
    }
    const secret = process.env[connector.webhookSecretRef];
    if (!secret || secret.length < 32) throw new LeadOperationsError('WEBHOOK_SECRET_MISSING', 'Connector webhook secret is not configured', 503);
    const bodyText = await request.text();
    if (Buffer.byteLength(bodyText) > 1024 * 1024) throw new LeadOperationsError('PAYLOAD_TOO_LARGE', 'Webhook body exceeds 1 MiB', 413);
    const signature = request.headers.get('x-sync-signature') || '';
    if (!signatureMatches(secret, timestamp, bodyText, signature)) throw new LeadOperationsError('WEBHOOK_SIGNATURE_INVALID', 'Webhook signature is invalid', 401);
    let body: Record<string, unknown>;
    try { body = JSON.parse(bodyText) as Record<string, unknown>; } catch { throw new LeadOperationsError('INVALID_JSON', 'Webhook body must be JSON'); }
    const externalId = request.headers.get('x-external-id') || String(body.externalId || '');
    const idempotencyKey = request.headers.get('idempotency-key') || String(body.idempotencyKey || '');
    const entityType = String(body.entityType || connector.kind);
    if (!externalId || !idempotencyKey) throw new LeadOperationsError('WEBHOOK_IDENTITY_REQUIRED', 'External ID and idempotency key are required');
    const operation = await queueSyncOperation(prisma, {
      clientId: connector.clientId,
      actorId: connector.serviceUserId,
      connectorId: connector.id,
      direction: 'INBOUND',
      entityType,
      externalId,
      idempotencyKey,
      payload: body,
    });
    return NextResponse.json({ operationId: operation.id, status: operation.status }, { status: 202 });
  } catch (error) { return apiError(error); }
}
