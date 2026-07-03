import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parsePaginationParams, buildPrismaQuery, buildPaginatedResponse } from '@/lib/pagination';
import { ensureDefaultEmailTemplates } from '@/lib/defaultFeatureSeeds';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paginationParams = parsePaginationParams(req);
    await ensureDefaultEmailTemplates();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    const where = {
      ...(category && { category }),
      ...(isActive !== null && { isActive: isActive === 'true' }),
    };

    const total = await prisma.emailTemplate.count({ where });

    const emailTemplates = await prisma.emailTemplate.findMany({
      where,
      ...buildPrismaQuery(paginationParams),
    });

    return NextResponse.json(buildPaginatedResponse(emailTemplates, total, paginationParams));
  } catch (error: any) {
    console.error('Error fetching email templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email templates' },
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

    const body = await req.json();
    const {
      name,
      subject,
      body: templateBody,
      category,
      isActive,
    } = body;

    const emailTemplate = await prisma.emailTemplate.create({
      data: {
        name,
        subject,
        body: templateBody,
        category,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(emailTemplate, { status: 201 });
  } catch (error: any) {
    console.error('Error creating email template:', error);
    return NextResponse.json(
      { error: 'Failed to create email template' },
      { status: 500 }
    );
  }
}
