import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Starting seed...');

  const adminPassword = await bcrypt.hash('password123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@leadgenflow.com' },
    update: {},
    create: {
      email: 'admin@leadgenflow.com',
      hashedPassword: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user created');

  const homeServicesClient = await prisma.clientCompany.upsert({
    where: { contactEmail: 'contact@acmehvac.com' },
    update: {},
    create: {
      name: 'ACME HVAC & Plumbing',
      industry: 'Home Services',
      businessSector: 'HOME_SERVICES',
      website: 'https://acmehvac.com',
      contactName: 'John Smith',
      contactEmail: 'contact@acmehvac.com',
      contactPhone: '555-1234',
    },
  });

  await prisma.user.upsert({
    where: { email: 'john@acmehvac.com' },
    update: {},
    create: {
      email: 'john@acmehvac.com',
      hashedPassword: adminPassword,
      name: 'John Smith',
      role: 'CLIENT',
      clientId: homeServicesClient.id,
    },
  });

  const homeServicesCampaign = await prisma.campaign.create({
    data: {
      clientId: homeServicesClient.id,
      name: 'HVAC Replacement Campaign Q1 2025',
      description: 'Target homeowners needing HVAC replacement',
      status: 'ACTIVE',
      channel: 'MULTI_CHANNEL',
      targetPersona: 'Homeowners, 40-65 years old',
      ownerId: admin.id,
      startDate: new Date(),
    },
  });

  await prisma.lead.create({
    data: {
      campaignId: homeServicesCampaign.id,
      clientId: homeServicesClient.id,
      fullName: 'Sarah Johnson',
      company: 'Homeowner',
      title: 'Homeowner',
      email: 'sarah.johnson@email.com',
      phone: '555-0101',
      leadSource: 'AGENCY',
      status: 'QUALIFIED',
      qualificationScore: 85,
      customFields: {
        projectDescription: 'AC unit stopped working, needs replacement.',
        propertyType: 'Residential - Single Family',
        serviceNeeded: 'Replace/Install',
        urgency: 'Urgent (This week)',
        propertyOwnership: 'Own',
        budgetRange: '$5,000 - $15,000',
      },
    },
  });
  console.log('✅ Home Services client created with sample leads');

  const legalClient = await prisma.clientCompany.upsert({
    where: { contactEmail: 'info@smithlawfirm.com' },
    update: {},
    create: {
      name: 'Smith & Associates Law Firm',
      industry: 'Legal Services',
      businessSector: 'LEGAL_SERVICES',
      website: 'https://smithlawfirm.com',
      contactName: 'Michael Smith',
      contactEmail: 'info@smithlawfirm.com',
      contactPhone: '555-5678',
    },
  });

  await prisma.user.upsert({
    where: { email: 'michael@smithlawfirm.com' },
    update: {},
    create: {
      email: 'michael@smithlawfirm.com',
      hashedPassword: adminPassword,
      name: 'Michael Smith',
      role: 'CLIENT',
      clientId: legalClient.id,
    },
  });

  const legalCampaign = await prisma.campaign.create({
    data: {
      clientId: legalClient.id,
      name: 'Personal Injury Lead Generation',
      description: 'Auto accident cases',
      status: 'ACTIVE',
      channel: 'PAID_ADS',
      targetPersona: 'Accident victims',
      ownerId: admin.id,
      startDate: new Date(),
    },
  });

  await prisma.lead.create({
    data: {
      campaignId: legalCampaign.id,
      clientId: legalClient.id,
      fullName: 'Robert Williams',
      company: 'Individual',
      title: 'Prospective Client',
      email: 'robert.w@email.com',
      phone: '555-0202',
      leadSource: 'AGENCY',
      status: 'CONTACTED',
      qualificationScore: 92,
      customFields: {
        caseType: 'Personal Injury - Auto Accident',
        caseDescription: 'Rear-ended at red light, neck and back injuries.',
        injurySeverity: 'Moderate',
        incidentDate: '2025-01-15',
        insuranceCoverage: 'Yes - Other party insured',
        priorAttorney: 'No',
      },
    },
  });
  console.log('✅ Legal Services client created with sample leads');

  console.log('\n🎉 Seed completed!');
  console.log('\nLogin credentials:');
  console.log('  Admin: admin@leadgenflow.com / password123');
  console.log('  Home Services: john@acmehvac.com / password123');
  console.log('  Legal Services: michael@smithlawfirm.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
