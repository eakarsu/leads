import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parsePaginationParams, buildPrismaQuery, buildPaginatedResponse } from '@/lib/pagination';

// Get custom object definitions
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paginationParams = parsePaginationParams(req);

    const { searchParams } = new URL(req.url);
    const includeFields = searchParams.get('includeFields') === 'true';

    const total = await prisma.customObject.count();

    const customObjects = await prisma.customObject.findMany({
      include: includeFields
        ? {
            fields: {
              orderBy: { sortOrder: 'asc' },
            },
            _count: { select: { records: true } },
          }
        : {
            _count: { select: { fields: true, records: true } },
          },
      ...buildPrismaQuery(paginationParams),
    });

    // Calculate stats
    const stats = {
      totalObjects: customObjects.length,
      activeObjects: customObjects.filter(o => o.isActive).length,
      totalFields: customObjects.reduce((sum, o) => {
        const count = o._count as any;
        return sum + (count?.fields || ((o as any).fields?.length || 0));
      }, 0),
      totalRecords: customObjects.reduce((sum, o) => sum + (o._count?.records || 0), 0),
    };

    return NextResponse.json(buildPaginatedResponse(customObjects, total, paginationParams, { stats }));
  } catch (error: any) {
    console.error('Error fetching custom objects:', error);
    return NextResponse.json({ error: 'Failed to fetch custom objects' }, { status: 500 });
  }
}

// Create custom object definition
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, label, pluralLabel, description, fields } = body;

    if (!name || !label) {
      return NextResponse.json({ error: 'Name and label are required' }, { status: 400 });
    }

    // Validate API name format
    const apiNameRegex = /^[A-Za-z][A-Za-z0-9_]*__c$/;
    if (!apiNameRegex.test(name)) {
      return NextResponse.json(
        { error: 'API name must start with a letter, contain only alphanumeric characters and underscores, and end with __c' },
        { status: 400 }
      );
    }

    // Check if name already exists
    const existing = await prisma.customObject.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json({ error: 'Custom object with this name already exists' }, { status: 400 });
    }

    const customObject = await prisma.customObject.create({
      data: {
        name,
        label,
        pluralLabel: pluralLabel || label + 's',
        description,
        fields: fields
          ? {
              create: fields.map((field: any, index: number) => ({
                name: field.name,
                label: field.label,
                type: field.type,
                isRequired: field.required ?? false,
                isUnique: field.unique ?? false,
                defaultValue: field.defaultValue,
                picklistValues: field.picklistValues || [],
                lookupObjectId: field.lookupObject,
                sortOrder: index,
              })),
            }
          : undefined,
      },
      include: {
        fields: true,
      },
    });

    return NextResponse.json(customObject, { status: 201 });
  } catch (error: any) {
    console.error('Error creating custom object:', error);
    return NextResponse.json({ error: 'Failed to create custom object' }, { status: 500 });
  }
}

// Update custom object
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, label, pluralLabel, description, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Object ID is required' }, { status: 400 });
    }

    const customObject = await prisma.customObject.update({
      where: { id },
      data: {
        label,
        pluralLabel,
        description,
        isActive,
      },
    });

    return NextResponse.json(customObject);
  } catch (error: any) {
    console.error('Error updating custom object:', error);
    return NextResponse.json({ error: 'Failed to update custom object' }, { status: 500 });
  }
}

// Delete custom object
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Object ID is required' }, { status: 400 });
    }

    // Delete all related records and fields first
    await prisma.customRecord.deleteMany({
      where: { objectId: id },
    });

    await prisma.customField.deleteMany({
      where: { objectId: id },
    });

    await prisma.customObject.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting custom object:', error);
    return NextResponse.json({ error: 'Failed to delete custom object' }, { status: 500 });
  }
}
