import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { emailVerificationEmail } from '@/lib/emailTemplates';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      businessSector,
      companyName,
      industry,
      website,
      contactName,
      email,
      phone,
      password,
    } = body;

    if (!businessSector || !companyName || !contactName || !email || !password) {
      return NextResponse.json(
        { error: 'Business sector, company name, contact name, email, and password are required' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const clientCompany = await tx.clientCompany.create({
        data: {
          name: companyName,
          industry: industry || businessSector,
          businessSector: businessSector,
          website,
          contactName,
          contactEmail: email,
          contactPhone: phone,
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          hashedPassword,
          name: contactName,
          role: 'CLIENT',
          clientId: clientCompany.id,
        },
      });

      // Create email verification token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await tx.emailVerificationToken.create({
        data: { token, userId: user.id, expiresAt },
      });

      return { clientCompany, user, verificationToken: token };
    });

    // Send verification email (non-blocking)
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/verify-email?token=${result.verificationToken}`;

    sendEmail({
      to: email,
      subject: 'Verify Your Email - LeadGenFlow AI',
      html: emailVerificationEmail(verifyUrl, contactName),
    }).catch((err) => console.error('Failed to send verification email:', err));

    return NextResponse.json(
      {
        message: 'Account created successfully. Please check your email to verify your account.',
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
        company: {
          id: result.clientCompany.id,
          name: result.clientCompany.name,
          businessSector: result.clientCompany.businessSector,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
