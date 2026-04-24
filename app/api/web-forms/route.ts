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
    const formType = searchParams.get('formType');

    const where: any = {};
    if (formType) where.formType = formType;

    const total = await prisma.webForm.count({ where });

    const forms = await prisma.webForm.findMany({
      where,
      include: {
        _count: { select: { submissions: true } },
      },
      ...buildPrismaQuery(paginationParams),
    });

    // Calculate stats
    const stats = {
      totalForms: forms.length,
      activeForms: forms.filter(f => f.isActive).length,
      leadForms: forms.filter(f => f.formType === 'LEAD').length,
      caseForms: forms.filter(f => f.formType === 'CASE').length,
      totalSubmissions: forms.reduce((sum, f) => sum + (f.submissionCount || 0), 0),
    };

    return NextResponse.json(buildPaginatedResponse(forms, total, paginationParams, { stats }));
  } catch (error: any) {
    console.error('Error fetching web forms:', error);
    return NextResponse.json({ error: 'Failed to fetch forms' }, { status: 500 });
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
      formType,
      description,
      fields,
      defaultValues,
      redirectUrl,
      notifyEmails,
      captchaEnabled,
    } = body;

    if (!name || !formType || !fields) {
      return NextResponse.json(
        { error: 'Name, form type, and fields are required' },
        { status: 400 }
      );
    }

    const form = await prisma.webForm.create({
      data: {
        name,
        formType,
        description,
        fields,
        defaultValues,
        redirectUrl,
        notifyEmails: notifyEmails || [],
        captchaEnabled: captchaEnabled ?? true,
      },
    });

    return NextResponse.json(form, { status: 201 });
  } catch (error: any) {
    console.error('Error creating web form:', error);
    return NextResponse.json({ error: 'Failed to create form' }, { status: 500 });
  }
}
