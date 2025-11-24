import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  try {
    const opportunities = await prisma.opportunity.count();
    const contacts = await prisma.contact.count();
    const tasks = await prisma.task.count();
    const events = await prisma.event.count();
    const products = await prisma.product.count();
    const emailTemplates = await prisma.emailTemplate.count();
    const territories = await prisma.territory.count();

    console.log('Database counts:');
    console.log('- Opportunities:', opportunities);
    console.log('- Contacts:', contacts);
    console.log('- Tasks:', tasks);
    console.log('- Events:', events);
    console.log('- Products:', products);
    console.log('- Email Templates:', emailTemplates);
    console.log('- Territories:', territories);

    // Sample opportunities
    if (opportunities > 0) {
      const sampleOpps = await prisma.opportunity.findMany({
        take: 3,
        include: {
          client: true,
          owner: true,
        }
      });
      console.log('\nSample Opportunities:');
      sampleOpps.forEach((opp) => {
        console.log(`  - ${opp.name} (${opp.stage}, $${opp.amount})`);
      });
    }
  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
