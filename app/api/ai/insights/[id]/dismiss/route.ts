import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params first
    const { id } = await context.params;

    await prisma.aIInsight.update({
      where: { id },
      data: { dismissed: true },
    });

    return NextResponse.json({ message: 'Insight dismissed successfully' });
  } catch (error: any) {
    console.error('Error dismissing insight:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
