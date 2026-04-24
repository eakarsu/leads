import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json({ error: 'Invalid verification link' }, { status: 400 });
    }

    if (verificationToken.usedAt) {
      return NextResponse.json({ error: 'Email has already been verified' }, { status: 400 });
    }

    if (verificationToken.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Verification link has expired' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerified: true, emailVerifiedAt: new Date() },
      }),
      prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 });
  }
}
