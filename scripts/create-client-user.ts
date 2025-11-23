import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  // Create a CLIENT user without a company
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.create({
    data: {
      email: 'client@test.com',
      hashedPassword,
      name: 'Test Client User',
      role: 'CLIENT',
      clientId: null, // No company assigned
    },
  });

  console.log('\n✅ CLIENT user created successfully!');
  console.log('-----------------------------------');
  console.log('Email:', user.email);
  console.log('Password: password123');
  console.log('Role:', user.role);
  console.log('Client ID:', user.clientId || 'NOT ASSIGNED');
  console.log('-----------------------------------');
  console.log('\nYou can now login with:');
  console.log('Email: client@test.com');
  console.log('Password: password123');
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
