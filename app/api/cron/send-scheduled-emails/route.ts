import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find all scheduled emails that are due to be sent
    const scheduledEmails = await prisma.email.findMany({
      where: {
        status: 'DRAFT',
        scheduledAt: {
          lte: new Date(),
        },
      },
      include: {
        sender: true,
      },
    });

    const results = [];

    for (const email of scheduledEmails) {
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

          results.push({
            emailId: email.id,
            status: 'sent',
          });
        } else {
          await prisma.email.update({
            where: { id: email.id },
            data: { status: 'FAILED' },
          });

          results.push({
            emailId: email.id,
            status: 'failed',
            error: sendResult.error,
          });
        }
      } catch (error: any) {
        await prisma.email.update({
          where: { id: email.id },
          data: { status: 'FAILED' },
        });

        results.push({
          emailId: email.id,
          status: 'failed',
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error: any) {
    console.error('Error processing scheduled emails:', error);
    return NextResponse.json(
      { error: 'Failed to process scheduled emails' },
      { status: 500 }
    );
  }
}
