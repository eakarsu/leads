import { prisma } from '@/lib/prisma';

const userId = process.argv[2];
if (!userId) {
  console.error('Usage: npm run auth:revoke -- <user-id>');
  process.exit(1);
}

prisma.user.update({ where: { id: userId }, data: { authVersion: { increment: 1 } } })
  .then(() => console.log('All sessions revoked'))
  .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
