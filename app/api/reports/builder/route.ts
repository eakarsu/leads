import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Transform to match frontend expectations
    const transformedReports = reports.map(report => ({
      id: report.id,
      name: report.name,
      description: report.description,
      reportType: report.format, // Map format to reportType
      objectType: report.objectType,
      columns: report.columns,
      filters: report.filters,
      groupings: report.groupBy, // Map groupBy to groupings
      isPublic: report.isPublic,
      createdAt: report.createdAt,
      lastRunAt: report.lastRunAt,
    }));

    // Calculate stats
    const stats = {
      totalReports: reports.length,
      publicReports: reports.filter(r => r.isPublic).length,
      privateReports: reports.filter(r => !r.isPublic).length,
      byType: {
        TABULAR: reports.filter(r => r.format === 'TABULAR').length,
        SUMMARY: reports.filter(r => r.format === 'SUMMARY').length,
        MATRIX: reports.filter(r => r.format === 'MATRIX').length,
      },
    };

    return NextResponse.json({ reports: transformedReports, stats });
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

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
      reportType,
      objectType,
      columns,
      filters,
      groupings,
      isPublic,
    } = body;

    if (!name || !objectType || !columns || columns.length === 0) {
      return NextResponse.json(
        { error: 'Name, object type, and at least one column are required' },
        { status: 400 }
      );
    }

    const report = await prisma.report.create({
      data: {
        name,
        description,
        format: reportType || 'TABULAR', // Map reportType to format
        objectType,
        columns,
        filters: filters || {},
        groupBy: groupings || [], // Map groupings to groupBy
        isPublic: isPublic || false,
        ownerId: session.user.id,
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
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}
