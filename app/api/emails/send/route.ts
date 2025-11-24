import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { emailId } = await req.json();

    const email = await prisma.email.findUnique({
      where: { id: emailId },
      include: {
        sender: true,
      },
    });

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    if (email.senderId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (email.status === 'SENT' || email.status === 'DELIVERED') {
      return NextResponse.json(
        { error: 'Email already sent' },
        { status: 400 }
      );
    }

    try {
      const sendResult = await sendEmail({
        to: email.toAddress,
        subject: email.subject,
        html: email.body,
        cc: email.ccAddress || undefined,
        bcc: email.bccAddress || undefined,
      });

      if (sendResult.success) {
        await prisma.email.update({
          where: { id: email.id },
          data: {
            status: 'DELIVERED',
            sentAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Email sent successfully',
        });
      } else {
        await prisma.email.update({
          where: { id: email.id },
          data: { status: 'FAILED' },
        });

        return NextResponse.json(
          { error: 'Failed to send email', details: sendResult.error },
          { status: 500 }
        );
      }
    } catch (error: any) {
      await prisma.email.update({
        where: { id: email.id },
        data: { status: 'FAILED' },
      });

      return NextResponse.json(
        { error: 'Failed to send email', details: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
