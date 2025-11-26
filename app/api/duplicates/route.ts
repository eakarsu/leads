import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Get duplicate rules and duplicate record sets
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'rules' or 'duplicates'
    const objectType = searchParams.get('objectType');
    const status = searchParams.get('status');

    if (type === 'rules') {
      const where: any = {};
      if (objectType) where.objectType = objectType;

      const rules = await prisma.duplicateRule.findMany({
        where,
        orderBy: { name: 'asc' },
      });

      return NextResponse.json(rules);
    }

    // Get duplicate record sets
    const where: any = {};
    if (objectType) where.objectType = objectType;
    if (status) where.status = status;

    const duplicates = await prisma.duplicateRecordSet.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(duplicates);
  } catch (error: any) {
    console.error('Error fetching duplicates:', error);
    return NextResponse.json({ error: 'Failed to fetch duplicates' }, { status: 500 });
  }
}

// Create duplicate rule
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, objectType, matchCriteria, actionOnCreate, actionOnEdit } = body;

    if (!name || !objectType || !matchCriteria) {
      return NextResponse.json(
        { error: 'Name, object type, and match criteria are required' },
        { status: 400 }
      );
    }

    const rule = await prisma.duplicateRule.create({
      data: {
        name,
        description,
        objectType,
        matchCriteria,
        actionOnCreate: actionOnCreate || 'ALERT',
        actionOnEdit: actionOnEdit || 'ALERT',
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error: any) {
    console.error('Error creating duplicate rule:', error);
    return NextResponse.json({ error: 'Failed to create duplicate rule' }, { status: 500 });
  }
}

// Find duplicates or merge records
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, objectType, recordData, duplicateSetId, masterRecordId } = body;

    // Find duplicates for a record
    if (action === 'find') {
      if (!objectType || !recordData) {
        return NextResponse.json(
          { error: 'Object type and record data are required' },
          { status: 400 }
        );
      }

      // Get active duplicate rules for this object type
      const rules = await prisma.duplicateRule.findMany({
        where: { objectType, isActive: true },
      });

      const duplicates: any[] = [];

      for (const rule of rules) {
        const criteria = rule.matchCriteria as any;
        const fields = criteria.fields || [];
        const matchType = criteria.matchType || 'EXACT'; // EXACT, FUZZY

        // Build query based on match criteria
        const where: any = {};
        for (const field of fields) {
          if (recordData[field]) {
            if (matchType === 'EXACT') {
              where[field] = recordData[field];
            } else {
              where[field] = { contains: recordData[field], mode: 'insensitive' };
            }
          }
        }

        // Query the appropriate model
        let matchingRecords: any[] = [];
        if (objectType === 'Lead') {
          matchingRecords = await prisma.lead.findMany({ where, take: 10 });
        } else if (objectType === 'Contact') {
          matchingRecords = await prisma.contact.findMany({ where, take: 10 });
        }

        duplicates.push(...matchingRecords);
      }

      // Remove duplicates from results
      const uniqueDuplicates = duplicates.filter(
        (record, index, self) => index === self.findIndex((r) => r.id === record.id)
      );

      return NextResponse.json({
        hasDuplicates: uniqueDuplicates.length > 0,
        duplicates: uniqueDuplicates,
        rules: rules.map((r) => ({ id: r.id, name: r.name, actionOnCreate: r.actionOnCreate })),
      });
    }

    // Merge records
    if (action === 'merge') {
      if (!duplicateSetId || !masterRecordId) {
        return NextResponse.json(
          { error: 'Duplicate set ID and master record ID are required' },
          { status: 400 }
        );
      }

      const duplicateSet = await prisma.duplicateRecordSet.findUnique({
        where: { id: duplicateSetId },
      });

      if (!duplicateSet) {
        return NextResponse.json({ error: 'Duplicate set not found' }, { status: 404 });
      }

      // Mark duplicate set as merged
      await prisma.duplicateRecordSet.update({
        where: { id: duplicateSetId },
        data: {
          masterRecordId,
          status: 'MERGED',
        },
      });

      // In a real implementation, you would merge the records here
      // This would involve moving related records and then deleting duplicates

      return NextResponse.json({ success: true, masterRecordId });
    }

    // Ignore duplicates
    if (action === 'ignore') {
      if (!duplicateSetId) {
        return NextResponse.json({ error: 'Duplicate set ID is required' }, { status: 400 });
      }

      await prisma.duplicateRecordSet.update({
        where: { id: duplicateSetId },
        data: { status: 'IGNORED' },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error processing duplicates:', error);
    return NextResponse.json({ error: 'Failed to process duplicates' }, { status: 500 });
  }
}
