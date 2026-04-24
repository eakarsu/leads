import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parsePaginationParams, buildPrismaQuery, buildPaginatedResponse } from '@/lib/pagination';

export async function GET(req: NextRequest) {
  try {
    const paginationParams = parsePaginationParams(req);

    const total = await prisma.scheduledReport.count();

    const reports = await prisma.scheduledReport.findMany({
      include: {
        _count: {
          select: { executions: true },
        },
      },
      ...buildPrismaQuery(paginationParams),
    });

    const stats = {
      totalReports: reports.length,
      activeReports: reports.filter((r) => r.isActive).length,
      pausedReports: reports.filter((r) => !r.isActive).length,
      totalExecutions: reports.reduce((sum, r) => sum + (r._count?.executions || 0), 0),
    };

    return NextResponse.json(buildPaginatedResponse(reports, total, paginationParams, { stats }));
  } catch (error) {
    console.error('Error fetching scheduled reports:', error);
    return NextResponse.json({ error: 'Failed to fetch scheduled reports' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get admin user for createdById
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 400 });
    }

    const report = await prisma.scheduledReport.create({
      data: {
        name: body.name,
        reportType: body.reportType || 'CUSTOM',
        frequency: body.frequency,
        dayOfWeek: body.frequency === 'WEEKLY' ? body.dayOfWeek : null,
        dayOfMonth: ['MONTHLY', 'QUARTERLY'].includes(body.frequency) ? body.dayOfMonth : null,
        time: body.time,
        timezone: body.timezone || 'America/New_York',
        recipientEmails: body.recipientEmails || [],
        format: body.format || 'PDF',
        includeCharts: body.includeCharts ?? true,
        isActive: true,
        createdById: admin.id,
        nextRunAt: calculateNextRun(body.frequency, body.dayOfWeek, body.dayOfMonth, body.time),
      },
    });

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Error creating scheduled report:', error);
    return NextResponse.json({ error: 'Failed to create scheduled report' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, ...updateData } = body;

    if (action === 'run_now') {
      // Create execution record
      await prisma.scheduledReportExecution.create({
        data: {
          scheduledReportId: id,
          status: 'SUCCESS',
          startedAt: new Date(),
          completedAt: new Date(),
          recipientCount: 1,
        },
      });

      // Update last run
      const report = await prisma.scheduledReport.update({
        where: { id },
        data: {
          lastRunAt: new Date(),
          lastStatus: 'SUCCESS',
        },
      });

      return NextResponse.json({ report });
    }

    const report = await prisma.scheduledReport.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Error updating scheduled report:', error);
    return NextResponse.json({ error: 'Failed to update scheduled report' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Report ID required' }, { status: 400 });
    }

    await prisma.scheduledReport.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scheduled report:', error);
    return NextResponse.json({ error: 'Failed to delete scheduled report' }, { status: 500 });
  }
}

function calculateNextRun(frequency: string, dayOfWeek?: number, dayOfMonth?: number, time?: string): Date {
  const now = new Date();
  const [hours, minutes] = (time || '09:00').split(':').map(Number);
  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);

  switch (frequency) {
    case 'DAILY':
      if (next <= now) next.setDate(next.getDate() + 1);
      break;
    case 'WEEKLY':
      const targetDay = dayOfWeek ?? 1;
      next.setDate(next.getDate() + ((targetDay - next.getDay() + 7) % 7 || 7));
      break;
    case 'MONTHLY':
      next.setDate(dayOfMonth || 1);
      if (next <= now) next.setMonth(next.getMonth() + 1);
      break;
    case 'QUARTERLY':
      next.setDate(dayOfMonth || 1);
      const currentQuarter = Math.floor(next.getMonth() / 3);
      next.setMonth((currentQuarter + 1) * 3);
      break;
  }

  return next;
}
