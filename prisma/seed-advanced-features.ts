import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
// @ts-ignore
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedAdvancedFeatures() {
  console.log('🌱 Seeding Advanced Salesforce Features...');

  // Get admin user
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!admin) {
    console.error('❌ Admin user not found. Run main seed first.');
    return;
  }

  // Get client companies
  let clients = await prisma.clientCompany.findMany({ take: 8 });
  if (clients.length === 0) {
    console.log('Creating sample client companies...');
    const clientData = [
      { name: 'Acme Corporation', industry: 'Technology', contactName: 'John Smith', contactEmail: 'john@acme.com', contactPhone: '555-0100' },
      { name: 'Global Industries', industry: 'Manufacturing', contactName: 'Sarah Johnson', contactEmail: 'sarah@global-ind.com', contactPhone: '555-0200' },
      { name: 'Tech Solutions Inc', industry: 'Technology', contactName: 'Mike Williams', contactEmail: 'mike@techsolutions.com', contactPhone: '555-0300' },
      { name: 'Healthcare Plus', industry: 'Healthcare', contactName: 'Emily Brown', contactEmail: 'emily@healthcareplus.com', contactPhone: '555-0400' },
      { name: 'Finance First', industry: 'Finance', contactName: 'David Davis', contactEmail: 'david@financefirst.com', contactPhone: '555-0500' },
    ];
    for (const client of clientData) {
      await prisma.clientCompany.create({ data: client });
    }
    clients = await prisma.clientCompany.findMany({ take: 8 });
  }

  // Get products
  let products = await prisma.product.findMany({ take: 10 });

  // ===========================================
  // SERVICE CONTRACTS
  // ===========================================
  console.log('Creating Service Contracts...');

  const existingServiceContracts = await prisma.serviceContract.count();
  if (existingServiceContracts === 0) {
    const serviceContractData = [
      {
        contractNumber: 'SC-2024-001',
        name: 'Premium Support Agreement',
        accountId: clients[0].id,
        status: 'ACTIVE',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        contractType: 'SUPPORT',
        responseTimeHours: 2,
        resolutionTimeHours: 8,
        supportHours: '24/7',
        contractValue: 24000,
        billingFrequency: 'MONTHLY',
        autoRenew: true,
        renewalTermMonths: 12,
        terms: 'Premium 24/7 support with guaranteed response times.',
      },
      {
        contractNumber: 'SC-2024-002',
        name: 'Standard Maintenance Contract',
        accountId: clients[1].id,
        status: 'ACTIVE',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2025-02-28'),
        contractType: 'MAINTENANCE',
        responseTimeHours: 4,
        resolutionTimeHours: 24,
        supportHours: '9-5 M-F',
        contractValue: 12000,
        billingFrequency: 'QUARTERLY',
        autoRenew: false,
        terms: 'Standard maintenance including software updates and patches.',
      },
      {
        contractNumber: 'SC-2024-003',
        name: 'Enterprise SLA Agreement',
        accountId: clients[2].id,
        status: 'ACTIVE',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2025-05-31'),
        contractType: 'SLA',
        responseTimeHours: 1,
        resolutionTimeHours: 4,
        supportHours: '24/7',
        contractValue: 48000,
        billingFrequency: 'ANNUALLY',
        autoRenew: true,
        renewalTermMonths: 12,
        terms: 'Enterprise-grade SLA with dedicated support team.',
      },
      {
        contractNumber: 'SC-2024-004',
        name: 'Product Warranty Extension',
        accountId: clients[3].id,
        status: 'DRAFT',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2026-12-31'),
        contractType: 'WARRANTY',
        responseTimeHours: 8,
        resolutionTimeHours: 72,
        supportHours: '9-5 M-F',
        contractValue: 5000,
        billingFrequency: 'ANNUALLY',
        autoRenew: false,
        terms: 'Extended warranty covering hardware replacement.',
      },
      {
        contractNumber: 'SC-2024-005',
        name: 'Basic Support Plan',
        accountId: clients[4].id,
        status: 'EXPIRED',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        contractType: 'SUPPORT',
        responseTimeHours: 24,
        resolutionTimeHours: 72,
        supportHours: '9-5 M-F',
        contractValue: 3600,
        billingFrequency: 'MONTHLY',
        autoRenew: false,
        terms: 'Basic email support during business hours.',
      },
    ];

    for (const contract of serviceContractData) {
      await prisma.serviceContract.create({ data: contract });
    }
    console.log('✅ Service Contracts created: ' + serviceContractData.length);
  }

  // ===========================================
  // SCHEDULED REPORTS
  // ===========================================
  console.log('Creating Scheduled Reports...');

  const existingScheduledReports = await prisma.scheduledReport.count();
  if (existingScheduledReports === 0) {
    const scheduledReportData = [
      {
        name: 'Weekly Sales Pipeline Report',
        reportType: 'PIPELINE',
        frequency: 'WEEKLY',
        dayOfWeek: 1, // Monday
        time: '09:00',
        timezone: 'America/New_York',
        recipientEmails: ['sales@company.com', 'manager@company.com'],
        format: 'PDF',
        includeCharts: true,
        isActive: true,
        createdById: admin.id,
        nextRunAt: getNextRunDate('WEEKLY', 1, '09:00'),
      },
      {
        name: 'Monthly Revenue Summary',
        reportType: 'SALES',
        frequency: 'MONTHLY',
        dayOfMonth: 1,
        time: '08:00',
        timezone: 'America/New_York',
        recipientEmails: ['finance@company.com', 'ceo@company.com'],
        format: 'EXCEL',
        includeCharts: true,
        isActive: true,
        createdById: admin.id,
        nextRunAt: getNextRunDate('MONTHLY', 1, '08:00'),
      },
      {
        name: 'Daily Activity Dashboard',
        reportType: 'ACTIVITY',
        frequency: 'DAILY',
        time: '18:00',
        timezone: 'America/New_York',
        recipientEmails: ['team@company.com'],
        format: 'PDF',
        includeCharts: false,
        isActive: true,
        createdById: admin.id,
        nextRunAt: getNextRunDate('DAILY', null, '18:00'),
      },
      {
        name: 'Quarterly Forecast Analysis',
        reportType: 'CUSTOM',
        frequency: 'QUARTERLY',
        dayOfMonth: 1,
        time: '10:00',
        timezone: 'America/New_York',
        recipientEmails: ['executives@company.com'],
        format: 'PDF',
        includeCharts: true,
        isActive: true,
        createdById: admin.id,
        filters: { forecastType: 'quarterly', includeComparison: true },
        nextRunAt: getNextRunDate('QUARTERLY', 1, '10:00'),
      },
      {
        name: 'Weekly Lead Conversion Report',
        reportType: 'CUSTOM',
        frequency: 'WEEKLY',
        dayOfWeek: 5, // Friday
        time: '16:00',
        timezone: 'America/New_York',
        recipientEmails: ['marketing@company.com'],
        format: 'CSV',
        includeCharts: false,
        isActive: false,
        createdById: admin.id,
        nextRunAt: null,
      },
    ];

    for (const report of scheduledReportData) {
      await prisma.scheduledReport.create({ data: report });
    }
    console.log('✅ Scheduled Reports created: ' + scheduledReportData.length);
  }

  // ===========================================
  // JOURNEYS (Nurture Flows)
  // ===========================================
  console.log('Creating Journeys...');

  const existingJourneys = await prisma.journey.count();
  if (existingJourneys === 0) {
    const journeyData = [
      {
        name: 'New Lead Welcome Series',
        description: 'Automated welcome email series for new leads',
        status: 'ACTIVE',
        type: 'NURTURE',
        triggerType: 'LEAD_CREATED',
        triggerConditions: { source: ['WEBSITE', 'WEBINAR'] },
        entryLimit: 1000,
        reEntryAllowed: false,
        businessHoursOnly: true,
        goalType: 'CONVERSION',
        totalEntered: 245,
        totalCompleted: 180,
        totalConverted: 42,
        createdById: admin.id,
      },
      {
        name: 'Customer Onboarding',
        description: 'Onboarding journey for new customers',
        status: 'ACTIVE',
        type: 'ONBOARDING',
        triggerType: 'MANUAL',
        entryLimit: 500,
        reEntryAllowed: false,
        businessHoursOnly: false,
        goalType: 'ENGAGEMENT',
        totalEntered: 89,
        totalCompleted: 67,
        totalConverted: 0,
        createdById: admin.id,
      },
      {
        name: 'Re-engagement Campaign',
        description: 'Win back inactive leads',
        status: 'PAUSED',
        type: 'RE_ENGAGEMENT',
        triggerType: 'SEGMENT_ENTRY',
        triggerConditions: { inactiveDays: 90 },
        entryLimit: 2000,
        reEntryAllowed: true,
        businessHoursOnly: true,
        goalType: 'ENGAGEMENT',
        totalEntered: 532,
        totalCompleted: 412,
        totalConverted: 28,
        createdById: admin.id,
      },
      {
        name: 'Upsell Product Journey',
        description: 'Cross-sell and upsell to existing customers',
        status: 'DRAFT',
        type: 'UPSELL',
        triggerType: 'MANUAL',
        entryLimit: 300,
        reEntryAllowed: false,
        businessHoursOnly: true,
        goalType: 'PURCHASE',
        totalEntered: 0,
        totalCompleted: 0,
        totalConverted: 0,
        createdById: admin.id,
      },
    ];

    for (const journey of journeyData) {
      const createdJourney = await prisma.journey.create({ data: journey });

      // Create journey steps
      const steps = [
        { journeyId: createdJourney.id, stepOrder: 1, name: 'Welcome Email', type: 'EMAIL', emailSubject: 'Welcome to our platform!', emailBody: 'Thank you for your interest...' },
        { journeyId: createdJourney.id, stepOrder: 2, name: 'Wait 2 Days', type: 'WAIT', waitDays: 2 },
        { journeyId: createdJourney.id, stepOrder: 3, name: 'Check Engagement', type: 'CONDITION', conditions: { emailOpened: true } },
        { journeyId: createdJourney.id, stepOrder: 4, name: 'Follow-up Email', type: 'EMAIL', emailSubject: 'Still interested?', emailBody: 'We noticed you...' },
        { journeyId: createdJourney.id, stepOrder: 5, name: 'Create Task', type: 'ACTION', actionType: 'CREATE_TASK', actionConfig: { taskType: 'CALL', priority: 'HIGH' } },
      ];

      for (const step of steps) {
        await prisma.journeyStep.create({ data: step });
      }
    }
    console.log('✅ Journeys created: ' + journeyData.length);
  }

  // ===========================================
  // SURVEYS
  // ===========================================
  console.log('Creating Surveys...');

  const existingSurveys = await prisma.survey.count();
  if (existingSurveys === 0) {
    const surveyData = [
      {
        name: 'Customer Satisfaction Survey',
        description: 'Measure customer satisfaction after support interactions',
        status: 'ACTIVE',
        type: 'SATISFACTION',
        isAnonymous: false,
        allowMultiple: false,
        showProgressBar: true,
        thankYouMessage: 'Thank you for your feedback!',
        totalResponses: 156,
        avgCompletionTime: 180,
        createdById: admin.id,
      },
      {
        name: 'Net Promoter Score Survey',
        description: 'Monthly NPS measurement',
        status: 'ACTIVE',
        type: 'NPS',
        isAnonymous: true,
        allowMultiple: false,
        showProgressBar: false,
        thankYouMessage: 'We appreciate your time!',
        totalResponses: 423,
        avgCompletionTime: 60,
        createdById: admin.id,
      },
      {
        name: 'Product Feature Feedback',
        description: 'Gather feedback on new feature ideas',
        status: 'ACTIVE',
        type: 'FEEDBACK',
        isAnonymous: false,
        allowMultiple: true,
        showProgressBar: true,
        randomizeQuestions: true,
        thankYouMessage: 'Your feedback helps us improve!',
        totalResponses: 89,
        avgCompletionTime: 300,
        createdById: admin.id,
      },
      {
        name: 'Event Feedback Survey',
        description: 'Post-event satisfaction survey',
        status: 'DRAFT',
        type: 'CUSTOM',
        isAnonymous: false,
        allowMultiple: false,
        showProgressBar: true,
        totalResponses: 0,
        createdById: admin.id,
      },
    ];

    for (const survey of surveyData) {
      const createdSurvey = await prisma.survey.create({ data: survey });

      // Create survey questions
      const questions = survey.type === 'NPS' ? [
        { surveyId: createdSurvey.id, questionOrder: 1, questionText: 'How likely are you to recommend us to a friend or colleague?', questionType: 'NPS', isRequired: true, minValue: 0, maxValue: 10 },
        { surveyId: createdSurvey.id, questionOrder: 2, questionText: 'What is the primary reason for your score?', questionType: 'TEXTAREA', isRequired: false },
      ] : [
        { surveyId: createdSurvey.id, questionOrder: 1, questionText: 'How would you rate your overall experience?', questionType: 'RATING', isRequired: true, minValue: 1, maxValue: 5 },
        { surveyId: createdSurvey.id, questionOrder: 2, questionText: 'What did you like most about our service?', questionType: 'SINGLE_CHOICE', options: ['Speed', 'Quality', 'Communication', 'Price', 'Other'], isRequired: true },
        { surveyId: createdSurvey.id, questionOrder: 3, questionText: 'Any additional comments?', questionType: 'TEXTAREA', isRequired: false },
      ];

      for (const question of questions) {
        await prisma.surveyQuestion.create({ data: question });
      }
    }
    console.log('✅ Surveys created: ' + surveyData.length);
  }

  // ===========================================
  // MARKETING EVENTS
  // ===========================================
  console.log('Creating Marketing Events...');

  const existingEvents = await prisma.marketingEvent.count();
  if (existingEvents === 0) {
    const eventData = [
      {
        name: 'Annual Customer Conference 2024',
        description: 'Our flagship annual conference bringing together customers, partners, and industry experts.',
        type: 'CONFERENCE',
        status: 'PUBLISHED',
        startDateTime: new Date('2024-09-15T09:00:00'),
        endDateTime: new Date('2024-09-17T17:00:00'),
        timezone: 'America/New_York',
        locationType: 'IN_PERSON',
        venue: 'Convention Center',
        address: '123 Main Street',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        maxAttendees: 500,
        currentAttendees: 342,
        waitlistEnabled: true,
        registrationRequired: true,
        registrationDeadline: new Date('2024-09-01'),
        registrationFee: 299.00,
        agenda: 'Day 1: Keynotes\nDay 2: Workshops\nDay 3: Networking',
        speakers: [{ name: 'John CEO', title: 'CEO', bio: 'Industry veteran...' }],
        createdById: admin.id,
      },
      {
        name: 'Product Demo Webinar',
        description: 'Live demonstration of our latest product features.',
        type: 'WEBINAR',
        status: 'PUBLISHED',
        startDateTime: new Date('2024-08-20T14:00:00'),
        endDateTime: new Date('2024-08-20T15:00:00'),
        timezone: 'America/New_York',
        locationType: 'ONLINE',
        virtualUrl: 'https://zoom.us/j/123456789',
        virtualPlatform: 'ZOOM',
        maxAttendees: 1000,
        currentAttendees: 456,
        waitlistEnabled: false,
        registrationRequired: true,
        createdById: admin.id,
      },
      {
        name: 'Sales Training Workshop',
        description: 'Hands-on workshop for sales team best practices.',
        type: 'WORKSHOP',
        status: 'DRAFT',
        startDateTime: new Date('2024-10-05T10:00:00'),
        endDateTime: new Date('2024-10-05T16:00:00'),
        timezone: 'America/New_York',
        locationType: 'HYBRID',
        venue: 'Training Center',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        virtualUrl: 'https://teams.microsoft.com/meet/123',
        virtualPlatform: 'TEAMS',
        maxAttendees: 50,
        currentAttendees: 0,
        registrationRequired: true,
        createdById: admin.id,
      },
      {
        name: 'Tech Meetup',
        description: 'Monthly tech community meetup.',
        type: 'MEETUP',
        status: 'COMPLETED',
        startDateTime: new Date('2024-07-10T18:00:00'),
        endDateTime: new Date('2024-07-10T21:00:00'),
        timezone: 'America/New_York',
        locationType: 'IN_PERSON',
        venue: 'Local Brewery',
        city: 'Austin',
        state: 'TX',
        country: 'USA',
        maxAttendees: 100,
        currentAttendees: 78,
        registrationRequired: false,
        createdById: admin.id,
      },
      {
        name: 'Industry Trade Show 2024',
        description: 'Exhibiting at the leading industry trade show.',
        type: 'TRADE_SHOW',
        status: 'PUBLISHED',
        startDateTime: new Date('2024-11-12T08:00:00'),
        endDateTime: new Date('2024-11-14T18:00:00'),
        timezone: 'America/Los_Angeles',
        locationType: 'IN_PERSON',
        venue: 'Las Vegas Convention Center',
        city: 'Las Vegas',
        state: 'NV',
        country: 'USA',
        registrationRequired: true,
        registrationFee: 50.00,
        createdById: admin.id,
      },
    ];

    for (const event of eventData) {
      const createdEvent = await prisma.marketingEvent.create({ data: event });

      // Create sample registrations
      if (event.currentAttendees && event.currentAttendees > 0) {
        const registrations = Array.from({ length: Math.min(event.currentAttendees ?? 0, 10) }, (_, i) => ({
          eventId: createdEvent.id,
          firstName: `Attendee${i + 1}`,
          lastName: 'Smith',
          email: `attendee${i + 1}@example.com`,
          company: 'Sample Company',
          status: i % 3 === 0 ? 'CONFIRMED' : 'REGISTERED',
          registeredAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        }));

        for (const reg of registrations) {
          await prisma.marketingEventRegistration.create({ data: reg });
        }
      }
    }
    console.log('✅ Marketing Events created: ' + eventData.length);
  }

  // ===========================================
  // CPQ - PRODUCT BUNDLES & RULES
  // ===========================================
  console.log('Creating CPQ Data...');

  const existingBundles = await prisma.productBundle.count();
  if (existingBundles === 0 && products.length > 0) {
    const bundleData = [
      {
        name: 'Enterprise Starter Bundle',
        description: 'Complete enterprise starter package with CRM, support, and training.',
        bundleType: 'STATIC',
        isActive: true,
        basePrice: 4999.99,
        discountPercent: 15,
      },
      {
        name: 'Professional Bundle',
        description: 'Professional package for growing teams.',
        bundleType: 'STATIC',
        isActive: true,
        basePrice: 2499.99,
        discountPercent: 10,
      },
      {
        name: 'Custom Solution Bundle',
        description: 'Configurable bundle - select your components.',
        bundleType: 'CONFIGURABLE',
        isActive: true,
        basePrice: null,
        discountPercent: 5,
      },
    ];

    for (const bundle of bundleData) {
      const createdBundle = await prisma.productBundle.create({ data: bundle });

      // Add bundle items
      const items = products.slice(0, 3).map((product, i) => ({
        bundleId: createdBundle.id,
        productId: product.id,
        quantity: 1,
        isRequired: i === 0,
        isDefault: true,
        sortOrder: i,
      }));

      for (const item of items) {
        await prisma.productBundleItem.create({ data: item });
      }
    }
    console.log('✅ Product Bundles created: ' + bundleData.length);

    // Create product rules
    const ruleData = [
      {
        name: 'Volume Discount Rule',
        description: 'Apply 10% discount for orders over $10,000',
        ruleType: 'PRICING',
        isActive: true,
        conditions: { orderTotal: { $gte: 10000 } },
        actions: { applyDiscount: 10 },
        discountType: 'PERCENTAGE',
        discountValue: 10,
        priority: 1,
      },
      {
        name: 'Enterprise Bundle Validation',
        description: 'Enterprise license requires support package',
        ruleType: 'VALIDATION',
        isActive: true,
        conditions: { hasProduct: 'CRM-ENT-001' },
        actions: { requireProduct: 'SUP-GLD-001' },
        priority: 2,
      },
    ];

    for (const rule of ruleData) {
      await prisma.productRule.create({ data: rule });
    }
    console.log('✅ Product Rules created: ' + ruleData.length);

    // Create guided selling questions
    const questionData = [
      {
        questionText: 'What is the size of your team?',
        questionType: 'SINGLE_CHOICE',
        options: ['1-10', '11-50', '51-200', '200+'],
        helpText: 'This helps us recommend the right license tier.',
        questionOrder: 1,
        isRequired: true,
        isActive: true,
        filterConditions: { '1-10': ['CRM-BAS-001'], '11-50': ['CRM-PRO-001'], '51-200': ['CRM-ENT-001'], '200+': ['CRM-ENT-001'] },
      },
      {
        questionText: 'Do you need 24/7 support?',
        questionType: 'SINGLE_CHOICE',
        options: ['Yes', 'No'],
        questionOrder: 2,
        isRequired: true,
        isActive: true,
        filterConditions: { 'Yes': ['SUP-GLD-001'], 'No': ['SUP-SLV-001'] },
      },
      {
        questionText: 'What is your primary use case?',
        questionType: 'MULTIPLE_CHOICE',
        options: ['Sales', 'Marketing', 'Customer Service', 'All of the above'],
        questionOrder: 3,
        isRequired: false,
        isActive: true,
      },
    ];

    for (const question of questionData) {
      await prisma.guidedSellingQuestion.create({ data: question });
    }
    console.log('✅ Guided Selling Questions created: ' + questionData.length);
  }

  // ===========================================
  // EMAIL & CALENDAR SYNC ACCOUNTS
  // ===========================================
  console.log('Creating Sync Account examples...');

  const existingSyncAccounts = await prisma.emailSyncAccount.count();
  if (existingSyncAccounts === 0) {
    // Email sync accounts
    await prisma.emailSyncAccount.create({
      data: {
        userId: admin.id,
        provider: 'GMAIL',
        email: 'sales@company.com',
        syncEnabled: true,
        syncDirection: 'BOTH',
        syncFolders: ['INBOX', 'SENT'],
        syncStatus: 'OK',
        lastSyncAt: new Date(),
      },
    });

    await prisma.emailSyncAccount.create({
      data: {
        userId: admin.id,
        provider: 'OUTLOOK',
        email: 'support@company.com',
        syncEnabled: true,
        syncDirection: 'INBOUND',
        syncFolders: ['INBOX'],
        syncStatus: 'OK',
        lastSyncAt: new Date(),
      },
    });

    console.log('✅ Email Sync Accounts created: 2');

    // Calendar sync accounts
    await prisma.calendarSyncAccount.create({
      data: {
        userId: admin.id,
        provider: 'GOOGLE',
        email: 'admin@company.com',
        calendarName: 'Work Calendar',
        syncEnabled: true,
        syncDirection: 'BOTH',
        defaultReminder: 15,
        syncStatus: 'OK',
        lastSyncAt: new Date(),
      },
    });

    console.log('✅ Calendar Sync Accounts created: 1');
  }

  console.log('✅ All Advanced Features seeded successfully!');
  await prisma.$disconnect();
}

function getNextRunDate(frequency: string, day: number | null, time: string): Date {
  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);

  if (frequency === 'DAILY') {
    if (next <= now) next.setDate(next.getDate() + 1);
  } else if (frequency === 'WEEKLY' && day !== null) {
    next.setDate(next.getDate() + ((day - next.getDay() + 7) % 7 || 7));
  } else if (frequency === 'MONTHLY' && day !== null) {
    next.setDate(day);
    if (next <= now) next.setMonth(next.getMonth() + 1);
  } else if (frequency === 'QUARTERLY' && day !== null) {
    next.setDate(day);
    const currentQuarter = Math.floor(next.getMonth() / 3);
    next.setMonth((currentQuarter + 1) * 3);
  }

  return next;
}

seedAdvancedFeatures().catch(console.error);
