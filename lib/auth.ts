import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { UserRole, UserStatus } from '@prisma/client';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  clientId?: string;
  businessSector?: string;
  authVersion: number;
  status: UserStatus;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.trim().toLowerCase() },
          include: {
            client: {
              select: {
                businessSector: true,
              },
            },
          },
        });

        if (!user || user.status !== 'ACTIVE') {
          throw new Error('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          clientId: user.clientId || undefined,
          businessSector: user.client?.businessSector,
          authVersion: user.authVersion,
          status: user.status,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.clientId = user.clientId;
        token.businessSector = user.businessSector;
        token.authVersion = user.authVersion;
        token.status = user.status;
      }
      if (token.id) {
        const current = await prisma.user.findUnique({
          where: { id: token.id },
          select: { role: true, clientId: true, authVersion: true, status: true },
        });
        token.invalid = !current
          || current.status !== 'ACTIVE'
          || (typeof token.authVersion === 'number' && current.authVersion !== token.authVersion);
        if (current && !token.invalid) {
          token.role = current.role;
          token.clientId = current.clientId || undefined;
          token.authVersion = current.authVersion;
          token.status = current.status;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.clientId = token.clientId;
        session.user.businessSector = token.businessSector;
        session.user.authVersion = token.authVersion as number;
        session.user.status = token.status as UserStatus;
        session.user.invalid = token.invalid;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
