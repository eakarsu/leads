import { Prisma } from '@prisma/client';
import { payloadHash, stableJson } from './identity';

export type AuditInput = {
  clientId: string;
  entityType: string;
  entityId: string;
  actorId: string;
  action: string;
  payload: Prisma.InputJsonValue;
};

export async function appendLeadAudit(
  tx: Prisma.TransactionClient,
  input: AuditInput,
): Promise<void> {
  const lockKey = `${input.clientId}:${input.entityType}:${input.entityId}`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

  const previous = await tx.leadOperationsAudit.findFirst({
    where: { entityType: input.entityType, entityId: input.entityId },
    orderBy: { sequence: 'desc' },
    select: { sequence: true, eventHash: true },
  });
  const sequence = (previous?.sequence || 0) + 1;
  const previousHash = previous?.eventHash || 'GENESIS';
  const eventHash = payloadHash({
    clientId: input.clientId,
    entityType: input.entityType,
    entityId: input.entityId,
    sequence,
    actorId: input.actorId,
    action: input.action,
    payload: JSON.parse(stableJson(input.payload)),
    previousHash,
  });

  await tx.leadOperationsAudit.create({
    data: { ...input, sequence, previousHash, eventHash },
  });
}

export async function verifyLeadAuditChain(
  tx: Prisma.TransactionClient,
  entityType: string,
  entityId: string,
): Promise<boolean> {
  const events = await tx.leadOperationsAudit.findMany({
    where: { entityType, entityId },
    orderBy: { sequence: 'asc' },
  });
  let previousHash = 'GENESIS';
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    if (event.sequence !== index + 1 || event.previousHash !== previousHash) return false;
    const expected = payloadHash({
      clientId: event.clientId,
      entityType: event.entityType,
      entityId: event.entityId,
      sequence: event.sequence,
      actorId: event.actorId,
      action: event.action,
      payload: JSON.parse(stableJson(event.payload)),
      previousHash: event.previousHash,
    });
    if (expected !== event.eventHash) return false;
    previousHash = event.eventHash;
  }
  return true;
}
