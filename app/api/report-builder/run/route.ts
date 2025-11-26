import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Run a report and get data
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { reportId, objectType, columns, filters, groupBy, sortBy, limit } = body;

    // Get report config either from saved report or from request body
    let config: any = { objectType, columns, filters, groupBy, sortBy };

    if (reportId) {
      const report = await prisma.report.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }

      config = {
        objectType: report.objectType,
        columns: report.columns,
        filters: report.filters,
        groupBy: report.groupBy,
        sortBy: report.sortBy,
      };

      // Update last run time
      await prisma.report.update({
        where: { id: reportId },
        data: { lastRunAt: new Date() },
      });
    }

    if (!config.objectType) {
      return NextResponse.json({ error: 'Object type is required' }, { status: 400 });
    }

    // Build query based on object type
    const where = buildWhereClause(config.filters);
    const orderBy = buildOrderBy(config.sortBy);
    const select = buildSelect(config.columns);

    let data: any[] = [];
    let total = 0;

    switch (config.objectType) {
      case 'Lead':
        [data, total] = await Promise.all([
          prisma.lead.findMany({
            where,
            select,
            orderBy,
            take: limit || 1000,
          }),
          prisma.lead.count({ where }),
        ]);
        break;

      case 'Contact':
        [data, total] = await Promise.all([
          prisma.contact.findMany({
            where,
            select,
            orderBy,
            take: limit || 1000,
          }),
          prisma.contact.count({ where }),
        ]);
        break;

      case 'Account':
        [data, total] = await Promise.all([
          prisma.clientCompany.findMany({
            where,
            select,
            orderBy,
            take: limit || 1000,
          }),
          prisma.clientCompany.count({ where }),
        ]);
        break;

      case 'Opportunity':
        [data, total] = await Promise.all([
          prisma.opportunity.findMany({
            where,
            select,
            orderBy,
            take: limit || 1000,
          }),
          prisma.opportunity.count({ where }),
        ]);
        break;

      case 'Case':
        [data, total] = await Promise.all([
          prisma.case.findMany({
            where,
            select,
            orderBy,
            take: limit || 1000,
          }),
          prisma.case.count({ where }),
        ]);
        break;

      case 'Campaign':
        [data, total] = await Promise.all([
          prisma.campaign.findMany({
            where,
            select,
            orderBy,
            take: limit || 1000,
          }),
          prisma.campaign.count({ where }),
        ]);
        break;

      case 'Task':
        [data, total] = await Promise.all([
          prisma.task.findMany({
            where,
            select,
            orderBy,
            take: limit || 1000,
          }),
          prisma.task.count({ where }),
        ]);
        break;

      case 'Email':
        [data, total] = await Promise.all([
          prisma.email.findMany({
            where,
            select,
            orderBy,
            take: limit || 1000,
          }),
          prisma.email.count({ where }),
        ]);
        break;

      default:
        return NextResponse.json({ error: 'Unsupported object type' }, { status: 400 });
    }

    // Apply groupings if specified
    let groupedData: any = null;
    if (config.groupBy && config.groupBy.length > 0) {
      groupedData = groupData(data, config.groupBy, config.columns);
    }

    // Calculate aggregates for numeric columns
    const aggregates = calculateAggregates(data, config.columns);

    return NextResponse.json({
      data: groupedData || data,
      total,
      aggregates,
      columns: config.columns,
    });
  } catch (error: any) {
    console.error('Error running report:', error);
    return NextResponse.json({ error: 'Failed to run report' }, { status: 500 });
  }
}

function buildWhereClause(filters: any[]): any {
  if (!filters || filters.length === 0) return {};

  const where: any = {};

  for (const filter of filters) {
    const { field, operator, value } = filter;

    switch (operator) {
      case 'equals':
        where[field] = value;
        break;
      case 'not_equals':
        where[field] = { not: value };
        break;
      case 'contains':
        where[field] = { contains: value, mode: 'insensitive' };
        break;
      case 'starts_with':
        where[field] = { startsWith: value, mode: 'insensitive' };
        break;
      case 'ends_with':
        where[field] = { endsWith: value, mode: 'insensitive' };
        break;
      case 'greater_than':
        where[field] = { gt: value };
        break;
      case 'greater_equal':
        where[field] = { gte: value };
        break;
      case 'less_than':
        where[field] = { lt: value };
        break;
      case 'less_equal':
        where[field] = { lte: value };
        break;
      case 'in':
        where[field] = { in: value };
        break;
      case 'not_in':
        where[field] = { notIn: value };
        break;
      case 'is_null':
        where[field] = null;
        break;
      case 'is_not_null':
        where[field] = { not: null };
        break;
    }
  }

  return where;
}

function buildOrderBy(sortBy: any): any {
  if (!sortBy) return { createdAt: 'desc' };

  if (Array.isArray(sortBy)) {
    return sortBy.map((s) => ({ [s.field]: s.direction || 'asc' }));
  }

  return { [sortBy.field]: sortBy.direction || 'asc' };
}

function buildSelect(columns: string[]): any {
  if (!columns || columns.length === 0) return undefined;

  const select: any = { id: true };
  for (const col of columns) {
    select[col] = true;
  }

  return select;
}

function groupData(data: any[], groupings: string[], columns: string[]): any {
  if (groupings.length === 0) return data;

  const grouped: any = {};

  for (const item of data) {
    let current = grouped;

    for (let i = 0; i < groupings.length; i++) {
      const key = item[groupings[i]] || '(No Value)';

      if (i === groupings.length - 1) {
        if (!current[key]) {
          current[key] = { items: [], aggregates: {} };
        }
        current[key].items.push(item);
      } else {
        if (!current[key]) {
          current[key] = {};
        }
        current = current[key];
      }
    }
  }

  // Calculate aggregates for each group
  calculateGroupAggregates(grouped, columns);

  return grouped;
}

function calculateGroupAggregates(grouped: any, columns: string[]): void {
  for (const key in grouped) {
    if (grouped[key].items) {
      grouped[key].aggregates = calculateAggregates(grouped[key].items, columns);
    } else {
      calculateGroupAggregates(grouped[key], columns);
    }
  }
}

function calculateAggregates(data: any[], columns: string[]): any {
  const aggregates: any = {
    count: data.length,
  };

  if (!columns) return aggregates;

  // Find numeric columns and calculate sum, avg, min, max
  const numericFields = ['amount', 'value', 'quantity', 'price', 'count', 'score'];

  for (const col of columns) {
    const values = data.map((d) => d[col]).filter((v) => typeof v === 'number');

    if (values.length > 0 || numericFields.some((nf) => col.toLowerCase().includes(nf))) {
      const numValues = values.length > 0 ? values : data.map((d) => parseFloat(d[col])).filter((v) => !isNaN(v));

      if (numValues.length > 0) {
        aggregates[col] = {
          sum: numValues.reduce((a, b) => a + b, 0),
          avg: numValues.reduce((a, b) => a + b, 0) / numValues.length,
          min: Math.min(...numValues),
          max: Math.max(...numValues),
          count: numValues.length,
        };
      }
    }
  }

  return aggregates;
}
