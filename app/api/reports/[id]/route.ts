import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Try to find in Report table first (report builder reports)
    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (report) {
      // Transform to match frontend expectations
      return NextResponse.json({
        id: report.id,
        name: report.name,
        description: report.description,
        reportType: report.format,
        objectType: report.objectType,
        columns: report.columns,
        filters: report.filters,
        groupings: report.groupBy,
        sortBy: report.sortBy,
        chartConfig: report.chartConfig,
        isPublic: report.isPublic,
        lastRunAt: report.lastRunAt,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      });
    }

    // Fallback to ReportSnapshot table (legacy campaign reports)
    const snapshot = await prisma.reportSnapshot.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (snapshot) {
      return NextResponse.json({
        ...snapshot,
        isSnapshot: true, // Flag to indicate this is a snapshot
      });
    }

    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  } catch (error: any) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Check if it's a Report (builder) or ReportSnapshot
    const existingReport = await prisma.report.findUnique({ where: { id } });

    if (existingReport) {
      const {
        name,
        description,
        reportType,
        columns,
        filters,
        groupings,
        sortBy,
        chartConfig,
        isPublic,
      } = body;

      const report = await prisma.report.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(reportType !== undefined && { format: reportType }),
          ...(columns !== undefined && { columns }),
          ...(filters !== undefined && { filters }),
          ...(groupings !== undefined && { groupBy: groupings }),
          ...(sortBy !== undefined && { sortBy }),
          ...(chartConfig !== undefined && { chartConfig }),
          ...(isPublic !== undefined && { isPublic }),
        },
      });

      return NextResponse.json({
        id: report.id,
        name: report.name,
        description: report.description,
        reportType: report.format,
        objectType: report.objectType,
        columns: report.columns,
        filters: report.filters,
        groupings: report.groupBy,
        isPublic: report.isPublic,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      });
    }

    // Fallback to ReportSnapshot
    const { aiSummary, metrics } = body;

    const snapshot = await prisma.reportSnapshot.update({
      where: { id },
      data: {
        ...(aiSummary !== undefined && { aiSummary }),
        ...(metrics !== undefined && { metrics }),
      },
      include: {
        client: true,
        campaign: true,
      },
    });

    return NextResponse.json(snapshot);
  } catch (error: any) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Try to delete from Report table first
    const existingReport = await prisma.report.findUnique({ where: { id } });

    if (existingReport) {
      await prisma.report.delete({ where: { id } });
      return NextResponse.json({ message: 'Report deleted successfully' });
    }

    // Fallback to ReportSnapshot
    await prisma.reportSnapshot.delete({ where: { id } });
    return NextResponse.json({ message: 'Report snapshot deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting report:', error);
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}
