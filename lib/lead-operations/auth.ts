import { getServerSession } from 'next-auth';
import { UserRole } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { LeadOperationsError } from './errors';

export type OperationsActor = {
  id: string;
  role: UserRole;
  clientId: string | null;
};

export async function requireOperationsActor(
  allowedRoles?: UserRole[],
): Promise<OperationsActor> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.invalid) {
    throw new LeadOperationsError('UNAUTHENTICATED', 'Authentication is required', 401);
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, clientId: true, status: true, authVersion: true },
  });
  if (!user || user.status !== 'ACTIVE' || user.authVersion !== session.user.authVersion) {
    throw new LeadOperationsError('SESSION_REVOKED', 'This session is no longer active', 401);
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new LeadOperationsError('FORBIDDEN', 'This role cannot perform the operation', 403);
  }
  return { id: user.id, role: user.role, clientId: user.clientId };
}

export function scopedClientId(actor: OperationsActor, requested?: string | null): string {
  if (actor.role === 'CLIENT') {
    if (!actor.clientId) throw new LeadOperationsError('TENANT_REQUIRED', 'The user has no client account', 403);
    if (requested && requested !== actor.clientId) {
      throw new LeadOperationsError('TENANT_MISMATCH', 'Cross-client access is not allowed', 403);
    }
    return actor.clientId;
  }
  if (!requested) throw new LeadOperationsError('TENANT_REQUIRED', 'A clientId is required');
  return requested;
}
