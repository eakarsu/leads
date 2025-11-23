import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'client@test.com' },
    });

    if (existingUser) {
      return NextResponse.json({
        message: 'User already exists',
        user: {
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
          clientId: existingUser.clientId,
        }
      });
    }

    // Create the user
    const hashedPassword = await bcrypt.hash('password123', 10);

    const user = await prisma.user.create({
      data: {
        email: 'client@test.com',
        hashedPassword,
        name: 'Test Client User',
        role: 'CLIENT',
        clientId: null,
      },
    });

    return NextResponse.json({
      message: 'User created successfully!',
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        clientId: user.clientId,
      },
      credentials: {
        email: 'client@test.com',
        password: 'password123',
      }
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user', details: error.message },
      { status: 500 }
    );
  }
}
