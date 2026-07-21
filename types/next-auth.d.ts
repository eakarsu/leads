import { UserRole, UserStatus } from '@prisma/client';
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      clientId?: string;
      businessSector?: string;
      authVersion: number;
      status: UserStatus;
      invalid?: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    clientId?: string;
    businessSector?: string;
    authVersion: number;
    status: UserStatus;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    clientId?: string;
    businessSector?: string;
    authVersion: number;
    status: UserStatus;
    invalid?: boolean;
  }
}
