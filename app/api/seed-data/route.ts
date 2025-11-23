import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    console.log('🌱 Starting seed...');

    const adminPassword = await bcrypt.hash('password123', 10);

    // Create Home Services client
    const existingHomeServices = await prisma.clientCompany.findFirst({
      where: { contactEmail: 'contact@acmehvac.com' }
    });

    const homeServicesClient = existingHomeServices || await prisma.clientCompany.create({
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

    const admin = await prisma.user.findUnique({ where: { email: 'admin@leadgenflow.com' } });
    if (!admin) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

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
          projectDescription: 'AC unit stopped working, needs replacement. House is 2500 sq ft.',
          propertyType: 'Residential - Single Family',
          serviceNeeded: 'Replace/Install',
          urgency: 'Urgent (This week)',
          propertyOwnership: 'Own',
          budgetRange: '$5,000 - $15,000',
        },
      },
    });

    // Legal Services
    const existingLegal = await prisma.clientCompany.findFirst({
      where: { contactEmail: 'info@smithlawfirm.com' }
    });

    const legalClient = existingLegal || await prisma.clientCompany.create({
      data: {
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
          caseDescription: 'Rear-ended at red light, sustained neck and back injuries.',
          injurySeverity: 'Moderate',
          incidentDate: '2025-01-15',
          insuranceCoverage: 'Yes - Other party insured',
          priorAttorney: 'No',
        },
      },
    });

    // Financial Services
    const existingFinancial = await prisma.clientCompany.findFirst({
      where: { contactEmail: 'contact@premierinsurance.com' }
    });

    const financialClient = existingFinancial || await prisma.clientCompany.create({
      data: {
        name: 'Premier Insurance Group',
        industry: 'Insurance',
        businessSector: 'FINANCIAL_SERVICES',
        website: 'https://premierinsurance.com',
        contactName: 'Lisa Chen',
        contactEmail: 'contact@premierinsurance.com',
        contactPhone: '555-9012',
      },
    });

    await prisma.user.upsert({
      where: { email: 'lisa@premierinsurance.com' },
      update: {},
      create: {
        email: 'lisa@premierinsurance.com',
        hashedPassword: adminPassword,
        name: 'Lisa Chen',
        role: 'CLIENT',
        clientId: financialClient.id,
      },
    });

    const financialCampaign = await prisma.campaign.create({
      data: {
        clientId: financialClient.id,
        name: 'Life Insurance Q1 Campaign',
        description: 'Target professionals for life insurance',
        status: 'ACTIVE',
        channel: 'EMAIL',
        targetPersona: 'Working professionals with families',
        ownerId: admin.id,
        startDate: new Date(),
      },
    });

    await prisma.lead.create({
      data: {
        campaignId: financialCampaign.id,
        clientId: financialClient.id,
        fullName: 'David Martinez',
        company: 'Tech Corp',
        title: 'Software Engineer',
        email: 'david.m@email.com',
        phone: '555-0303',
        leadSource: 'AGENCY',
        status: 'QUALIFIED',
        qualificationScore: 78,
        customFields: {
          serviceType: 'Life Insurance',
          coverageAmount: '$500K - $1M',
          creditScoreRange: 'Excellent (720+)',
          currentCoverage: 'No - first time',
          timeline: 'Soon (this month)',
        },
      },
    });

    // Real Estate
    const existingRealEstate = await prisma.clientCompany.findFirst({
      where: { contactEmail: 'team@dreamhomerealty.com' }
    });

    const realEstateClient = existingRealEstate || await prisma.clientCompany.create({
      data: {
        name: 'Dream Home Realty',
        industry: 'Real Estate',
        businessSector: 'REAL_ESTATE',
        website: 'https://dreamhomerealty.com',
        contactName: 'Jennifer Davis',
        contactEmail: 'team@dreamhomerealty.com',
        contactPhone: '555-3456',
      },
    });

    await prisma.user.upsert({
      where: { email: 'jennifer@dreamhomerealty.com' },
      update: {},
      create: {
        email: 'jennifer@dreamhomerealty.com',
        hashedPassword: adminPassword,
        name: 'Jennifer Davis',
        role: 'CLIENT',
        clientId: realEstateClient.id,
      },
    });

    const realEstateCampaign = await prisma.campaign.create({
      data: {
        clientId: realEstateClient.id,
        name: 'First-Time Homebuyer Campaign',
        description: 'Target millennials looking to buy',
        status: 'ACTIVE',
        channel: 'LINKEDIN',
        targetPersona: 'Millennials, 28-38 years old',
        ownerId: admin.id,
        startDate: new Date(),
      },
    });

    await prisma.lead.create({
      data: {
        campaignId: realEstateCampaign.id,
        clientId: realEstateClient.id,
        fullName: 'Emily Thompson',
        company: 'Marketing Agency',
        title: 'Marketing Manager',
        email: 'emily.t@email.com',
        phone: '555-0404',
        leadSource: 'AGENCY',
        status: 'NEW',
        qualificationScore: 65,
        customFields: {
          lookingFor: 'Buy a home',
          location: 'Austin, TX - Downtown area',
          priceRange: '$400K - $600K',
          timeline: 'Soon (1-3 months)',
          preApproved: 'In process',
          currentSituation: 'First-time buyer',
        },
      },
    });

    // Healthcare
    const existingHealthcare = await prisma.clientCompany.findFirst({
      where: { contactEmail: 'info@brightsmile.com' }
    });

    const healthcareClient = existingHealthcare || await prisma.clientCompany.create({
      data: {
        name: 'Bright Smile Dental',
        industry: 'Healthcare - Dental',
        businessSector: 'HEALTHCARE',
        website: 'https://brightsmile.com',
        contactName: 'Dr. James Wilson',
        contactEmail: 'info@brightsmile.com',
        contactPhone: '555-7890',
      },
    });

    await prisma.user.upsert({
      where: { email: 'james@brightsmile.com' },
      update: {},
      create: {
        email: 'james@brightsmile.com',
        hashedPassword: adminPassword,
        name: 'Dr. James Wilson',
        role: 'CLIENT',
        clientId: healthcareClient.id,
      },
    });

    const healthcareCampaign = await prisma.campaign.create({
      data: {
        clientId: healthcareClient.id,
        name: 'Cosmetic Dentistry Campaign',
        description: 'Target patients for cosmetic procedures',
        status: 'ACTIVE',
        channel: 'PAID_ADS',
        targetPersona: 'Adults 25-55 interested in smile makeover',
        ownerId: admin.id,
        startDate: new Date(),
      },
    });

    await prisma.lead.create({
      data: {
        campaignId: healthcareCampaign.id,
        clientId: healthcareClient.id,
        fullName: 'Amanda Rodriguez',
        company: 'Self-employed',
        title: 'Business Owner',
        email: 'amanda.r@email.com',
        phone: '555-0505',
        leadSource: 'AGENCY',
        status: 'NEW',
        qualificationScore: 70,
        customFields: {
          serviceInterest: 'Dental - Cosmetic',
          insuranceStatus: 'Have insurance',
          urgency: 'Normal - willing to wait',
          preferredContact: 'Phone',
        },
      },
    });

    // B2B SaaS
    const existingSaas = await prisma.clientCompany.findFirst({
      where: { contactEmail: 'sales@cloudflow.io' }
    });

    const saasClient = existingSaas || await prisma.clientCompany.create({
      data: {
        name: 'CloudFlow Solutions',
        industry: 'SaaS - Project Management',
        businessSector: 'B2B_SAAS',
        website: 'https://cloudflow.io',
        contactName: 'Alex Kumar',
        contactEmail: 'sales@cloudflow.io',
        contactPhone: '555-4567',
      },
    });

    await prisma.user.upsert({
      where: { email: 'alex@cloudflow.io' },
      update: {},
      create: {
        email: 'alex@cloudflow.io',
        hashedPassword: adminPassword,
        name: 'Alex Kumar',
        role: 'CLIENT',
        clientId: saasClient.id,
      },
    });

    const saasCampaign = await prisma.campaign.create({
      data: {
        clientId: saasClient.id,
        name: 'Enterprise SaaS Outbound',
        description: 'Target mid-market companies',
        status: 'ACTIVE',
        channel: 'EMAIL',
        targetPersona: 'IT Directors, Project Managers, CTOs',
        ownerId: admin.id,
        startDate: new Date(),
      },
    });

    await prisma.lead.create({
      data: {
        campaignId: saasCampaign.id,
        clientId: saasClient.id,
        fullName: 'Thomas Anderson',
        company: 'TechStartup Inc',
        title: 'CTO',
        email: 'thomas.a@email.com',
        phone: '555-0606',
        leadSource: 'AGENCY',
        status: 'CONTACTED',
        qualificationScore: 88,
        customFields: {
          companySize: '51-200 employees',
          industry: 'Technology',
          currentSolution: 'Using competitor',
          budget: '$50K - $100K',
          timeline: '3-6 months',
          decisionMaker: 'Decision maker',
        },
      },
    });

    // Education
    const existingEducation = await prisma.clientCompany.findFirst({
      where: { contactEmail: 'admissions@techacademy.edu' }
    });

    const educationClient = existingEducation || await prisma.clientCompany.create({
      data: {
        name: 'Tech Skills Academy',
        industry: 'Online Education',
        businessSector: 'EDUCATION',
        website: 'https://techacademy.edu',
        contactName: 'Maria Garcia',
        contactEmail: 'admissions@techacademy.edu',
        contactPhone: '555-8901',
      },
    });

    await prisma.user.upsert({
      where: { email: 'maria@techacademy.edu' },
      update: {},
      create: {
        email: 'maria@techacademy.edu',
        hashedPassword: adminPassword,
        name: 'Maria Garcia',
        role: 'CLIENT',
        clientId: educationClient.id,
      },
    });

    const educationCampaign = await prisma.campaign.create({
      data: {
        clientId: educationClient.id,
        name: 'Coding Bootcamp Enrollment',
        description: 'Target career changers',
        status: 'ACTIVE',
        channel: 'PAID_ADS',
        targetPersona: 'Career changers, 25-40 years old',
        ownerId: admin.id,
        startDate: new Date(),
      },
    });

    await prisma.lead.create({
      data: {
        campaignId: educationCampaign.id,
        clientId: educationClient.id,
        fullName: 'Kevin Lee',
        company: 'Retail Corp',
        title: 'Store Manager',
        email: 'kevin.l@email.com',
        phone: '555-0707',
        leadSource: 'AGENCY',
        status: 'NEW',
        qualificationScore: 60,
        customFields: {
          programInterest: 'Full Stack Web Development',
          educationLevel: 'Bachelor Degree',
          studyPreference: 'Online',
          startDate: '3-6 months',
        },
      },
    });

    // Automotive
    const existingAutomotive = await prisma.clientCompany.findFirst({
      where: { contactEmail: 'sales@premierauto.com' }
    });

    const automotiveClient = existingAutomotive || await prisma.clientCompany.create({
      data: {
        name: 'Premier Auto Group',
        industry: 'Automotive Sales',
        businessSector: 'AUTOMOTIVE',
        website: 'https://premierauto.com',
        contactName: 'Robert Taylor',
        contactEmail: 'sales@premierauto.com',
        contactPhone: '555-2345',
      },
    });

    await prisma.user.upsert({
      where: { email: 'robert@premierauto.com' },
      update: {},
      create: {
        email: 'robert@premierauto.com',
        hashedPassword: adminPassword,
        name: 'Robert Taylor',
        role: 'CLIENT',
        clientId: automotiveClient.id,
      },
    });

    const automotiveCampaign = await prisma.campaign.create({
      data: {
        clientId: automotiveClient.id,
        name: 'SUV Sales Campaign',
        description: 'Target families for SUV purchases',
        status: 'ACTIVE',
        channel: 'PAID_ADS',
        targetPersona: 'Families, 30-50 years old',
        ownerId: admin.id,
        startDate: new Date(),
      },
    });

    await prisma.lead.create({
      data: {
        campaignId: automotiveCampaign.id,
        clientId: automotiveClient.id,
        fullName: 'Jessica Brown',
        company: 'N/A',
        title: 'Homemaker',
        email: 'jessica.b@email.com',
        phone: '555-0808',
        leadSource: 'AGENCY',
        status: 'QUALIFIED',
        qualificationScore: 82,
        customFields: {
          interestType: 'Buy new car',
          vehicleType: 'SUV',
          budgetRange: '$35K - $50K',
          timeline: 'This month',
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Seed data created successfully for all business sectors!',
      accounts: [
        { email: 'john@acmehvac.com', password: 'password123', company: 'ACME HVAC & Plumbing', sector: 'HOME_SERVICES' },
        { email: 'michael@smithlawfirm.com', password: 'password123', company: 'Smith & Associates Law Firm', sector: 'LEGAL_SERVICES' },
        { email: 'lisa@premierinsurance.com', password: 'password123', company: 'Premier Insurance Group', sector: 'FINANCIAL_SERVICES' },
        { email: 'jennifer@dreamhomerealty.com', password: 'password123', company: 'Dream Home Realty', sector: 'REAL_ESTATE' },
        { email: 'james@brightsmile.com', password: 'password123', company: 'Bright Smile Dental', sector: 'HEALTHCARE' },
        { email: 'alex@cloudflow.io', password: 'password123', company: 'CloudFlow Solutions', sector: 'B2B_SAAS' },
        { email: 'maria@techacademy.edu', password: 'password123', company: 'Tech Skills Academy', sector: 'EDUCATION' },
        { email: 'robert@premierauto.com', password: 'password123', company: 'Premier Auto Group', sector: 'AUTOMOTIVE' },
      ],
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
