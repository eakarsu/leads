import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const emailAccounts = await prisma.emailSyncAccount.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const calendarAccounts = await prisma.calendarSyncAccount.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const stats = {
      totalEmailAccounts: emailAccounts.length,
      activeEmailSyncs: emailAccounts.filter((a) => a.syncEnabled).length,
      totalCalendarAccounts: calendarAccounts.length,
      activeCalendarSyncs: calendarAccounts.filter((a) => a.syncEnabled).length,
    };

    return NextResponse.json({ emailAccounts, calendarAccounts, stats });
  } catch (error) {
    console.error('Error fetching sync settings:', error);
    return NextResponse.json({ error: 'Failed to fetch sync settings' }, { status: 500 });
  }
}
