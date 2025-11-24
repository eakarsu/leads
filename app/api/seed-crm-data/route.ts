import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface SeedSummary {
  clientsProcessed: number;
  contactsCreated: number;
  opportunitiesCreated: number;
  tasksCreated: number;
  eventsCreated: number;
  productsCreated: number;
  emailTemplatesCreated: number;
  territoriesCreated: number;
  details: Array<{
    clientName: string;
    contacts: number;
    opportunities: number;
    tasks: number;
    events: number;
    products: number;
    emailTemplates: number;
    territories: number;
  }>;
}

// Industry-specific data generators
const opportunityDataByIndustry = {
  HOME_SERVICES: [
    { name: '$5K - HVAC Replacement', amount: 5000, stage: 'QUALIFICATION' },
    { name: '$15K - Full House Renovation', amount: 15000, stage: 'NEEDS_ANALYSIS' },
    { name: '$3K - Water Heater Installation', amount: 3000, stage: 'PROSPECTING' },
    { name: '$12K - Complete Plumbing Overhaul', amount: 12000, stage: 'PROPOSAL' },
    { name: '$2K - Electrical Repair', amount: 2000, stage: 'CLOSED_LOST' },
    { name: '$8K - Roof Repair', amount: 8000, stage: 'NEGOTIATION' },
    { name: '$25K - Home Addition', amount: 25000, stage: 'PROSPECTING' },
    { name: '$1.5K - Furnace Inspection & Repair', amount: 1500, stage: 'CLOSED_WON' },
    { name: '$18K - Solar Panel Installation', amount: 18000, stage: 'NEEDS_ANALYSIS' },
    { name: '$6K - Window Replacement', amount: 6000, stage: 'QUALIFICATION' },
    { name: '$4K - Kitchen Cabinet Refinish', amount: 4000, stage: 'PROPOSAL' },
    { name: '$22K - Bathroom Remodel', amount: 22000, stage: 'PROSPECTING' },
  ],
  LEGAL_SERVICES: [
    { name: 'Personal Injury Case - Car Accident', amount: 50000, stage: 'NEGOTIATION' },
    { name: 'Estate Planning Client', amount: 8000, stage: 'QUALIFICATION' },
    { name: 'Divorce Settlement - High Assets', amount: 75000, stage: 'NEEDS_ANALYSIS' },
    { name: 'Medical Malpractice Claim', amount: 150000, stage: 'PROPOSAL' },
    { name: 'Slip & Fall Personal Injury', amount: 35000, stage: 'CLOSED_LOST' },
    { name: 'Criminal Defense - DUI', amount: 15000, stage: 'PROSPECTING' },
    { name: 'Will & Trust Creation', amount: 5000, stage: 'CLOSED_WON' },
    { name: 'Business Contract Review', amount: 3000, stage: 'QUALIFICATION' },
    { name: 'Custody Battle - Family Law', amount: 25000, stage: 'NEEDS_ANALYSIS' },
    { name: 'Product Liability Lawsuit', amount: 200000, stage: 'PROSPECTING' },
    { name: 'Employment Discrimination Case', amount: 85000, stage: 'PROPOSAL' },
    { name: 'Real Estate Dispute', amount: 20000, stage: 'NEGOTIATION' },
  ],
  FINANCIAL_SERVICES: [
    { name: '$500K Life Insurance Policy', amount: 500, stage: 'CLOSED_WON' },
    { name: '$350K Mortgage Refinance', amount: 2100, stage: 'NEEDS_ANALYSIS' },
    { name: '$250K Investment Portfolio', amount: 15000, stage: 'QUALIFICATION' },
    { name: '$1M Mortgage Purchase', amount: 6000, stage: 'PROPOSAL' },
    { name: 'Auto Insurance Package - Family', amount: 1200, stage: 'PROSPECTING' },
    { name: '$750K Mortgage - Commercial', amount: 4500, stage: 'NEGOTIATION' },
    { name: 'Whole Life Insurance Plan', amount: 800, stage: 'CLOSED_LOST' },
    { name: 'Retirement Planning Strategy', amount: 25000, stage: 'PROSPECTING' },
    { name: '$500K Term Life - 30 Year', amount: 400, stage: 'QUALIFICATION' },
    { name: 'Home Insurance Bundle', amount: 1500, stage: 'CLOSED_WON' },
    { name: 'High Yield Investment Fund', amount: 50000, stage: 'NEEDS_ANALYSIS' },
    { name: 'Umbrella Coverage Policy', amount: 2000, stage: 'PROPOSAL' },
  ],
  B2B_SAAS: [
    { name: 'Enterprise SaaS Deal - Fortune 500', amount: 500000, stage: 'NEGOTIATION' },
    { name: 'Mid-Market Expansion - 150 Users', amount: 150000, stage: 'NEEDS_ANALYSIS' },
    { name: 'Startup Account - 20 Users', amount: 20000, stage: 'PROSPECTING' },
    { name: 'Government Contract - 500 Licenses', amount: 250000, stage: 'PROPOSAL' },
    { name: 'Healthcare Provider System', amount: 300000, stage: 'QUALIFICATION' },
    { name: 'Education Institution License', amount: 75000, stage: 'CLOSED_WON' },
    { name: 'Financial Services Platform', amount: 400000, stage: 'PROSPECTING' },
    { name: 'Retail Chain Software', amount: 180000, stage: 'NEEDS_ANALYSIS' },
    { name: 'Manufacturing ERP System', amount: 350000, stage: 'PROPOSAL' },
    { name: 'Non-Profit Organization Suite', amount: 50000, stage: 'CLOSED_LOST' },
    { name: 'Consulting Firm Platform', amount: 100000, stage: 'NEGOTIATION' },
    { name: 'Real Estate Tech Integration', amount: 225000, stage: 'QUALIFICATION' },
  ],
  REAL_ESTATE: [
    { name: '$450K Single Family Home - Downtown', amount: 450000, stage: 'NEEDS_ANALYSIS' },
    { name: '$650K Suburban House - 4BR/3BA', amount: 650000, stage: 'NEGOTIATION' },
    { name: '$2.5M Luxury Estate', amount: 2500000, stage: 'PROSPECTING' },
    { name: '$1.2M Commercial Retail Space', amount: 1200000, stage: 'PROPOSAL' },
    { name: '$350K First-Time Buyer - Condo', amount: 350000, stage: 'QUALIFICATION' },
    { name: '$5M Mixed-Use Development', amount: 5000000, stage: 'PROSPECTING' },
    { name: '$800K Investment Property Rental', amount: 800000, stage: 'CLOSED_WON' },
    { name: '$275K Multi-Family Duplex', amount: 275000, stage: 'NEEDS_ANALYSIS' },
    { name: '$3M Commercial Office Building', amount: 3000000, stage: 'PROPOSAL' },
    { name: '$525K Move-Up Home - Family', amount: 525000, stage: 'CLOSED_LOST' },
    { name: '$950K Executive Home - Waterfront', amount: 950000, stage: 'NEGOTIATION' },
    { name: '$150K Land Development Deal', amount: 150000, stage: 'QUALIFICATION' },
  ],
  HEALTHCARE: [
    { name: 'Cosmetic Dentistry Package - Veneers', amount: 8000, stage: 'CLOSED_WON' },
    { name: 'Orthodontic Treatment - Braces', amount: 6000, stage: 'NEEDS_ANALYSIS' },
    { name: 'Laser Eye Surgery Procedure', amount: 4000, stage: 'QUALIFICATION' },
    { name: 'Bariatric Surgery Program', amount: 25000, stage: 'PROSPECTING' },
    { name: 'Physical Therapy - 12 Week Program', amount: 3500, stage: 'PROPOSAL' },
    { name: 'Mental Health Counseling - 6 Months', amount: 2400, stage: 'CLOSED_LOST' },
    { name: 'Plastic Surgery Consultation - Face Lift', amount: 15000, stage: 'NEGOTIATION' },
    { name: 'Weight Loss Program - 1 Year', amount: 3000, stage: 'PROSPECTING' },
    { name: 'General Dentistry - Root Canal', amount: 1200, stage: 'CLOSED_WON' },
    { name: 'Addiction Treatment Program - 30 Days', amount: 20000, stage: 'NEEDS_ANALYSIS' },
    { name: 'Sports Medicine Therapy Package', amount: 4500, stage: 'QUALIFICATION' },
    { name: 'Dermatology - Skin Care Treatment', amount: 5000, stage: 'PROPOSAL' },
  ],
  EDUCATION: [
    { name: 'MBA Program - 2 Year', amount: 120000, stage: 'PROSPECTING' },
    { name: 'Coding Bootcamp - 16 Week', amount: 18000, stage: 'NEEDS_ANALYSIS' },
    { name: 'Data Science Certificate - 12 Week', amount: 15000, stage: 'QUALIFICATION' },
    { name: 'Graduate Degree - 2 Year Program', amount: 80000, stage: 'PROPOSAL' },
    { name: 'Professional Certification - Project Mgmt', amount: 5000, stage: 'CLOSED_WON' },
    { name: 'Nursing Degree - 4 Year RN Program', amount: 100000, stage: 'PROSPECTING' },
    { name: 'Executive Leadership Program', amount: 45000, stage: 'NEGOTIATION' },
    { name: 'Language Learning - 6 Month Intensive', amount: 8000, stage: 'NEEDS_ANALYSIS' },
    { name: 'UX Design Bootcamp', amount: 14000, stage: 'CLOSED_LOST' },
    { name: 'Cybersecurity Certificate Program', amount: 12000, stage: 'QUALIFICATION' },
    { name: 'Teaching Credential - 1 Year Program', amount: 35000, stage: 'PROPOSAL' },
    { name: 'PhD Program - 5 Year Full Funding', amount: 150000, stage: 'PROSPECTING' },
  ],
  AUTOMOTIVE: [
    { name: 'BMW X5 M Sport - $58,500', amount: 58500, stage: 'CLOSED_WON' },
    { name: 'Tesla Model S - $75,000', amount: 75000, stage: 'NEGOTIATION' },
    { name: 'Ford F-150 Truck - $45,000', amount: 45000, stage: 'PROPOSAL' },
    { name: 'Honda Civic Used - $18,000', amount: 18000, stage: 'CLOSED_LOST' },
    { name: 'Porsche 911 - $95,000', amount: 95000, stage: 'PROSPECTING' },
    { name: 'Toyota Camry Lease - $36,000/3yr', amount: 12000, stage: 'QUALIFICATION' },
    { name: 'Chevrolet Silverado - $52,000', amount: 52000, stage: 'NEEDS_ANALYSIS' },
    { name: 'Mercedes GLE - $68,000', amount: 68000, stage: 'PROPOSAL' },
    { name: 'Vehicle Service & Maintenance', amount: 5000, stage: 'CLOSED_WON' },
    { name: 'Lexus RX Hybrid - $65,000', amount: 65000, stage: 'NEGOTIATION' },
    { name: 'Jeep Wrangler - $48,000', amount: 48000, stage: 'PROSPECTING' },
    { name: 'Hyundai EV - $42,000', amount: 42000, stage: 'QUALIFICATION' },
  ],
};

const productDataByIndustry = {
  HOME_SERVICES: [
    { name: 'HVAC Unit Installation', category: 'Equipment', unitPrice: 3500 },
    { name: 'Water Heater', category: 'Equipment', unitPrice: 1200 },
    { name: 'Electrical Panel Upgrade', category: 'Service', unitPrice: 2800 },
    { name: 'Plumbing Fixtures', category: 'Equipment', unitPrice: 800 },
    { name: 'Roofing Materials & Install', category: 'Materials & Labor', unitPrice: 5500 },
    { name: 'Window Replacement', category: 'Materials & Labor', unitPrice: 450 },
    { name: 'Solar Panel System', category: 'Equipment', unitPrice: 8000 },
    { name: 'Furnace Repair Service', category: 'Service', unitPrice: 750 },
  ],
  LEGAL_SERVICES: [
    { name: 'Consultation - Hourly', category: 'Service', unitPrice: 250 },
    { name: 'Document Preparation', category: 'Service', unitPrice: 1500 },
    { name: 'Court Representation - Half Day', category: 'Service', unitPrice: 2500 },
    { name: 'Legal Research', category: 'Service', unitPrice: 100 },
    { name: 'Will Creation', category: 'Service', unitPrice: 1200 },
    { name: 'Contract Review', category: 'Service', unitPrice: 800 },
    { name: 'Deposition Preparation', category: 'Service', unitPrice: 3000 },
    { name: 'Trust Establishment', category: 'Service', unitPrice: 2000 },
  ],
  FINANCIAL_SERVICES: [
    { name: 'Term Life Insurance - $500K', category: 'Insurance', unitPrice: 350 },
    { name: 'Whole Life Insurance - $500K', category: 'Insurance', unitPrice: 800 },
    { name: 'Mortgage Origination', category: 'Service', unitPrice: 3000 },
    { name: 'Investment Management Fee', category: 'Service', unitPrice: 5000 },
    { name: 'Auto Insurance - Annual', category: 'Insurance', unitPrice: 1200 },
    { name: 'Home Insurance - Annual', category: 'Insurance', unitPrice: 1500 },
    { name: 'Umbrella Coverage - $1M', category: 'Insurance', unitPrice: 350 },
    { name: 'Financial Planning Session', category: 'Service', unitPrice: 2000 },
  ],
  B2B_SAAS: [
    { name: 'Enterprise License - 500 Users', category: 'Software License', unitPrice: 50000 },
    { name: 'Mid-Market License - 100 Users', category: 'Software License', unitPrice: 15000 },
    { name: 'Startup License - 20 Users', category: 'Software License', unitPrice: 5000 },
    { name: 'Implementation & Training', category: 'Service', unitPrice: 25000 },
    { name: 'Premium Support Package', category: 'Support', unitPrice: 10000 },
    { name: 'Custom Integration Service', category: 'Service', unitPrice: 15000 },
    { name: 'Data Migration Service', category: 'Service', unitPrice: 8000 },
    { name: 'Annual Support & Maintenance', category: 'Support', unitPrice: 5000 },
  ],
  REAL_ESTATE: [
    { name: 'Commission Fee - 3%', category: 'Service', unitPrice: 15000 },
    { name: 'Title Search & Insurance', category: 'Service', unitPrice: 500 },
    { name: 'Home Inspection', category: 'Service', unitPrice: 400 },
    { name: 'Appraisal Valuation', category: 'Service', unitPrice: 500 },
    { name: 'Staging Consultation', category: 'Service', unitPrice: 750 },
    { name: 'Photography & Listing', category: 'Service', unitPrice: 300 },
    { name: 'Closing Coordination', category: 'Service', unitPrice: 600 },
    { name: 'Legal Review - Title Issue', category: 'Service', unitPrice: 1200 },
  ],
  HEALTHCARE: [
    { name: 'Consultation - Initial', category: 'Service', unitPrice: 150 },
    { name: 'Cosmetic Dentistry - Veneers', category: 'Procedure', unitPrice: 1200 },
    { name: 'Root Canal Treatment', category: 'Procedure', unitPrice: 1500 },
    { name: 'Orthodontic Braces', category: 'Equipment & Service', unitPrice: 6000 },
    { name: 'Laser Eye Surgery', category: 'Procedure', unitPrice: 2000 },
    { name: 'Physical Therapy Session', category: 'Service', unitPrice: 100 },
    { name: 'Mental Health Counseling', category: 'Service', unitPrice: 150 },
    { name: 'Skin Treatment Package', category: 'Service', unitPrice: 500 },
  ],
  EDUCATION: [
    { name: 'Full-Time Program Tuition', category: 'Tuition', unitPrice: 50000 },
    { name: 'Part-Time Certificate', category: 'Tuition', unitPrice: 8000 },
    { name: 'Course Materials & Books', category: 'Materials', unitPrice: 500 },
    { name: 'Lab & Facility Access', category: 'Service', unitPrice: 1000 },
    { name: 'Career Services Package', category: 'Service', unitPrice: 2000 },
    { name: 'Mentorship Program', category: 'Service', unitPrice: 1500 },
    { name: 'Job Placement Support', category: 'Service', unitPrice: 3000 },
    { name: 'Alumni Network Access', category: 'Service', unitPrice: 500 },
  ],
  AUTOMOTIVE: [
    { name: 'Vehicle Purchase Price', category: 'Vehicle', unitPrice: 35000 },
    { name: 'Extended Warranty', category: 'Service', unitPrice: 2500 },
    { name: 'Trade-In Allowance', category: 'Service', unitPrice: 18000 },
    { name: 'Financing & Gap Insurance', category: 'Service', unitPrice: 5000 },
    { name: 'Paint Protection', category: 'Service', unitPrice: 800 },
    { name: 'Undercoating Treatment', category: 'Service', unitPrice: 400 },
    { name: 'Interior Fabric Protection', category: 'Service', unitPrice: 500 },
    { name: 'Road Hazard Tire Coverage', category: 'Service', unitPrice: 350 },
  ],
};

const emailTemplates = [
  {
    name: 'Initial Outreach Template',
    subject: 'Quick Question - {{firstName}}',
    body: 'Hi {{firstName}},\n\nI came across your profile and thought we might be able to help with {{opportunity}}.\n\nWould you be open to a quick 15-minute call next week?\n\nBest regards,\n{{senderName}}',
    category: 'Outreach',
  },
  {
    name: 'Follow-up After Meeting',
    subject: 'Great to meet you - {{firstName}}!',
    body: 'Hi {{firstName}},\n\nThanks for taking the time to speak with me today. I really appreciated hearing about {{topic}}.\n\nAs discussed, I\'m sending over {{document}} and would love to reconnect next week.\n\nBest,\n{{senderName}}',
    category: 'Follow-up',
  },
  {
    name: 'Proposal Submission',
    subject: 'Your Customized Proposal - {{companyName}}',
    body: 'Hi {{firstName}},\n\nI\'ve attached your customized proposal based on our discussion. The total investment is {{amount}}.\n\nLet me know if you have any questions and we can schedule a time to review.\n\nBest regards,\n{{senderName}}',
    category: 'Proposal',
  },
  {
    name: 'Objection Handling - Budget',
    subject: 'Let\'s discuss the investment - {{firstName}}',
    body: 'Hi {{firstName}},\n\nI understand budget is a consideration. Let me show you how {{benefit}} can actually save you {{savings}} annually.\n\nWould you be open to exploring a flexible payment plan?\n\nBest,\n{{senderName}}',
    category: 'Objection Handling',
  },
  {
    name: 'Closing Template',
    subject: 'Let\'s move forward - {{firstName}}',
    body: 'Hi {{firstName}},\n\nBased on our discussions, I\'m confident this will solve {{problem}}.\n\nI\'d like to get you started on {{date}}. Can you confirm?\n\nBest regards,\n{{senderName}}',
    category: 'Closing',
  },
  {
    name: 'Check-in Template',
    subject: 'Checking in - {{firstName}}',
    body: 'Hi {{firstName}},\n\nJust wanted to check in and see how {{project}} is going.\n\nHappy to answer any questions or discuss next steps.\n\nBest,\n{{senderName}}',
    category: 'Check-in',
  },
  {
    name: 'Win-Back Template',
    subject: 'We miss you - {{firstName}}',
    body: 'Hi {{firstName}},\n\nIt\'s been a while! We\'ve made some exciting improvements to {{service}}.\n\nI\'d love to catch up and see if there\'s a fit now.\n\nBest regards,\n{{senderName}}',
    category: 'Win-back',
  },
];

const taskSubjects = [
  'Follow up on proposal',
  'Send contract to client',
  'Schedule demo meeting',
  'Prepare presentation',
  'Obtain signatures on agreement',
  'Verify client requirements',
  'Check payment received',
  'Conduct needs assessment',
  'Create implementation plan',
  'Send product samples',
  'Arrange site visit',
  'Prepare case study',
  'Get approval from management',
  'Update CRM notes',
  'Send thank you note',
  'Make follow-up call',
  'Prepare technical specifications',
  'Coordinate with delivery team',
  'Obtain written requirements',
  'Schedule quarterly review',
];

const eventSubjects = [
  'Discovery Call',
  'Product Demo',
  'Initial Consultation',
  'Needs Analysis Meeting',
  'Contract Review',
  'Quarterly Business Review',
  'Sales Presentation',
  'Technical Deep Dive',
  'Executive Briefing',
  'Site Visit',
  'Implementation Kickoff',
  'Training Session',
  'Contract Signing',
];

const eventDescriptions = [
  'Discuss current pain points and challenges',
  'Overview of our solution and key features',
  'Deep dive into technical requirements',
  'Review contract terms and conditions',
  'Quarterly performance and planning meeting',
  'Present to decision makers',
  'Detailed technical architecture review',
  'High-level overview for executives',
  'Tour facility or work location',
  'Kick off implementation project',
  'Staff training on platform',
  'Sign final agreement',
];

export async function GET() {
  try {
    console.log('Starting CRM data seeding...');

    const summary: SeedSummary = {
      clientsProcessed: 0,
      contactsCreated: 0,
      opportunitiesCreated: 0,
      tasksCreated: 0,
      eventsCreated: 0,
      productsCreated: 0,
      emailTemplatesCreated: 0,
      territoriesCreated: 0,
      details: [],
    };

    // Get all clients
    const clients = await prisma.clientCompany.findMany({
      include: {
        users: {
          take: 1,
        },
      },
    });

    if (clients.length === 0) {
      return NextResponse.json({ error: 'No clients found. Create clients first.' }, { status: 400 });
    }

    summary.clientsProcessed = clients.length;

    // Create email templates (global, once) - check if exists first
    for (const template of emailTemplates) {
      const existing = await prisma.emailTemplate.findFirst({
        where: { name: template.name }
      });

      if (!existing) {
        await prisma.emailTemplate.create({
          data: {
            name: template.name,
            subject: template.subject,
            body: template.body,
            category: template.category,
            isActive: true,
          },
        });
        summary.emailTemplatesCreated++;
      }
    }

    // Process each client
    for (const client of clients) {
      const user = client.users[0];
      if (!user) continue;

      const industryKey = client.businessSector as keyof typeof opportunityDataByIndustry;
      const opportunityTemplates = opportunityDataByIndustry[industryKey] || opportunityDataByIndustry.HOME_SERVICES;
      const productTemplates = productDataByIndustry[industryKey] || productDataByIndustry.HOME_SERVICES;

      let clientContacts = 0;
      let clientOpportunities = 0;
      let clientTasks = 0;
      let clientEvents = 0;
      let clientProducts = 0;
      let clientTerritories = 0;

      // Create 3-5 primary contacts per client
      const contactCount = 3 + Math.floor(Math.random() * 3);
      const contacts: any[] = [];

      for (let i = 0; i < contactCount; i++) {
        const contact = await prisma.contact.create({
          data: {
            clientId: client.id,
            ownerId: user.id,
            firstName: ['John', 'Sarah', 'Michael', 'Jennifer', 'David'][i % 5],
            lastName: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][i % 5],
            email: `contact${i}@${client.name.replace(/\s+/g, '')}.com`,
            phone: `555-${String(1000 + i).padStart(4, '0')}`,
            title: ['VP of Sales', 'Director of Operations', 'CEO', 'CFO', 'CTO'][i % 5],
            department: ['Sales', 'Operations', 'Finance', 'IT', 'Executive'][i % 5],
            isPrimary: i === 0,
            notes: `Primary contact for ${client.name}. Key decision maker.`,
          },
        });
        contacts.push(contact);
        clientContacts++;

        // Add sub-contacts (account hierarchy) for primary contact
        if (i === 0) {
          for (let j = 0; j < 2; j++) {
            await prisma.contact.create({
              data: {
                clientId: client.id,
                ownerId: user.id,
                firstName: ['Robert', 'Patricia'][j],
                lastName: ['Anderson', 'Martinez'][j],
                email: `subcontact${j}@${client.name.replace(/\s+/g, '')}.com`,
                phone: `555-${String(2000 + j).padStart(4, '0')}`,
                title: ['Manager', 'Coordinator'][j],
                department: ['Operations', 'Administration'][j],
                isPrimary: false,
                accountId: contact.id,
                notes: 'Team member reporting to primary contact',
              },
            });
            clientContacts++;
          }
        }
      }

      // Create 10-15 opportunities per client
      const opportunityCount = 10 + Math.floor(Math.random() * 6);

      const opportunities: any[] = [];
      for (let i = 0; i < opportunityCount; i++) {
        const template = opportunityTemplates[i % opportunityTemplates.length];
        const contact = contacts[i % contacts.length];

        // Mix of stages with realistic timeline
        let stage = template.stage;
        let expectedCloseDate = null;

        if (stage === 'CLOSED_WON') {
          expectedCloseDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000); // Past 90 days
        } else if (stage === 'CLOSED_LOST') {
          expectedCloseDate = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000); // Past 60 days
        } else if (stage === 'PROSPECTING') {
          expectedCloseDate = new Date(Date.now() + (30 + Math.random() * 60) * 24 * 60 * 60 * 1000); // 30-90 days
        } else if (stage === 'QUALIFICATION' || stage === 'NEEDS_ANALYSIS') {
          expectedCloseDate = new Date(Date.now() + (20 + Math.random() * 40) * 24 * 60 * 60 * 1000); // 20-60 days
        } else {
          expectedCloseDate = new Date(Date.now() + (10 + Math.random() * 30) * 24 * 60 * 60 * 1000); // 10-40 days
        }

        let probability = 10;
        if (stage === 'QUALIFICATION') probability = 25;
        if (stage === 'NEEDS_ANALYSIS') probability = 40;
        if (stage === 'PROPOSAL') probability = 60;
        if (stage === 'NEGOTIATION') probability = 75;
        if (stage === 'CLOSED_WON') probability = 100;
        if (stage === 'CLOSED_LOST') probability = 0;

        const opportunity = await prisma.opportunity.create({
          data: {
            clientId: client.id,
            contactId: contact.id,
            ownerId: user.id,
            name: template.name,
            stage,
            amount: template.amount,
            probability,
            expectedCloseDate,
            closedDate: stage === 'CLOSED_WON' || stage === 'CLOSED_LOST' ? expectedCloseDate : null,
            description: `Opportunity for ${contact.firstName}. Value: $${template.amount.toLocaleString()}`,
            nextSteps: stage !== 'CLOSED_WON' && stage !== 'CLOSED_LOST'
              ? 'Schedule follow-up meeting to discuss next steps'
              : undefined,
          },
        });
        opportunities.push(opportunity);
        clientOpportunities++;
      }

      // Create 5-10 products per client
      const productsToCreate = productTemplates.slice(0, 5 + Math.floor(Math.random() * 6));
      const products: any[] = [];

      for (const productTemplate of productsToCreate) {
        const product = await prisma.product.create({
          data: {
            clientId: client.id,
            name: productTemplate.name,
            category: productTemplate.category,
            unitPrice: productTemplate.unitPrice,
            description: `${productTemplate.name} - Category: ${productTemplate.category}`,
            isActive: true,
          },
        });
        products.push(product);
        clientProducts++;
      }

      // Add line items to some opportunities
      for (let i = 0; i < Math.min(opportunities.length, 5); i++) {
        const opp = opportunities[i];
        const lineItemCount = 1 + Math.floor(Math.random() * 3);

        for (let j = 0; j < lineItemCount; j++) {
          const product = products[j % products.length];
          const quantity = 1 + Math.floor(Math.random() * 3);
          const unitPrice = product.unitPrice;
          const discount = Math.random() > 0.8 ? Math.floor(Math.random() * 10) : 0; // 20% chance of discount

          await prisma.opportunityLineItem.create({
            data: {
              opportunityId: opp.id,
              productId: product.id,
              productName: product.name,
              quantity,
              unitPrice,
              discount,
              totalPrice: quantity * unitPrice * (1 - discount / 100),
              description: `${quantity}x ${product.name}`,
            },
          });
        }
      }

      // Create 15-20 tasks per client
      const taskCount = 15 + Math.floor(Math.random() * 6);
      const taskStatuses: Array<'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DEFERRED' | 'WAITING'> = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DEFERRED', 'WAITING'];
      const taskPriorities: Array<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'> = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

      for (let i = 0; i < taskCount; i++) {
        const status = taskStatuses[Math.floor(Math.random() * taskStatuses.length)];
        const priority = taskPriorities[Math.floor(Math.random() * taskPriorities.length)];
        const contact = contacts[i % contacts.length];
        const opportunity = opportunities[Math.floor(Math.random() * opportunities.length)];

        let dueDate = new Date();
        if (Math.random() > 0.3) {
          // 70% have due dates
          dueDate = new Date(Date.now() + (Math.random() - 0.5) * 90 * 24 * 60 * 60 * 1000); // +/- 45 days
        }

        let completedDate = null;
        if (status === 'COMPLETED') {
          completedDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
        }

        await prisma.task.create({
          data: {
            subject: taskSubjects[i % taskSubjects.length],
            description: `Task for ${contact.firstName} related to ${opportunity.name}`,
            dueDate,
            status,
            priority,
            assignedTo: user.id,
            createdBy: user.id,
            contactId: contact.id,
            opportunityId: opportunity.id,
            completedDate,
            reminderDate: dueDate ? new Date(dueDate.getTime() - 24 * 60 * 60 * 1000) : null,
          },
        });
        clientTasks++;
      }

      // Create 10-15 events per client
      const eventCount = 10 + Math.floor(Math.random() * 6);

      for (let i = 0; i < eventCount; i++) {
        const contact = contacts[i % contacts.length];
        const opportunity = i < opportunities.length ? opportunities[i] : opportunities[0];

        // Mix of past and future events
        const daysOffset = (Math.random() - 0.4) * 60; // Range: -24 to +36 days
        const startTime = new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000);
        startTime.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0);

        const endTime = new Date(startTime);
        endTime.setHours(startTime.getHours() + (1 + Math.floor(Math.random() * 2)));

        await prisma.event.create({
          data: {
            subject: eventSubjects[i % eventSubjects.length],
            description: eventDescriptions[i % eventDescriptions.length],
            startTime,
            endTime,
            location: `Conference Room ${String.fromCharCode(65 + (i % 5))} / Virtual`,
            isAllDay: false,
            ownerId: user.id,
            contactId: contact.id,
            opportunityId: opportunity.id,
          },
        });
        clientEvents++;
      }

      // Create 2-3 territories per client
      const territoryCount = 2 + Math.floor(Math.random() * 2);
      const regions = [
        ['North America', 'US & Canada'],
        ['EMEA', 'Europe, Middle East, Africa'],
        ['APAC', 'Asia Pacific Region'],
        ['Latin America', 'Central & South America'],
        ['Domestic East', 'Eastern United States'],
      ];

      for (let i = 0; i < territoryCount; i++) {
        const regionData = regions[i % regions.length];
        await prisma.territory.create({
          data: {
            clientId: client.id,
            name: `${regionData[0]} Territory`,
            description: regionData[1],
            regions: regionData[1],
            isActive: true,
          },
        });
        clientTerritories++;
      }

      summary.details.push({
        clientName: client.name,
        contacts: clientContacts,
        opportunities: clientOpportunities,
        tasks: clientTasks,
        events: clientEvents,
        products: clientProducts,
        emailTemplates: 0, // Only created once globally
        territories: clientTerritories,
      });

      summary.contactsCreated += clientContacts;
      summary.opportunitiesCreated += clientOpportunities;
      summary.tasksCreated += clientTasks;
      summary.eventsCreated += clientEvents;
      summary.productsCreated += clientProducts;
      summary.territoriesCreated += clientTerritories;

      console.log(`Seeded ${client.name}: ${clientContacts} contacts, ${clientOpportunities} opportunities, ${clientTasks} tasks, ${clientEvents} events, ${clientProducts} products, ${clientTerritories} territories`);
    }

    console.log('CRM data seeding completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'CRM data seeded successfully',
      summary,
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
