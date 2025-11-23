import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { generateLeadsForSector, generateActivitiesForSector } from '@/lib/seed-data-generator';

export async function GET() {
  try {
    console.log('🌱 Starting comprehensive seed for all sectors...');

    const password = await bcrypt.hash('password123', 10);

    // Clear existing data in correct order (respect foreign keys)
    await prisma.message.deleteMany({});
    await prisma.messageThread.deleteMany({});
    await prisma.leadActivity.deleteMany({});
    await prisma.lead.deleteMany({});
    await prisma.campaign.deleteMany({});
    await prisma.reportSnapshot.deleteMany({});
    await prisma.user.deleteMany({ where: { role: { not: 'ADMIN' } } });
    await prisma.clientCompany.deleteMany({});

    // Create Admin
    const admin = await prisma.user.upsert({
      where: { email: 'admin@leadgenflow.com' },
      update: {},
      create: {
        email: 'admin@leadgenflow.com',
        hashedPassword: password,
        name: 'Admin User',
        role: 'ADMIN',
      },
    });

    const sectorsConfig = [
      {
        sector: 'HOME_SERVICES',
        client: {
          name: 'ACME HVAC & Plumbing',
          industry: 'Home Services',
          website: 'https://acmehvac.com',
          contactName: 'John Smith',
          contactEmail: 'contact@acmehvac.com',
          contactPhone: '555-1234',
        },
        user: { email: 'john@acmehvac.com', name: 'John Smith' },
        campaign: {
          name: 'HVAC Replacement Campaign Q1 2025',
          description: 'Target homeowners needing HVAC replacement',
        },
      },
      {
        sector: 'LEGAL_SERVICES',
        client: {
          name: 'Smith & Associates Law Firm',
          industry: 'Legal Services',
          website: 'https://smithlawfirm.com',
          contactName: 'Michael Smith',
          contactEmail: 'info@smithlawfirm.com',
          contactPhone: '555-5678',
        },
        user: { email: 'michael@smithlawfirm.com', name: 'Michael Smith' },
        campaign: {
          name: 'Personal Injury Lead Generation',
          description: 'Auto accident and personal injury cases',
        },
      },
      {
        sector: 'FINANCIAL_SERVICES',
        client: {
          name: 'Premier Insurance Group',
          industry: 'Financial Services',
          website: 'https://premierinsurance.com',
          contactName: 'Lisa Anderson',
          contactEmail: 'info@premierinsurance.com',
          contactPhone: '555-9012',
        },
        user: { email: 'lisa@premierinsurance.com', name: 'Lisa Anderson' },
        campaign: {
          name: 'Life Insurance Leads Q1 2025',
          description: 'Target families needing life and mortgage insurance',
        },
      },
      {
        sector: 'REAL_ESTATE',
        client: {
          name: 'Dream Home Realty',
          industry: 'Real Estate',
          website: 'https://dreamhomerealty.com',
          contactName: 'Jennifer Davis',
          contactEmail: 'info@dreamhomerealty.com',
          contactPhone: '555-3456',
        },
        user: { email: 'jennifer@dreamhomerealty.com', name: 'Jennifer Davis' },
        campaign: {
          name: 'First-Time Home Buyers 2025',
          description: 'Target first-time buyers and sellers',
        },
      },
      {
        sector: 'HEALTHCARE',
        client: {
          name: 'Bright Smile Dental',
          industry: 'Healthcare',
          website: 'https://brightsmile.com',
          contactName: 'Dr. James Wilson',
          contactEmail: 'info@brightsmile.com',
          contactPhone: '555-7890',
        },
        user: { email: 'james@brightsmile.com', name: 'Dr. James Wilson' },
        campaign: {
          name: 'Cosmetic Dentistry Campaign',
          description: 'Target patients interested in cosmetic and general dental procedures',
        },
      },
      {
        sector: 'B2B_SAAS',
        client: {
          name: 'CloudFlow Technologies',
          industry: 'B2B SaaS',
          website: 'https://cloudflow.io',
          contactName: 'Alex Thompson',
          contactEmail: 'info@cloudflow.io',
          contactPhone: '555-2468',
        },
        user: { email: 'alex@cloudflow.io', name: 'Alex Thompson' },
        campaign: {
          name: 'Enterprise Software Demo Campaign',
          description: 'Target mid-market and enterprise companies',
        },
      },
      {
        sector: 'EDUCATION',
        client: {
          name: 'Tech Academy',
          industry: 'Education',
          website: 'https://techacademy.edu',
          contactName: 'Maria Garcia',
          contactEmail: 'info@techacademy.edu',
          contactPhone: '555-1357',
        },
        user: { email: 'maria@techacademy.edu', name: 'Maria Garcia' },
        campaign: {
          name: 'Coding Bootcamp Enrollment 2025',
          description: 'Target career changers and students',
        },
      },
      {
        sector: 'AUTOMOTIVE',
        client: {
          name: 'Premier Auto Sales',
          industry: 'Automotive',
          website: 'https://premierauto.com',
          contactName: 'Robert Johnson',
          contactEmail: 'info@premierauto.com',
          contactPhone: '555-8642',
        },
        user: { email: 'robert@premierauto.com', name: 'Robert Johnson' },
        campaign: {
          name: 'Luxury Vehicle Sales Campaign',
          description: 'Target new and used car buyers',
        },
      },
    ];

    const accounts = [];

    for (const sectorData of sectorsConfig) {
      // Generate 15 leads for this sector
      const leads = generateLeadsForSector(sectorData.sector, 101);
      // Generate 15 activities for this sector
      const activities = generateActivitiesForSector(sectorData.sector);

      // Create client
      const client = await prisma.clientCompany.create({
        data: {
          ...sectorData.client,
          businessSector: sectorData.sector as any,
        },
      });

      // Create user
      const user = await prisma.user.create({
        data: {
          email: sectorData.user.email,
          hashedPassword: password,
          name: sectorData.user.name,
          role: 'CLIENT',
          clientId: client.id,
        },
      });

      // Create campaign
      const campaign = await prisma.campaign.create({
        data: {
          clientId: client.id,
          name: sectorData.campaign.name,
          description: sectorData.campaign.description,
          status: 'ACTIVE',
          channel: 'MULTI_CHANNEL',
          targetPersona: 'Target audience',
          ownerId: admin.id,
          startDate: new Date(),
        },
      });

      let totalActivities = 0;

      // Create 15 leads from generator with industry-specific custom fields
      for (let i = 0; i < leads.length; i++) {
        const leadData = leads[i];
        const lead = await prisma.lead.create({
          data: {
            campaignId: campaign.id,
            clientId: client.id,
            fullName: leadData.fullName,
            company: leadData.company,
            title: leadData.title,
            email: leadData.email,
            phone: leadData.phone,
            leadSource: 'AGENCY',
            status: (leadData as any).status || 'QUALIFIED',
            qualificationScore: (leadData as any).score || 85,
            customFields: leadData.customFields,
          },
        });

        // Add activities to each lead (all 15 activities per lead)
        for (const activityData of activities) {
          await prisma.leadActivity.create({
            data: {
              leadId: lead.id,
              userId: user.id,
              type: activityData.type as any,
              content: activityData.content,
              timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random time in last 30 days
            },
          });
          totalActivities++;
        }
      }

      accounts.push({
        sector: sectorData.sector,
        email: sectorData.user.email,
        password: 'password123',
        company: sectorData.client.name,
        leadsCreated: leads.length,
        activitiesCreated: totalActivities,
      });

      console.log(`✅ Created ${sectorData.sector} with ${leads.length} leads and ${totalActivities} activities`);
    }

    console.log('🎉 All sectors seeded successfully!');

    return NextResponse.json({
      success: true,
      message: 'All business sectors seeded successfully with 15 leads and 15 activities each!',
      accounts: [
        { email: 'admin@leadgenflow.com', password: 'password123', role: 'ADMIN' },
        ...accounts,
      ],
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
