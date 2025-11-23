import { prisma } from '../lib/prisma';

async function main() {
  // Show all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      clientId: true,
    },
  });

  console.log('\n=== USERS ===');
  users.forEach((user) => {
    console.log(`ID: ${user.id}`);
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Client ID: ${user.clientId || 'NOT ASSIGNED'}`);
    console.log('---');
  });

  // Show all client companies
  const clients = await prisma.clientCompany.findMany({
    select: {
      id: true,
      name: true,
      contactEmail: true,
    },
  });

  console.log('\n=== CLIENT COMPANIES ===');
  clients.forEach((client) => {
    console.log(`ID: ${client.id}`);
    console.log(`Name: ${client.name}`);
    console.log(`Contact Email: ${client.contactEmail}`);
    console.log('---');
  });

  // Example: To assign a user to a client, uncomment and modify:
  // await prisma.user.update({
  //   where: { email: 'client@example.com' },
  //   data: { clientId: 'client-company-id-here' },
  // });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
