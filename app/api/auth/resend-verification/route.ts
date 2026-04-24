import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { emailVerificationEmail } from '@/lib/emailTemplates';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email is already verified' }, { status: 400 });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.emailVerificationToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email - LeadGenFlow AI',
      html: emailVerificationEmail(verifyUrl, user.name),
    });

    return NextResponse.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
  }
}
