import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { passwordChangedEmail } from '@/lib/emailTemplates';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });
    }

    if (resetToken.usedAt) {
      return NextResponse.json({ error: 'This reset link has already been used' }, { status: 400 });
    }

    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json({ error: 'This reset link has expired' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    await sendEmail({
      to: resetToken.user.email,
      subject: 'Password Changed - LeadGenFlow AI',
      html: passwordChangedEmail(resetToken.user.name),
    });

    return NextResponse.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
