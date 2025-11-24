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

  // HOSPITALITY SECTOR
  const hospitalityClient = await prisma.clientCompany.upsert({
    where: { contactEmail: 'info@grandviewhotel.com' },
    update: {},
    create: {
      name: 'Grand View Hotel & Restaurant',
      industry: 'Hospitality',
      businessSector: 'HOSPITALITY',
      website: 'https://grandviewhotel.com',
      contactName: 'Emily Chen',
      contactEmail: 'info@grandviewhotel.com',
      contactPhone: '555-3000',
    },
  });

  await prisma.user.upsert({
    where: { email: 'emily@grandviewhotel.com' },
    update: {},
    create: {
      email: 'emily@grandviewhotel.com',
      hashedPassword: adminPassword,
      name: 'Emily Chen',
      role: 'CLIENT',
      clientId: hospitalityClient.id,
    },
  });
  console.log('✅ Hospitality client created');

  // FITNESS_WELLNESS SECTOR
  const fitnessClient = await prisma.clientCompany.upsert({
    where: { contactEmail: 'contact@zenfitstudio.com' },
    update: {},
    create: {
      name: 'ZenFit Yoga & Wellness Studio',
      industry: 'Fitness & Wellness',
      businessSector: 'FITNESS_WELLNESS',
      website: 'https://zenfitstudio.com',
      contactName: 'Marcus Thompson',
      contactEmail: 'contact@zenfitstudio.com',
      contactPhone: '555-4000',
    },
  });

  await prisma.user.upsert({
    where: { email: 'marcus@zenfitstudio.com' },
    update: {},
    create: {
      email: 'marcus@zenfitstudio.com',
      hashedPassword: adminPassword,
      name: 'Marcus Thompson',
      role: 'CLIENT',
      clientId: fitnessClient.id,
    },
  });
  console.log('✅ Fitness & Wellness client created');

  // CONSTRUCTION SECTOR
  const constructionClient = await prisma.clientCompany.upsert({
    where: { contactEmail: 'info@premierbuilders.com' },
    update: {},
    create: {
      name: 'Premier Builders & Contractors',
      industry: 'Construction',
      businessSector: 'CONSTRUCTION',
      website: 'https://premierbuilders.com',
      contactName: 'David Rodriguez',
      contactEmail: 'info@premierbuilders.com',
      contactPhone: '555-5000',
    },
  });

  await prisma.user.upsert({
    where: { email: 'david@premierbuilders.com' },
    update: {},
    create: {
      email: 'david@premierbuilders.com',
      hashedPassword: adminPassword,
      name: 'David Rodriguez',
      role: 'CLIENT',
      clientId: constructionClient.id,
    },
  });
  console.log('✅ Construction client created');

  // ECOMMERCE SECTOR
  const ecommerceClient = await prisma.clientCompany.upsert({
    where: { contactEmail: 'hello@trendygoods.com' },
    update: {},
    create: {
      name: 'TrendyGoods Online Store',
      industry: 'E-Commerce',
      businessSector: 'ECOMMERCE',
      website: 'https://trendygoods.com',
      contactName: 'Jessica Lee',
      contactEmail: 'hello@trendygoods.com',
      contactPhone: '555-6000',
    },
  });

  await prisma.user.upsert({
    where: { email: 'jessica@trendygoods.com' },
    update: {},
    create: {
      email: 'jessica@trendygoods.com',
      hashedPassword: adminPassword,
      name: 'Jessica Lee',
      role: 'CLIENT',
      clientId: ecommerceClient.id,
    },
  });
  console.log('✅ E-Commerce client created');

  // INSURANCE SECTOR
  const insuranceClient = await prisma.clientCompany.upsert({
    where: { contactEmail: 'contact@shieldinsurance.com' },
    update: {},
    create: {
      name: 'Shield Insurance Agency',
      industry: 'Insurance',
      businessSector: 'INSURANCE',
      website: 'https://shieldinsurance.com',
      contactName: 'Brian Anderson',
      contactEmail: 'contact@shieldinsurance.com',
      contactPhone: '555-7000',
    },
  });

  await prisma.user.upsert({
    where: { email: 'brian@shieldinsurance.com' },
    update: {},
    create: {
      email: 'brian@shieldinsurance.com',
      hashedPassword: adminPassword,
      name: 'Brian Anderson',
      role: 'CLIENT',
      clientId: insuranceClient.id,
    },
  });
  console.log('✅ Insurance client created');

  // SOLAR_ENERGY SECTOR
  const solarClient = await prisma.clientCompany.upsert({
    where: { contactEmail: 'info@sunshinepowersolar.com' },
    update: {},
    create: {
      name: 'Sunshine Power Solar',
      industry: 'Solar Energy',
      businessSector: 'SOLAR_ENERGY',
      website: 'https://sunshinepowersolar.com',
      contactName: 'Amanda Martinez',
      contactEmail: 'info@sunshinepowersolar.com',
      contactPhone: '555-8000',
    },
  });

  await prisma.user.upsert({
    where: { email: 'amanda@sunshinepowersolar.com' },
    update: {},
    create: {
      email: 'amanda@sunshinepowersolar.com',
      hashedPassword: adminPassword,
      name: 'Amanda Martinez',
      role: 'CLIENT',
      clientId: solarClient.id,
    },
  });
  console.log('✅ Solar Energy client created');

  console.log('\n🎉 Seed completed!');
  console.log('\nLogin credentials:');
  console.log('  Admin: admin@leadgenflow.com / password123');
  console.log('  Home Services: john@acmehvac.com / password123');
  console.log('  Legal Services: michael@smithlawfirm.com / password123');
  console.log('  Hospitality: emily@grandviewhotel.com / password123');
  console.log('  Fitness & Wellness: marcus@zenfitstudio.com / password123');
  console.log('  Construction: david@premierbuilders.com / password123');
  console.log('  E-Commerce: jessica@trendygoods.com / password123');
  console.log('  Insurance: brian@shieldinsurance.com / password123');
  console.log('  Solar Energy: amanda@sunshinepowersolar.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
