import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Get records for a custom object
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50') || 50;
    const offset = parseInt(searchParams.get('offset') || '0') || 0;

    const customObject = await prisma.customObject.findUnique({
      where: { id },
      include: { fields: true },
    });

    if (!customObject) {
      return NextResponse.json({ error: 'Custom object not found' }, { status: 404 });
    }

    const [records, total] = await Promise.all([
      prisma.customRecord.findMany({
        where: { objectId: id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.customRecord.count({ where: { objectId: id } }),
    ]);

    // Fetch owner data separately
    const ownerIds = [...new Set(records.map(r => r.ownerId))];
    const owners = await prisma.user.findMany({
      where: { id: { in: ownerIds } },
      select: { id: true, name: true },
    });
    const ownerMap = new Map(owners.map(o => [o.id, o]));

    const recordsWithOwner = records.map(r => ({
      ...r,
      owner: ownerMap.get(r.ownerId),
    }));

    return NextResponse.json({
      object: customObject,
      records: recordsWithOwner,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Error fetching custom object records:', error);
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
  }
}

// Create a record for custom object
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, data } = body;

    const customObject = await prisma.customObject.findUnique({
      where: { id },
      include: { fields: true },
    });

    if (!customObject) {
      return NextResponse.json({ error: 'Custom object not found' }, { status: 404 });
    }

    // Validate required fields
    const requiredFields = customObject.fields.filter((f) => f.isRequired);
    for (const field of requiredFields) {
      if (!data || data[field.name] === undefined || data[field.name] === '') {
        return NextResponse.json(
          { error: `${field.label} is required` },
          { status: 400 }
        );
      }
    }

    // Validate unique fields
    const uniqueFields = customObject.fields.filter((f) => f.isUnique);
    for (const field of uniqueFields) {
      if (data && data[field.name]) {
        const existing = await prisma.customRecord.findFirst({
          where: {
            objectId: id,
            data: {
              path: [field.name],
              equals: data[field.name],
            },
          },
        });
        if (existing) {
          return NextResponse.json(
            { error: `${field.label} must be unique` },
            { status: 400 }
          );
        }
      }
    }

    const record = await prisma.customRecord.create({
      data: {
        objectId: id,
        data: data || {},
        ownerId: session.user.id,
      },
    });

    // Fetch owner data
    const owner = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true },
    });

    const recordWithOwner = { ...record, owner };

    return NextResponse.json(recordWithOwner, { status: 201 });
  } catch (error: any) {
    console.error('Error creating custom object record:', error);
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 });
  }
}

// Update a record
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { recordId, data } = body;

    if (!recordId) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
    }

    const record = await prisma.customRecord.findUnique({
      where: { id: recordId },
    });

    if (!record || record.objectId !== id) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const customObject = await prisma.customObject.findUnique({
      where: { id },
      include: { fields: true },
    });

    // Validate unique fields
    const uniqueFields = customObject?.fields?.filter((f) => f.isUnique) || [];
    for (const field of uniqueFields) {
      if (data && data[field.name]) {
        const existing = await prisma.customRecord.findFirst({
          where: {
            objectId: id,
            id: { not: recordId },
            data: {
              path: [field.name],
              equals: data[field.name],
            },
          },
        });
        if (existing) {
          return NextResponse.json(
            { error: `${field.label} must be unique` },
            { status: 400 }
          );
        }
      }
    }

    const updatedRecord = await prisma.customRecord.update({
      where: { id: recordId },
      data: {
        data: data ? { ...(record.data as any), ...data } : record.data,
      },
    });

    // Fetch owner data
    const owner = await prisma.user.findUnique({
      where: { id: updatedRecord.ownerId },
      select: { id: true, name: true },
    });

    return NextResponse.json({ ...updatedRecord, owner });
  } catch (error: any) {
    console.error('Error updating custom object record:', error);
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
  }
}

// Delete a record
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const recordId = searchParams.get('recordId');

    if (!recordId) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
    }

    const record = await prisma.customRecord.findUnique({
      where: { id: recordId },
    });

    if (!record || record.objectId !== id) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    await prisma.customRecord.delete({
      where: { id: recordId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting custom object record:', error);
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
  }
}
