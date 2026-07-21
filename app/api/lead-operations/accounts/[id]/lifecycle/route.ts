import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiError, parseJson } from '@/lib/lead-operations/api';
import { requireOperationsActor } from '@/lib/lead-operations/auth';
import { updateAccountLifecycle } from '@/lib/lead-operations/service';

const schema = z.object({ stage: z.enum(['PROSPECT', 'ACTIVE_CUSTOMER', 'PARTNER', 'SUSPENDED', 'ARCHIVED']), reason: z.string().trim().min(3).max(1000) }).strict();
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireOperationsActor(['ADMIN']);
    const body = await parseJson(request, schema);
    const { id } = await params;
    return NextResponse.json(await updateAccountLifecycle(prisma, { clientId: id, actorId: actor.id, ...body }));
  } catch (error) { return apiError(error); }
}
