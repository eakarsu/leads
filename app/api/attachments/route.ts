import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parsePaginationParams, buildPrismaQuery, buildPaginatedResponse } from '@/lib/pagination';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paginationParams = parsePaginationParams(req);

    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get('contactId');
    const leadId = searchParams.get('leadId');
    const opportunityId = searchParams.get('opportunityId');

    const where: any = {};
    if (contactId) where.contactId = contactId;
    if (leadId) where.leadId = leadId;
    if (opportunityId) where.opportunityId = opportunityId;

    const total = await prisma.attachment.count({ where });

    const attachments = await prisma.attachment.findMany({
      where,
      // Don't include fileData in list view to reduce payload size
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        fileType: true,
        uploadedBy: true,
        contactId: true,
        leadId: true,
        opportunityId: true,
        createdAt: true,
        updatedAt: true,
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      ...buildPrismaQuery(paginationParams),
    });

    return NextResponse.json(buildPaginatedResponse(attachments, total, paginationParams));
  } catch (error: any) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attachments' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const contactId = formData.get('contactId') as string | null;
    const leadId = formData.get('leadId') as string | null;
    const opportunityId = formData.get('opportunityId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create attachment record with file data
    const attachment = await prisma.attachment.create({
      data: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileData: buffer, // Store binary data in database
        uploadedBy: session.user.id,
        contactId: contactId || null,
        leadId: leadId || null,
        opportunityId: opportunityId || null,
      },
      // Don't return fileData to reduce response size
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        fileType: true,
        uploadedBy: true,
        contactId: true,
        leadId: true,
        opportunityId: true,
        createdAt: true,
        updatedAt: true,
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error: any) {
    console.error('Error uploading attachment:', error);
    return NextResponse.json(
      { error: 'Failed to upload attachment' },
      { status: 500 }
    );
  }
}
