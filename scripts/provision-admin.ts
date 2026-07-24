import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function main() {
  const email = required('PROVISION_ADMIN_EMAIL').toLowerCase();
  const password = required('PROVISION_ADMIN_PASSWORD');
  const name = required('PROVISION_ADMIN_NAME');
  const companyName = required('PROVISION_COMPANY_NAME');
  if (password.length < 14) throw new Error('PROVISION_ADMIN_PASSWORD must contain at least 14 characters');
  const hashedPassword = await bcrypt.hash(password, 12);
  await prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { email } });
    if (existing) {
      await tx.user.update({
        where: { id: existing.id },
        data: {
          hashedPassword,
          name,
          role: 'ADMIN',
          status: 'ACTIVE',
          emailVerified: true,
          emailVerifiedAt: new Date(),
          authVersion: { increment: 1 },
        },
      });
      return;
    }
    const client = await tx.clientCompany.create({
      data: {
        name: companyName,
        industry: 'Sales operations',
        contactName: name,
        contactEmail: email,
        lifecycleStage: 'ACTIVE_CUSTOMER',
      },
    });
    await tx.user.create({
      data: {
        email,
        hashedPassword,
        name,
        role: 'ADMIN',
        clientId: client.id,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
  });
  console.log('Configured administrator is ready');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
