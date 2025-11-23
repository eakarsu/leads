import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    console.log('🌱 Starting simple seed...');

    const adminPassword = await bcrypt.hash('password123', 10);

    // Create admin
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

    // Create Home Services client
    const homeServicesClient = await prisma.clientCompany.create({
      data: {
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

    return NextResponse.json({
      success: true,
      message: 'Seed data created successfully!',
      accounts: [
        { email: 'admin@leadgenflow.com', password: 'password123', role: 'ADMIN' },
        { email: 'john@acmehvac.com', password: 'password123', company: 'ACME HVAC & Plumbing', sector: 'HOME_SERVICES' },
      ],
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
