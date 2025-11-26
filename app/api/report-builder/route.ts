import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Get saved report definitions
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get('folderId');
    const format = searchParams.get('format');
    const myReports = searchParams.get('myReports') === 'true';

    const where: any = {};
    if (folderId) where.folderId = folderId;
    if (format) where.format = format;
    if (myReports) where.ownerId = session.user.id;

    const reports = await prisma.report.findMany({
      where,
      include: {
        folder: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Fetch owner data separately
    const ownerIds = [...new Set(reports.map(r => r.ownerId))];
    const owners = await prisma.user.findMany({
      where: { id: { in: ownerIds } },
      select: { id: true, name: true },
    });
    const ownerMap = new Map(owners.map(o => [o.id, o]));

    const reportsWithOwners = reports.map(r => ({
      ...r,
      owner: ownerMap.get(r.ownerId) || null,
    }));

    return NextResponse.json(reportsWithOwners);
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

// Create report definition
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      description,
      format,
      folderId,
      objectType,
      columns,
      filters,
      groupBy,
      sortBy,
      chartConfig,
      isPublic,
    } = body;

    if (!name || !objectType) {
      return NextResponse.json(
        { error: 'Name and object type are required' },
        { status: 400 }
      );
    }

    const report = await prisma.report.create({
      data: {
        name,
        description,
        format: format || 'TABULAR',
        folderId,
        objectType,
        columns: columns || [],
        filters,
        groupBy: groupBy || [],
        sortBy,
        chartConfig,
        isPublic: isPublic || false,
        ownerId: session.user.id,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error: any) {
    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}

// Update report definition
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      name,
      description,
      folderId,
      columns,
      filters,
      groupBy,
      sortBy,
      chartConfig,
      isPublic,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    const report = await prisma.report.update({
      where: { id },
      data: {
        name,
        description,
        folderId,
        columns,
        filters,
        groupBy,
        sortBy,
        chartConfig,
        isPublic,
      },
    });

    return NextResponse.json(report);
  } catch (error: any) {
    console.error('Error updating report:', error);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}

// Delete report
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    await prisma.report.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting report:', error);
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
  }
}
