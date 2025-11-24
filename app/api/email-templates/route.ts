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

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    const emailTemplates = await prisma.emailTemplate.findMany({
      where: {
        ...(category && { category }),
        ...(isActive !== null && { isActive: isActive === 'true' }),
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(emailTemplates);
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
