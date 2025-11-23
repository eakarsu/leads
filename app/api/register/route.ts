import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

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

    // Validation
    if (!businessSector || !companyName || !contactName || !email || !password) {
      return NextResponse.json(
        { error: 'Business sector, company name, contact name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create client company and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create client company
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

      // Create user and associate with client company
      const user = await tx.user.create({
        data: {
          email,
          hashedPassword,
          name: contactName,
          role: 'CLIENT',
          clientId: clientCompany.id,
        },
      });

      return { clientCompany, user };
    });

    return NextResponse.json(
      {
        message: 'Account created successfully',
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
