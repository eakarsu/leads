const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== CRM Database Data Verification ===\n');

  const opportunities = await prisma.opportunity.count();
  const contacts = await prisma.contact.count();
  const tasks = await prisma.task.count();
  const events = await prisma.event.count();
  const products = await prisma.product.count();
  const emailTemplates = await prisma.emailTemplate.count();
  const territories = await prisma.territory.count();

  console.log('📊 Data Counts:');
  console.log(`  Opportunities: ${opportunities}`);
  console.log(`  Contacts: ${contacts}`);
  console.log(`  Tasks: ${tasks}`);
  console.log(`  Events: ${events}`);
  console.log(`  Products: ${products}`);
  console.log(`  Email Templates: ${emailTemplates}`);
  console.log(`  Territories: ${territories}`);

  console.log('\n💼 Sample Opportunities:');
  const sampleOpps = await prisma.opportunity.findMany({
    take: 10,
    include: {
      client: true,
      contact: true,
      owner: true,
    },
  });

  sampleOpps.forEach((opp, idx) => {
    console.log(`  ${idx + 1}. ${opp.name}`);
    console.log(`     Client: ${opp.client.name}`);
    console.log(`     Stage: ${opp.stage}, Amount: $${opp.amount.toLocaleString()}`);
    console.log(`     Owner: ${opp.owner.name}`);
    console.log('');
  });

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
