import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { seedAllFeatures } from '@/prisma/seed-all-features';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    const counts = await seedAllFeatures();

    return NextResponse.json({
      message: 'All features data seeded successfully',
      counts,
      totalRecords: Object.values(counts || {}).reduce((a: number, b: any) => a + (b as number), 0),
    });
  } catch (error: any) {
    console.error('Seed features error:', error);
    return NextResponse.json({ error: error.message || 'Failed to seed features data' }, { status: 500 });
  }
}
