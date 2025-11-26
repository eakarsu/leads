import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public endpoint - no auth required
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const form = await prisma.webForm.findUnique({
      where: { publicToken: token },
      select: {
        id: true,
        name: true,
        formType: true,
        description: true,
        fields: true,
        defaultValues: true,
        captchaEnabled: true,
        isActive: true,
      },
    });

    if (!form || !form.isActive) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    return NextResponse.json(form);
  } catch (error: any) {
    console.error('Error fetching form:', error);
    return NextResponse.json({ error: 'Failed to fetch form' }, { status: 500 });
  }
}

// Public form submission - no auth required
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await req.json();

    const form = await prisma.webForm.findUnique({
      where: { publicToken: token },
    });

    if (!form || !form.isActive) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Get IP and user agent
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Create submission record
    const submission = await prisma.webFormSubmission.create({
      data: {
        formId: form.id,
        data: body,
        ipAddress,
        userAgent,
      },
    });

    // Process submission based on form type
    try {
      let recordId: string | null = null;

      if (form.formType === 'LEAD') {
        // Get default client
        const client = await prisma.clientCompany.findFirst();
        if (!client) {
          throw new Error('No client company found');
        }

        // Create lead
        const lead = await prisma.lead.create({
          data: {
            clientId: client.id,
            fullName: body.fullName || body.name || `${body.firstName || ''} ${body.lastName || ''}`.trim() || 'Unknown',
            email: body.email,
            phone: body.phone,
            company: body.company,
            title: body.title,
            source: 'Web Form',
            leadSource: 'API',
            notes: body.message || body.comments || body.notes,
          },
        });

        recordId = lead.id;
      } else if (form.formType === 'CASE') {
        // Get default owner
        const owner = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        if (!owner) {
          throw new Error('No admin user found');
        }

        // Generate case number
        const caseCount = await prisma.case.count();
        const caseNumber = `CS-${String(caseCount + 1).padStart(6, '0')}`;

        // Create case
        const newCase = await prisma.case.create({
          data: {
            caseNumber,
            subject: body.subject || 'Web Form Submission',
            description: body.description || body.message || body.comments,
            origin: 'WEB',
            priority: body.priority || 'MEDIUM',
            type: body.type,
            ownerId: owner.id,
          },
        });

        recordId = newCase.id;
      }

      // Update submission with created record ID
      await prisma.webFormSubmission.update({
        where: { id: submission.id },
        data: {
          recordId,
          status: 'PROCESSED',
        },
      });

      // Increment submission count
      await prisma.webForm.update({
        where: { id: form.id },
        data: {
          submissionCount: { increment: 1 },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Form submitted successfully',
        recordId,
        redirectUrl: form.redirectUrl,
      });
    } catch (processError: any) {
      // Mark submission as failed
      await prisma.webFormSubmission.update({
        where: { id: submission.id },
        data: {
          status: 'FAILED',
          errorMessage: processError.message,
        },
      });

      return NextResponse.json(
        { error: 'Failed to process submission' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error submitting form:', error);
    return NextResponse.json({ error: 'Failed to submit form' }, { status: 500 });
  }
}
