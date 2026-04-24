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

    const paginationParams = parsePaginationParams(req, { sortBy: 'name', sortOrder: 'asc' });

    const total = await prisma.clientCompany.count();

    const clients = await prisma.clientCompany.findMany({
      include: {
        _count: {
          select: {
            campaigns: true,
            leads: true,
          },
        },
      },
      ...buildPrismaQuery(paginationParams),
    });

    return NextResponse.json(buildPaginatedResponse(clients, total, paginationParams));
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      industry,
      website,
      contactName,
      contactEmail,
      contactPhone,
      notes,
    } = body;

    if (!name || !industry || !contactName || !contactEmail) {
      return NextResponse.json(
        { error: 'Name, industry, contact name, and contact email are required' },
        { status: 400 }
      );
    }

    const client = await prisma.clientCompany.create({
      data: {
        name,
        industry,
        website,
        contactName,
        contactEmail,
        contactPhone,
        notes,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error: any) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
