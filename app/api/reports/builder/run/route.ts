import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Map object types to Prisma model names
const OBJECT_TYPE_MAP: Record<string, string> = {
  Lead: 'lead',
  Contact: 'contact',
  Account: 'account',
  Opportunity: 'opportunity',
  Case: 'case',
  Campaign: 'campaign',
  Task: 'task',
  Contract: 'contract',
  Quote: 'quote',
  Order: 'order',
  Invoice: 'invoice',
  User: 'user',
  Product: 'product',
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { objectType, columns, filters, groupings, sortBy, limit = 100 } = body;

    if (!objectType) {
      return NextResponse.json({ error: 'Object type is required' }, { status: 400 });
    }

    const modelName = OBJECT_TYPE_MAP[objectType];
    if (!modelName) {
      return NextResponse.json({ error: `Unknown object type: ${objectType}` }, { status: 400 });
    }

    // Build query dynamically
    const model = (prisma as any)[modelName];
    if (!model) {
      return NextResponse.json({ error: `Model not found: ${modelName}` }, { status: 400 });
    }

    // Build where clause from filters
    const where: any = {};
    if (filters && typeof filters === 'object') {
      for (const [field, condition] of Object.entries(filters)) {
        if (condition && typeof condition === 'object') {
          const { operator, value } = condition as { operator: string; value: any };
          switch (operator) {
            case 'equals':
              where[field] = value;
              break;
            case 'contains':
              where[field] = { contains: value, mode: 'insensitive' };
              break;
            case 'startsWith':
              where[field] = { startsWith: value, mode: 'insensitive' };
              break;
            case 'endsWith':
              where[field] = { endsWith: value, mode: 'insensitive' };
              break;
            case 'gt':
              where[field] = { gt: value };
              break;
            case 'gte':
              where[field] = { gte: value };
              break;
            case 'lt':
              where[field] = { lt: value };
              break;
            case 'lte':
              where[field] = { lte: value };
              break;
            case 'in':
              where[field] = { in: Array.isArray(value) ? value : [value] };
              break;
            case 'notIn':
              where[field] = { notIn: Array.isArray(value) ? value : [value] };
              break;
            case 'isNull':
              where[field] = value ? null : { not: null };
              break;
          }
        } else if (condition !== undefined && condition !== '') {
          // Simple equality filter
          where[field] = condition;
        }
      }
    }

    // Build select clause from columns
    let select: any = undefined;
    if (columns && Array.isArray(columns) && columns.length > 0) {
      select = {};
      for (const col of columns) {
        // Handle nested fields (e.g., "owner.name")
        if (col.includes('.')) {
          const [relation, field] = col.split('.');
          if (!select[relation]) {
            select[relation] = { select: {} };
          }
          select[relation].select[field] = true;
        } else {
          select[col] = true;
        }
      }
      // Always include id
      select.id = true;
    }

    // Build orderBy clause
    let orderBy: any = undefined;
    if (sortBy) {
      if (Array.isArray(sortBy)) {
        orderBy = sortBy.map((s: any) => ({ [s.field]: s.direction || 'asc' }));
      } else if (typeof sortBy === 'object' && sortBy.field) {
        orderBy = { [sortBy.field]: sortBy.direction || 'asc' };
      }
    }

    // Execute query
    const queryOptions: any = {
      where,
      take: Math.min(limit, 1000), // Cap at 1000 records
      orderBy: orderBy || { createdAt: 'desc' },
    };

    if (select) {
      queryOptions.select = select;
    }

    const results = await model.findMany(queryOptions);

    // Flatten nested objects for display
    const flattenedResults = results.map((row: any) => {
      const flattened: any = {};
      for (const [key, value] of Object.entries(row)) {
        if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
          // Flatten nested objects
          for (const [nestedKey, nestedValue] of Object.entries(value as object)) {
            flattened[`${key}.${nestedKey}`] = nestedValue;
          }
        } else if (value instanceof Date) {
          flattened[key] = value.toISOString();
        } else {
          flattened[key] = value;
        }
      }
      return flattened;
    });

    return NextResponse.json({
      results: flattenedResults,
      count: flattenedResults.length,
      objectType,
    });
  } catch (error: any) {
    console.error('Error running report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run report' },
      { status: 500 }
    );
  }
}
