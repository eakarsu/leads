import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const expectedMigration = '202607200001_governed_lead_operations';

export async function GET() {
  try {
    const rows = await prisma.$queryRaw<Array<{ migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }>>`
      SELECT "migration_name", "finished_at", "rolled_back_at"
      FROM "_prisma_migrations"
      ORDER BY "started_at" DESC
      LIMIT 1
    `;
    const latest = rows[0];
    if (!latest || latest.migration_name !== expectedMigration || !latest.finished_at || latest.rolled_back_at) {
      return NextResponse.json({ status: 'not_ready', reason: 'schema_not_current' }, { status: 503 });
    }
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ready', migration: expectedMigration });
  } catch {
    return NextResponse.json({ status: 'not_ready', reason: 'database_unavailable' }, { status: 503 });
  }
}
