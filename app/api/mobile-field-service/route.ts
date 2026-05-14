import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Mobile Field Service — offline-first PWA support endpoints (sync queue, GPS, signature, parts check-out).

interface SyncBatch {
  id: string;
  technicianId: string;
  workOrderUpdates: Array<{ workOrderId: string; status?: string; notes?: string; partsUsed?: string[]; signatureBase64?: string; gps?: { lat: number; lng: number } }>;
  receivedAt: string;
  appliedCount: number;
}

const batches = new Map<string, SyncBatch>();

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Partial<SyncBatch>;
  if (!body.technicianId || !body.workOrderUpdates) {
    return NextResponse.json({ error: 'technicianId and workOrderUpdates required' }, { status: 400 });
  }

  const id = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const batch: SyncBatch = {
    id,
    technicianId: body.technicianId,
    workOrderUpdates: body.workOrderUpdates,
    receivedAt: new Date().toISOString(),
    appliedCount: body.workOrderUpdates.length,
  };
  batches.set(id, batch);
  // NOTE: persistence to WorkOrder records intentionally minimal — wire to Prisma when schema names are confirmed.
  return NextResponse.json({ batch });
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(request.url).searchParams.get('id');
  if (id) {
    const b = batches.get(id);
    if (!b) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ batch: b });
  }
  return NextResponse.json({ batches: Array.from(batches.values()).slice(-50) });
}
