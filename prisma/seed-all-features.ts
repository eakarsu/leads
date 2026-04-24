import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function seedAllFeatures() {
  console.log('🌱 Seeding all features data...');

  const password = await bcrypt.hash('password123', 10);

  // Get existing admin user
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    console.log('⚠️ No admin user found. Run base seed first.');
    return;
  }

  // Get existing clients
  const existingClients = await prisma.clientCompany.findMany({ include: { users: true } });
  const clientIds = existingClients.map((c) => c.id);
  const userIds = existingClients.flatMap((c) => c.users.map((u) => u.id));
  userIds.push(admin.id);

  // ============ PASSWORD RESET TOKENS ============
  console.log('  Creating PasswordResetTokens...');
  for (let i = 0; i < 15; i++) {
    const userId = userIds[i % userIds.length];
    const isExpired = i < 5;
    const isUsed = i >= 5 && i < 10;
    await prisma.passwordResetToken.create({
      data: {
        token: crypto.randomBytes(32).toString('hex'),
        userId,
        expiresAt: isExpired
          ? new Date(Date.now() - 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 60 * 60 * 1000),
        usedAt: isUsed ? new Date() : null,
      },
    });
  }

  // ============ EMAIL VERIFICATION TOKENS ============
  console.log('  Creating EmailVerificationTokens...');
  for (let i = 0; i < 15; i++) {
    const userId = userIds[i % userIds.length];
    const isUsed = i < 8;
    await prisma.emailVerificationToken.create({
      data: {
        token: crypto.randomBytes(32).toString('hex'),
        userId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        usedAt: isUsed ? new Date() : null,
      },
    });
  }

  // ============ LEADS (30+) ============
  console.log('  Creating Leads...');
  const leadNames = [
    'Alice Monroe', 'Bob Peterson', 'Clara Diaz', 'Derek Chang', 'Elena Volkov',
    'Frank Morales', 'Grace Huang', 'Henry Foster', 'Irene Patel', 'Jack Murphy',
    'Karen Lopez', 'Liam O\'Brien', 'Maya Santos', 'Nolan Green', 'Olivia Reed',
    'Patrick Silva', 'Quinn Taylor', 'Rachel Kim', 'Samuel Cruz', 'Tina Martinez',
    'Ulrich Weber', 'Vera Nowak', 'William Chen', 'Xena Howard', 'Yusuf Ali',
    'Zara Bennett', 'Andre Williams', 'Brenda Clark', 'Carlos Ruiz', 'Diana Park',
    'Eric Nelson', 'Fiona Walsh',
  ];
  const statuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'WON', 'LOST'] as const;
  const sources = ['AGENCY', 'CLIENT_SUBMITTED', 'IMPORTED', 'API', 'MANUAL'] as const;

  for (let i = 0; i < leadNames.length; i++) {
    const clientId = clientIds[i % clientIds.length];
    await prisma.lead.create({
      data: {
        fullName: leadNames[i],
        company: `Company ${i + 1} LLC`,
        title: ['CEO', 'CTO', 'Manager', 'Director', 'VP Sales'][i % 5],
        email: `${leadNames[i].toLowerCase().replace(/[^a-z]/g, '.')}@example.com`,
        phone: `555-${String(1000 + i).padStart(4, '0')}`,
        status: statuses[i % statuses.length],
        leadSource: sources[i % sources.length],
        qualificationScore: Math.floor(Math.random() * 100),
        clientId,
        submittedBy: admin.id,
        notes: `Lead ${i + 1} - generated for demo purposes`,
        customFields: {},
      },
    });
  }

  // ============ CONTACTS (20+) ============
  console.log('  Creating Contacts...');
  const contactFirstNames = ['James', 'Maria', 'Robert', 'Jennifer', 'Michael', 'Sarah', 'David', 'Lisa', 'Thomas', 'Amanda',
    'Chris', 'Emily', 'Daniel', 'Ashley', 'Matthew', 'Nicole', 'Andrew', 'Jessica', 'Joseph', 'Stephanie'];
  const contactLastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White'];

  for (let i = 0; i < 20; i++) {
    const clientId = clientIds[i % clientIds.length];
    await prisma.contact.create({
      data: {
        firstName: contactFirstNames[i],
        lastName: contactLastNames[i],
        email: `${contactFirstNames[i].toLowerCase()}.${contactLastNames[i].toLowerCase()}@business.com`,
        phone: `555-${String(2000 + i).padStart(4, '0')}`,
        department: `${contactLastNames[i]} Department`,
        title: ['Account Manager', 'Sales Rep', 'VP', 'Director', 'CFO'][i % 5],
        clientId,
        ownerId: admin.id,
      },
    });
  }

  // ============ OPPORTUNITIES (20+) ============
  console.log('  Creating Opportunities...');
  const stages = ['PROSPECTING', 'QUALIFICATION', 'NEEDS_ANALYSIS', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'] as const;
  const oppNames = [
    'Enterprise License Deal', 'Cloud Migration Project', 'Security Upgrade Package', 'Data Analytics Suite',
    'Marketing Automation', 'CRM Implementation', 'Website Redesign', 'Mobile App Development',
    'IT Infrastructure', 'Consulting Services', 'Training Package', 'Support Contract',
    'Annual Renewal', 'Expansion Deal', 'New Territory Launch', 'Premium Upgrade',
    'Partner Integration', 'Custom Development', 'Managed Services', 'Digital Transformation',
    'AI Implementation', 'Process Automation',
  ];

  for (let i = 0; i < oppNames.length; i++) {
    const clientId = clientIds[i % clientIds.length];
    await prisma.opportunity.create({
      data: {
        name: `${oppNames[i]} - ${existingClients[i % existingClients.length]?.name || 'Client'}`,
        amount: Math.floor(Math.random() * 100000) + 5000,
        stage: stages[i % stages.length],
        closedDate: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000),
        probability: [10, 25, 50, 75, 90, 100, 0][i % 7],
        clientId,
        ownerId: admin.id,
        description: `Opportunity ${i + 1} for ${oppNames[i]}`,
      },
    });
  }

  // ============ TASKS (20+) ============
  console.log('  Creating Tasks...');
  const taskStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DEFERRED', 'WAITING'] as const;
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
  const taskTitles = [
    'Follow up with prospect', 'Send proposal', 'Schedule demo', 'Review contract',
    'Update CRM records', 'Prepare presentation', 'Call client', 'Send invoice',
    'Onboard new customer', 'Conduct training', 'Review analytics', 'Update pricing',
    'Create report', 'Set up meeting', 'Write blog post', 'Update documentation',
    'Fix billing issue', 'Escalate support ticket', 'Renew subscription', 'Process refund',
    'Plan marketing campaign', 'Audit security settings',
  ];

  for (let i = 0; i < taskTitles.length; i++) {
    const clientId = clientIds[i % clientIds.length];
    await prisma.task.create({
      data: {
        subject: taskTitles[i],
        description: `Task description for: ${taskTitles[i]}`,
        status: taskStatuses[i % taskStatuses.length],
        priority: priorities[i % priorities.length],
        dueDate: new Date(Date.now() + (i - 5) * 24 * 60 * 60 * 1000),
        assignedTo: userIds[i % userIds.length],
        createdBy: admin.id,
      },
    });
  }

  // ============ PRODUCTS (15+) ============
  console.log('  Creating Products...');
  const productNames = [
    'Basic CRM License', 'Professional CRM License', 'Enterprise CRM License', 'Analytics Add-on',
    'Marketing Automation Module', 'Sales Intelligence', 'Customer Portal', 'Partner Portal',
    'API Access Pack', 'Custom Development Hours', 'Training Package', 'Premium Support',
    'Data Storage (100GB)', 'Mobile App License', 'Integration Connector', 'AI Insights Module',
  ];

  for (let i = 0; i < productNames.length; i++) {
    const clientId = clientIds[i % clientIds.length];
    await prisma.product.create({
      data: {
        name: productNames[i],
        description: `${productNames[i]} - Full description`,
        unitPrice: [29, 79, 199, 49, 99, 149, 39, 59, 199, 150, 500, 299, 9, 19, 49, 249][i],
        category: ['License', 'License', 'License', 'Add-on', 'Module', 'Module', 'Portal', 'Portal',
          'API', 'Service', 'Service', 'Support', 'Storage', 'Mobile', 'Integration', 'AI'][i],
        clientId,
      },
    });
  }

  // ============ CASES (15+) ============
  console.log('  Creating Cases...');
  const caseSubjects = [
    'Login not working', 'Data export failed', 'Slow performance', 'Billing discrepancy',
    'Feature request: dark mode', 'Integration sync issue', 'Report not loading', 'Email delivery failed',
    'Permission error', 'Mobile app crash', 'API rate limit exceeded', 'Custom field missing',
    'Calendar sync broken', 'Notification spam', 'Dashboard blank page', 'Import CSV error',
  ];
  const caseStatuses = ['NEW', 'OPEN', 'ESCALATED', 'CLOSED'] as const;
  const casePriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

  for (let i = 0; i < caseSubjects.length; i++) {
    const accountId = clientIds[i % clientIds.length];
    await prisma.case.create({
      data: {
        subject: caseSubjects[i],
        description: `Detailed description for case: ${caseSubjects[i]}`,
        status: caseStatuses[i % caseStatuses.length],
        priority: casePriorities[i % casePriorities.length],
        accountId,
        ownerId: admin.id,
      },
    });
  }

  // ============ CONTRACTS (15+) ============
  console.log('  Creating Contracts...');
  for (let i = 0; i < 15; i++) {
    const accountId = clientIds[i % clientIds.length];
    const clientName = existingClients[i % existingClients.length]?.name || 'Client';
    await prisma.contract.create({
      data: {
        name: `${clientName} - ${['Annual', 'Bi-Annual', 'Monthly', 'Quarterly'][i % 4]} Contract ${i + 1}`,
        status: (['DRAFT', 'ACTIVATED', 'ACTIVATED', 'EXPIRED', 'TERMINATED'] as const)[i % 5],
        totalValue: Math.floor(Math.random() * 50000) + 5000,
        startDate: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + (12 - i) * 30 * 24 * 60 * 60 * 1000),
        contractTerm: [12, 24, 1, 3][i % 4],
        accountId,
        ownerId: admin.id,
      },
    });
  }

  // ============ QUOTES (15+) ============
  console.log('  Creating Quotes...');
  for (let i = 0; i < 15; i++) {
    const accountId = clientIds[i % clientIds.length];
    const clientName = existingClients[i % existingClients.length]?.name || 'Client';
    await prisma.quote.create({
      data: {
        name: `Quote for ${clientName} - #${1000 + i}`,
        grandTotal: Math.floor(Math.random() * 30000) + 2000,
        status: (['DRAFT', 'PRESENTED', 'ACCEPTED', 'REJECTED', 'DENIED'] as const)[i % 5],
        expirationDate: new Date(Date.now() + (30 - i * 2) * 24 * 60 * 60 * 1000),
        accountId,
        ownerId: admin.id,
      },
    });
  }

  // ============ ORDERS (15+) ============
  console.log('  Creating Orders...');
  for (let i = 0; i < 15; i++) {
    const accountId = clientIds[i % clientIds.length];
    await prisma.order.create({
      data: {
        orderNumber: `ORD-${String(10000 + i)}`,
        totalAmount: Math.floor(Math.random() * 20000) + 1000,
        status: (['DRAFT', 'ACTIVATED', 'FULFILLED', 'FULFILLED', 'CANCELLED'] as const)[i % 5],
        accountId,
        ownerId: admin.id,
      },
    });
  }

  // ============ INVOICES (15+) ============
  console.log('  Creating Invoices...');
  for (let i = 0; i < 15; i++) {
    const accountId = clientIds[i % clientIds.length];
    await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${String(20000 + i)}`,
        totalAmount: Math.floor(Math.random() * 15000) + 500,
        status: (['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'] as const)[i % 5],
        dueDate: new Date(Date.now() + (30 - i * 3) * 24 * 60 * 60 * 1000),
        accountId,
        ownerId: admin.id,
      },
    });
  }

  // ============ EVENTS (15+) ============
  console.log('  Creating Events...');
  const eventTitles = [
    'Sales Team Meeting', 'Client Demo', 'Strategy Review', 'Product Launch Prep',
    'Quarterly Business Review', 'Team Standup', 'Client Onboarding', 'Training Session',
    'Board Meeting', 'Webinar: CRM Best Practices', 'Customer Success Check-in', 'Sprint Planning',
    'All Hands Meeting', 'Partner Workshop', 'Sales Kickoff', 'Year-End Review',
  ];

  for (let i = 0; i < eventTitles.length; i++) {
    const startTime = new Date(Date.now() + (i - 5) * 24 * 60 * 60 * 1000);
    startTime.setHours(9 + (i % 8), 0, 0, 0);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    await prisma.event.create({
      data: {
        subject: eventTitles[i],
        description: `Calendar event: ${eventTitles[i]}`,
        startTime,
        endTime,
        isAllDay: i % 5 === 0,
        ownerId: admin.id,
      },
    });
  }

  // ============ EMAIL TEMPLATES (15+) ============
  console.log('  Creating EmailTemplates...');
  const templateNames = [
    'Welcome Email', 'Follow-up Reminder', 'Demo Invitation', 'Proposal Attached',
    'Thank You Note', 'Meeting Confirmation', 'Invoice Reminder', 'Holiday Greeting',
    'Product Update', 'Referral Request', 'Case Resolution', 'Survey Request',
    'Renewal Reminder', 'Win-back Campaign', 'Event Invitation', 'Newsletter Template',
  ];

  for (let i = 0; i < templateNames.length; i++) {
    await prisma.emailTemplate.create({
      data: {
        name: templateNames[i],
        subject: `[LeadGenFlow] ${templateNames[i]}`,
        body: `<h1>${templateNames[i]}</h1><p>Hi {{name}},</p><p>This is the ${templateNames[i].toLowerCase()} template. Customize as needed.</p><p>Best regards,<br>The LeadGenFlow Team</p>`,
        category: ['Onboarding', 'Sales', 'Marketing', 'Support', 'Admin'][i % 5],
      },
    });
  }

  // ============ KNOWLEDGE ARTICLES (15+) ============
  console.log('  Creating KnowledgeArticles...');
  const articleTitles = [
    'Getting Started with LeadGenFlow', 'How to Create Your First Campaign', 'Lead Scoring Explained',
    'Setting Up Email Templates', 'Understanding the Pipeline View', 'Managing Client Accounts',
    'Working with Reports', 'Using AI-Powered Insights', 'Data Import Guide', 'Custom Fields Setup',
    'Role-Based Permissions', 'API Integration Guide', 'Mobile App Guide', 'Troubleshooting Common Issues',
    'Best Practices for Lead Generation', 'Advanced Analytics Tutorial',
  ];

  for (let i = 0; i < articleTitles.length; i++) {
    await prisma.knowledgeArticle.create({
      data: {
        title: articleTitles[i],
        content: `# ${articleTitles[i]}\n\nThis is a comprehensive guide about ${articleTitles[i].toLowerCase()}.\n\n## Overview\n\nDetailed information and step-by-step instructions.\n\n## Steps\n\n1. First step\n2. Second step\n3. Third step\n\n## Conclusion\n\nFor more help, contact support.`,
        status: i < 12 ? 'PUBLISHED' : 'DRAFT',
        authorId: admin.id,
      },
    });
  }

  // ============ NOTIFICATIONS ============
  console.log('  Creating Notifications...');
  const notifTitles = [
    'New lead assigned to you', 'Deal closed won!', 'Task overdue reminder', 'New case created',
    'Quote accepted', 'Contract expiring soon', 'Invoice payment received', 'Campaign performance alert',
    'System maintenance scheduled', 'New team member joined', 'Report ready for review', 'Meeting in 1 hour',
    'Lead score updated', 'Workflow triggered', 'Email delivered successfully',
  ];

  for (let i = 0; i < notifTitles.length; i++) {
    await prisma.notification.create({
      data: {
        title: notifTitles[i],
        message: `Notification: ${notifTitles[i]}. Click to view details.`,
        type: (['LEAD_ASSIGNED', 'OPPORTUNITY_WON', 'TASK_ASSIGNED', 'SYSTEM', 'SYSTEM', 'SYSTEM', 'SYSTEM', 'WORKFLOW_TRIGGERED', 'SYSTEM', 'SYSTEM', 'SYSTEM', 'SYSTEM', 'SYSTEM', 'WORKFLOW_TRIGGERED', 'SYSTEM'] as const)[i % 15],
        isRead: i < 8,
        userId: userIds[i % userIds.length],
      },
    });
  }

  // ============ ACTIVITIES (LeadActivity) (15+) ============
  console.log('  Creating Activities...');
  const existingLeads = await prisma.lead.findMany({ take: 15 });
  const activityTypes = ['EMAIL', 'CALL', 'LINKEDIN', 'MEETING', 'NOTE'] as const;
  const activityContents = [
    'Sent initial outreach email to prospect',
    'Cold call - left voicemail, will follow up',
    'Connected on LinkedIn, sent intro message',
    'Had discovery meeting, identified key pain points',
    'Added note: prospect interested in Enterprise plan',
    'Follow-up email sent with proposal attached',
    'Call completed - discussed pricing and timeline',
    'LinkedIn message: shared case study content',
    'Meeting: demo of product features completed',
    'Note: Decision maker identified as VP of Sales',
    'Email: sent contract for review',
    'Call: addressed concerns about implementation',
    'LinkedIn: prospect engaged with our content',
    'Meeting: final negotiation on terms',
    'Note: deal expected to close this quarter',
  ];
  for (let i = 0; i < 15; i++) {
    const lead = existingLeads[i % existingLeads.length];
    if (!lead) continue;
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: activityTypes[i % activityTypes.length],
        content: activityContents[i],
        userId: admin.id,
        timestamp: new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // ============ REPORTS (15+) ============
  console.log('  Creating Reports...');
  const reportNames = [
    'Monthly Sales Summary', 'Pipeline by Stage', 'Lead Source Analysis', 'Win/Loss Report',
    'Activity Metrics', 'Revenue by Product', 'Quarterly Forecast', 'Team Performance',
    'Campaign ROI Analysis', 'Customer Acquisition', 'Churn Analysis Report', 'Territory Performance',
    'Deal Velocity Report', 'Opportunity Aging', 'Lead Conversion Rates',
  ];
  const reportObjects = ['Lead', 'Opportunity', 'Contact', 'Case', 'Task'];
  const reportFormats = ['TABULAR', 'SUMMARY', 'MATRIX'] as const;
  for (let i = 0; i < reportNames.length; i++) {
    await prisma.report.create({
      data: {
        name: reportNames[i],
        description: `Automated report: ${reportNames[i]}`,
        objectType: reportObjects[i % reportObjects.length],
        format: reportFormats[i % reportFormats.length],
        columns: JSON.parse(JSON.stringify(['name', 'status', 'createdAt', 'amount'])),
        groupBy: i % 3 === 0 ? ['status'] : [],
        ownerId: admin.id,
        isPublic: i < 10,
        lastRunAt: i < 8 ? new Date(Date.now() - i * 24 * 60 * 60 * 1000) : null,
      },
    });
  }

  // ============ SCHEDULED REPORTS (15+) ============
  console.log('  Creating ScheduledReports...');
  const schedReportNames = [
    'Daily Sales Digest', 'Weekly Pipeline Review', 'Monthly Revenue Report', 'Quarterly Business Review',
    'Daily New Leads', 'Weekly Activity Summary', 'Monthly Churn Report', 'Weekly Case Metrics',
    'Daily Task Summary', 'Monthly Forecast Update', 'Weekly Campaign Performance', 'Daily Email Analytics',
    'Monthly Team KPIs', 'Weekly Opportunity Update', 'Quarterly Customer Health',
  ];
  const frequencies = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY'] as const;
  const formats = ['PDF', 'EXCEL', 'CSV'] as const;
  for (let i = 0; i < schedReportNames.length; i++) {
    await prisma.scheduledReport.create({
      data: {
        name: schedReportNames[i],
        reportType: ['SALES', 'PIPELINE', 'ACTIVITY', 'CUSTOM'][i % 4],
        frequency: frequencies[i % frequencies.length],
        dayOfWeek: i % 7,
        time: `${String(8 + (i % 4)).padStart(2, '0')}:00`,
        recipientEmails: [`user${i}@example.com`],
        recipientUserIds: [],
        format: formats[i % formats.length],
        includeCharts: i % 2 === 0,
        isActive: i < 12,
        createdById: admin.id,
        nextRunAt: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
      },
    });
  }

  // ============ SURVEYS + QUESTIONS (15+) ============
  console.log('  Creating Surveys...');
  const surveyNames = [
    'Customer Satisfaction Q1', 'NPS Survey 2024', 'Product Feedback', 'Onboarding Experience',
    'Support Quality Survey', 'Feature Request Poll', 'Annual Customer Survey', 'Event Feedback',
    'Training Effectiveness', 'Sales Process Feedback', 'Website Usability', 'Partner Satisfaction',
    'Employee Engagement', 'Market Research', 'Beta Feature Feedback',
  ];
  const surveyTypes = ['SATISFACTION', 'NPS', 'FEEDBACK', 'CUSTOM'] as const;
  const questionTypes = ['TEXT', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'RATING', 'NPS'] as const;
  for (let i = 0; i < surveyNames.length; i++) {
    const survey = await prisma.survey.create({
      data: {
        name: surveyNames[i],
        description: `Survey: ${surveyNames[i]}`,
        status: ['DRAFT', 'ACTIVE', 'ACTIVE', 'CLOSED'][i % 4],
        type: surveyTypes[i % surveyTypes.length],
        isAnonymous: i % 3 === 0,
        showProgressBar: true,
        thankYouMessage: 'Thank you for your feedback!',
        createdById: admin.id,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
    });
    // Add 3-5 questions per survey
    const qCount = 3 + (i % 3);
    for (let q = 0; q < qCount; q++) {
      await prisma.surveyQuestion.create({
        data: {
          surveyId: survey.id,
          questionOrder: q + 1,
          questionText: [
            'How satisfied are you with our service?',
            'Would you recommend us to a colleague?',
            'What could we improve?',
            'Rate your overall experience (1-10)',
            'Which features do you use most?',
          ][q % 5],
          questionType: questionTypes[q % questionTypes.length],
          options: q % 3 === 1 ? ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied'] : [],
          isRequired: q < 2,
        },
      });
    }
  }

  // ============ WEB FORMS (15+) ============
  console.log('  Creating WebForms...');
  const webFormNames = [
    'Contact Us Form', 'Request a Demo', 'Free Trial Signup', 'Support Request',
    'Partner Application', 'Newsletter Signup', 'Event Registration', 'Feedback Form',
    'Quote Request', 'Job Application', 'Bug Report', 'Feature Request',
    'Referral Form', 'Webinar Registration', 'Customer Survey Entry',
  ];
  for (let i = 0; i < webFormNames.length; i++) {
    await prisma.webForm.create({
      data: {
        name: webFormNames[i],
        formType: i % 3 === 0 ? 'CASE' : 'LEAD',
        description: `Web form for: ${webFormNames[i]}`,
        fields: JSON.parse(JSON.stringify([
          { name: 'firstName', label: 'First Name', type: 'text', required: true },
          { name: 'lastName', label: 'Last Name', type: 'text', required: true },
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'message', label: 'Message', type: 'textarea', required: false },
        ])),
        isActive: i < 12,
        captchaEnabled: true,
        notifyEmails: [`admin@example.com`],
        redirectUrl: '/thank-you',
      },
    });
  }

  // ============ WORKFLOW RULES (15+) ============
  console.log('  Creating WorkflowRules...');
  const ruleNames = [
    'Auto-assign new leads', 'Escalate high-priority cases', 'Send welcome email on signup',
    'Notify manager on deal close', 'Update lead score on activity', 'Archive old opportunities',
    'Send renewal reminder', 'Auto-create task on lead assign', 'Notify on SLA breach',
    'Update contact on conversion', 'Send survey after case close', 'Auto-tag imported leads',
    'Escalate overdue tasks', 'Notify on quote acceptance', 'Auto-close stale cases',
  ];
  const triggerTypes = ['ON_CREATE', 'ON_UPDATE', 'ON_CREATE_OR_UPDATE', 'SCHEDULED'] as const;
  for (let i = 0; i < ruleNames.length; i++) {
    await prisma.workflowRule.create({
      data: {
        name: ruleNames[i],
        description: `Workflow: ${ruleNames[i]}`,
        objectType: reportObjects[i % reportObjects.length],
        triggerType: triggerTypes[i % triggerTypes.length],
        conditions: JSON.parse(JSON.stringify({ field: 'status', operator: 'equals', value: 'NEW' })),
        actions: JSON.parse(JSON.stringify([{ type: 'EMAIL', templateId: 'welcome' }])),
        isActive: i < 10,
        priority: i,
      },
    });
  }

  // ============ PROCESS FLOWS (15+) ============
  console.log('  Creating ProcessFlows...');
  const flowNames = [
    'Lead Qualification Flow', 'Case Escalation Process', 'Opportunity Approval',
    'New Customer Onboarding', 'Contract Renewal Flow', 'Invoice Collection Process',
    'Lead Nurture Sequence', 'Support Ticket Routing', 'Deal Registration Approval',
    'Quote Approval Chain', 'Employee Onboarding', 'Campaign Launch Checklist',
    'Product Return Process', 'Partner Activation Flow', 'Order Fulfillment Process',
  ];
  for (let i = 0; i < flowNames.length; i++) {
    await prisma.processFlow.create({
      data: {
        name: flowNames[i],
        description: `Automated process: ${flowNames[i]}`,
        objectType: reportObjects[i % reportObjects.length],
        nodes: JSON.parse(JSON.stringify([
          { id: 'start', type: 'trigger', label: 'Start', position: { x: 0, y: 0 } },
          { id: 'action1', type: 'action', label: 'Step 1', position: { x: 200, y: 0 } },
          { id: 'end', type: 'end', label: 'End', position: { x: 400, y: 0 } },
        ])),
        edges: JSON.parse(JSON.stringify([
          { source: 'start', target: 'action1' },
          { source: 'action1', target: 'end' },
        ])),
        isActive: i < 8,
        createdBy: admin.id,
      },
    });
  }

  // ============ ENTITLEMENTS (15+) ============
  console.log('  Creating Entitlements...');
  const entitlementNames = [
    'Gold Support Plan', 'Silver Support Plan', 'Bronze Support Plan', 'Premium SLA',
    'Standard Warranty', 'Extended Warranty', 'Enterprise Support', 'Basic Maintenance',
    'Priority Response', 'Dedicated Support', '24/7 Support Plan', 'Business Hours Support',
    'Developer Support', 'Partner Support Tier', 'VIP Support Package',
  ];
  const entitlementStatuses = ['ACTIVE', 'EXPIRED', 'INACTIVE'] as const;
  for (let i = 0; i < entitlementNames.length; i++) {
    const accountId = clientIds[i % clientIds.length];
    await prisma.entitlement.create({
      data: {
        name: entitlementNames[i],
        accountId,
        status: entitlementStatuses[i % entitlementStatuses.length],
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + (365 - i * 20) * 24 * 60 * 60 * 1000),
        remainingCases: i % 3 === 0 ? -1 : 10 - i,
        perIncident: i % 4 === 0,
        description: `${entitlementNames[i]} - support entitlement`,
      },
    });
  }

  // ============ ASSETS (15+) ============
  console.log('  Creating Assets...');
  const assetNames = [
    'CRM Server License', 'Analytics Dashboard', 'Email Gateway', 'Mobile App Suite',
    'API Gateway Appliance', 'Data Warehouse Module', 'Security Scanner', 'Load Balancer',
    'Backup Storage Unit', 'Monitoring Agent', 'Integration Hub', 'Report Builder Pro',
    'Automation Engine', 'Chat Widget', 'Knowledge Base Portal',
  ];
  const assetStatuses = ['PURCHASED', 'SHIPPED', 'INSTALLED', 'REGISTERED', 'OBSOLETE'] as const;
  for (let i = 0; i < assetNames.length; i++) {
    const accountId = clientIds[i % clientIds.length];
    await prisma.asset.create({
      data: {
        name: assetNames[i],
        serialNumber: `SN-${String(100000 + i)}`,
        description: `Asset: ${assetNames[i]}`,
        status: assetStatuses[i % assetStatuses.length],
        accountId,
        quantity: 1 + (i % 5),
        price: Math.floor(Math.random() * 5000) + 500,
        purchaseDate: new Date(Date.now() - (i + 1) * 30 * 24 * 60 * 60 * 1000),
        installDate: i % 2 === 0 ? new Date(Date.now() - i * 20 * 24 * 60 * 60 * 1000) : null,
        warrantyEndDate: new Date(Date.now() + (365 - i * 20) * 24 * 60 * 60 * 1000),
        ownerId: admin.id,
      },
    });
  }

  // ============ JOURNEYS + STEPS (15+) ============
  console.log('  Creating Journeys...');
  const journeyNames = [
    'New Lead Nurture', 'Customer Onboarding', 'Re-engagement Campaign', 'Upsell Opportunity',
    'Trial to Paid Conversion', 'Welcome Series', 'Abandoned Cart Recovery', 'Renewal Reminder',
    'Win-back Campaign', 'Event Follow-up', 'Product Education', 'Feature Adoption',
    'Referral Program', 'Anniversary Campaign', 'Seasonal Promotion',
  ];
  const journeyTypes = ['NURTURE', 'ONBOARDING', 'RE_ENGAGEMENT', 'UPSELL'] as const;
  const stepTypes = ['EMAIL', 'WAIT', 'CONDITION', 'ACTION'] as const;
  for (let i = 0; i < journeyNames.length; i++) {
    const journey = await prisma.journey.create({
      data: {
        name: journeyNames[i],
        description: `Journey: ${journeyNames[i]}`,
        status: ['DRAFT', 'ACTIVE', 'ACTIVE', 'PAUSED'][i % 4],
        type: journeyTypes[i % journeyTypes.length],
        triggerType: ['MANUAL', 'LEAD_CREATED', 'FORM_SUBMIT', 'SEGMENT_ENTRY'][i % 4],
        createdById: admin.id,
        totalEntered: Math.floor(Math.random() * 500),
        totalCompleted: Math.floor(Math.random() * 200),
      },
    });
    const sCount = 3 + (i % 3);
    for (let s = 0; s < sCount; s++) {
      await prisma.journeyStep.create({
        data: {
          journeyId: journey.id,
          stepOrder: s + 1,
          name: `Step ${s + 1}: ${['Send Email', 'Wait 3 Days', 'Check Open', 'Update Field', 'Send Follow-up'][s % 5]}`,
          type: stepTypes[s % stepTypes.length],
          waitDays: s % 4 === 1 ? 3 : null,
          emailSubject: s % 4 === 0 ? `Journey email step ${s + 1}` : null,
        },
      });
    }
  }

  // ============ CUSTOM OBJECTS + FIELDS (15+) ============
  console.log('  Creating CustomObjects...');
  const customObjNames = [
    'Project', 'Vendor', 'Expense', 'Milestone', 'Deliverable',
    'TimeEntry', 'Budget', 'RiskAssessment', 'Feedback', 'Certification',
    'Training', 'Equipment', 'Location', 'Department', 'Metric',
  ];
  for (let i = 0; i < customObjNames.length; i++) {
    const obj = await prisma.customObject.create({
      data: {
        name: customObjNames[i].toLowerCase().replace(/\s/g, '_'),
        label: customObjNames[i],
        pluralLabel: `${customObjNames[i]}s`,
        description: `Custom object for ${customObjNames[i]} tracking`,
        isActive: i < 12,
      },
    });
    const fieldCount = 3 + (i % 3);
    const fieldTypes = ['TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'PICKLIST'];
    for (let f = 0; f < fieldCount; f++) {
      await prisma.customField.create({
        data: {
          objectId: obj.id,
          name: `field_${f + 1}`,
          label: `${customObjNames[i]} Field ${f + 1}`,
          type: fieldTypes[f % fieldTypes.length],
          isRequired: f === 0,
          sortOrder: f,
          picklistValues: f % 5 === 4 ? ['Option A', 'Option B', 'Option C'] : [],
        },
      });
    }
  }

  // ============ MARKETING EVENTS (15+) ============
  console.log('  Creating MarketingEvents...');
  const mktEventNames = [
    'CRM Summit 2024', 'Webinar: Sales Best Practices', 'Product Launch Conference',
    'Customer Appreciation Day', 'Partner Workshop', 'Industry Trade Show',
    'Digital Marketing Masterclass', 'Annual User Conference', 'Tech Innovation Forum',
    'Sales Kickoff Event', 'Leadership Summit', 'Customer Success Meetup',
    'AI in Business Workshop', 'Cloud Migration Seminar', 'Quarterly Town Hall',
  ];
  const eventTypes = ['WEBINAR', 'CONFERENCE', 'WORKSHOP', 'MEETUP', 'TRADE_SHOW'] as const;
  const locationTypes = ['ONLINE', 'IN_PERSON', 'HYBRID'] as const;
  for (let i = 0; i < mktEventNames.length; i++) {
    await prisma.marketingEvent.create({
      data: {
        name: mktEventNames[i],
        description: `Marketing event: ${mktEventNames[i]}`,
        type: eventTypes[i % eventTypes.length],
        status: ['DRAFT', 'PUBLISHED', 'PUBLISHED', 'COMPLETED'][i % 4],
        startDateTime: new Date(Date.now() + (i - 5) * 14 * 24 * 60 * 60 * 1000),
        endDateTime: new Date(Date.now() + (i - 5) * 14 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        locationType: locationTypes[i % locationTypes.length],
        venue: i % 3 !== 0 ? `Venue ${i + 1}` : null,
        virtualUrl: i % 3 === 0 ? `https://meet.example.com/event-${i}` : null,
        maxAttendees: 50 + i * 20,
        currentAttendees: Math.floor(Math.random() * 50),
        registrationRequired: true,
        createdById: admin.id,
      },
    });
  }

  // ============ CHATTER GROUPS + MEMBERS (15+) ============
  console.log('  Creating ChatterGroups...');
  const groupNames = [
    'Sales Team', 'Marketing Team', 'Support Team', 'Engineering', 'Product Updates',
    'Company Announcements', 'Water Cooler', 'Book Club', 'New Hires', 'Leadership',
    'Customer Success', 'DevOps', 'Design Team', 'Finance', 'HR Updates',
  ];
  for (let i = 0; i < groupNames.length; i++) {
    const group = await prisma.chatterGroup.create({
      data: {
        name: groupNames[i],
        description: `Group for ${groupNames[i]} discussions`,
        isPublic: i < 10,
        isArchived: i >= 13,
        ownerId: admin.id,
        memberCount: Math.min(userIds.length, 3 + (i % 4)),
      },
    });
    const memberCount = Math.min(userIds.length, 3 + (i % 4));
    for (let m = 0; m < memberCount; m++) {
      try {
        await prisma.groupMember.create({
          data: {
            groupId: group.id,
            userId: userIds[m % userIds.length],
            role: m === 0 ? 'ADMIN' : 'MEMBER',
          },
        });
      } catch { /* skip duplicate */ }
    }
  }

  // ============ NOTES (15+) ============
  console.log('  Creating Notes...');
  const noteContents = [
    'Client expressed interest in upgrading to Enterprise plan',
    'Follow up needed after product demo next week',
    'Budget approval expected by end of month',
    'Key decision maker on vacation until next Friday',
    'Competitor offering 20% discount - need to match',
    'Technical requirements doc received, forwarding to engineering',
    'Client prefers quarterly billing over annual',
    'Integration with their existing ERP system is critical',
    'Scheduled site visit for next Tuesday',
    'Contract negotiation in final stages',
    'Customer reported positive ROI after 3 months',
    'Need to escalate renewal discussion to management',
    'Client interested in partner referral program',
    'Security audit requirements shared by client IT team',
    'Post-implementation review completed successfully',
  ];
  const existingContacts = await prisma.contact.findMany({ take: 10 });
  for (let i = 0; i < noteContents.length; i++) {
    await prisma.note.create({
      data: {
        content: noteContents[i],
        createdBy: admin.id,
        contactId: i < 8 && existingContacts[i % existingContacts.length] ? existingContacts[i % existingContacts.length].id : null,
        leadId: i >= 8 && existingLeads[i % existingLeads.length] ? existingLeads[i % existingLeads.length].id : null,
      },
    });
  }

  // ============ MASS EMAIL JOBS (15+) ============
  console.log('  Creating MassEmailJobs...');
  const massEmailNames = [
    'Q1 Newsletter Blast', 'Product Launch Announcement', 'Holiday Promotion',
    'Webinar Invitation', 'Customer Survey Distribution', 'Feature Update Email',
    'Renewal Reminder Campaign', 'Win-back Email Series', 'Event Follow-up',
    'Welcome Email Batch', 'Monthly Digest', 'Flash Sale Notification',
    'Year-end Summary', 'Training Invitation', 'Partnership Announcement',
  ];
  const massEmailStatuses = ['DRAFT', 'SCHEDULED', 'SENDING', 'COMPLETED', 'FAILED'] as const;
  for (let i = 0; i < massEmailNames.length; i++) {
    await prisma.massEmailJob.create({
      data: {
        name: massEmailNames[i],
        subject: massEmailNames[i],
        body: `<h1>${massEmailNames[i]}</h1><p>Dear valued customer, ...</p>`,
        recipientType: i % 2 === 0 ? 'Lead' : 'Contact',
        recipientIds: [],
        status: massEmailStatuses[i % massEmailStatuses.length],
        totalRecipients: 100 + i * 50,
        sentCount: i % 5 === 3 ? 100 + i * 50 : 0,
        openedCount: i % 5 === 3 ? Math.floor((100 + i * 50) * 0.3) : 0,
        clickedCount: i % 5 === 3 ? Math.floor((100 + i * 50) * 0.1) : 0,
        ownerId: admin.id,
        scheduledAt: i % 5 === 1 ? new Date(Date.now() + i * 24 * 60 * 60 * 1000) : null,
      },
    });
  }

  // ============ ROLES + ROLE ASSIGNMENTS (15+) ============
  console.log('  Creating Roles...');
  const roleData = [
    { name: 'ceo', label: 'CEO', parent: null },
    { name: 'vp_sales', label: 'VP of Sales', parent: 'ceo' },
    { name: 'vp_marketing', label: 'VP of Marketing', parent: 'ceo' },
    { name: 'vp_support', label: 'VP of Support', parent: 'ceo' },
    { name: 'vp_engineering', label: 'VP of Engineering', parent: 'ceo' },
    { name: 'sales_director', label: 'Sales Director', parent: 'vp_sales' },
    { name: 'marketing_director', label: 'Marketing Director', parent: 'vp_marketing' },
    { name: 'support_director', label: 'Support Director', parent: 'vp_support' },
    { name: 'sales_manager_east', label: 'Sales Manager - East', parent: 'sales_director' },
    { name: 'sales_manager_west', label: 'Sales Manager - West', parent: 'sales_director' },
    { name: 'sales_rep_1', label: 'Sales Representative 1', parent: 'sales_manager_east' },
    { name: 'sales_rep_2', label: 'Sales Representative 2', parent: 'sales_manager_east' },
    { name: 'sales_rep_3', label: 'Sales Representative 3', parent: 'sales_manager_west' },
    { name: 'support_agent_1', label: 'Support Agent 1', parent: 'support_director' },
    { name: 'marketing_specialist', label: 'Marketing Specialist', parent: 'marketing_director' },
  ];
  const roleMap: Record<string, string> = {};
  for (const rd of roleData) {
    const role = await prisma.role.create({
      data: {
        name: rd.name,
        label: rd.label,
        description: `Role: ${rd.label}`,
        parentRoleId: rd.parent ? roleMap[rd.parent] || null : null,
      },
    });
    roleMap[rd.name] = role.id;
  }

  // ============ CALENDAR EVENTS (15+) ============
  console.log('  Creating CalendarEvents...');
  const calEventSubjects = [
    'Team Standup', 'Client Call: Acme Corp', 'Sprint Review', 'Product Demo',
    'Lunch Meeting', 'All Hands', 'Interview: Senior Dev', 'Budget Review',
    'Training: New Features', 'Customer Visit', 'Strategy Session', 'One-on-One',
    'Vendor Meeting', 'Holiday Party Planning', 'Quarterly Review',
  ];
  for (let i = 0; i < calEventSubjects.length; i++) {
    const start = new Date(Date.now() + (i - 7) * 24 * 60 * 60 * 1000);
    start.setHours(9 + (i % 8), 0, 0, 0);
    const end = new Date(start.getTime() + (1 + (i % 2)) * 60 * 60 * 1000);
    await prisma.calendarEvent.create({
      data: {
        subject: calEventSubjects[i],
        description: `Calendar event: ${calEventSubjects[i]}`,
        startDateTime: start,
        endDateTime: end,
        location: i % 3 === 0 ? 'Conference Room A' : i % 3 === 1 ? 'Zoom' : null,
        isAllDay: i % 7 === 0,
        isPrivate: i % 5 === 0,
        ownerId: admin.id,
        status: 'CONFIRMED',
        busyStatus: 'BUSY',
        reminderMinutes: 15,
      },
    });
  }

  console.log('✅ All features data seeded successfully!');

  return {
    passwordResetTokens: 15,
    emailVerificationTokens: 15,
    leads: leadNames.length,
    contacts: 20,
    opportunities: oppNames.length,
    tasks: taskTitles.length,
    products: productNames.length,
    cases: caseSubjects.length,
    contracts: 15,
    quotes: 15,
    orders: 15,
    invoices: 15,
    events: eventTitles.length,
    emailTemplates: templateNames.length,
    knowledgeArticles: articleTitles.length,
    notifications: notifTitles.length,
    activities: 15,
    reports: 15,
    scheduledReports: 15,
    surveys: 15,
    webForms: 15,
    workflowRules: 15,
    processFlows: 15,
    entitlements: 15,
    assets: 15,
    journeys: 15,
    customObjects: 15,
    marketingEvents: 15,
    chatterGroups: 15,
    notes: 15,
    massEmailJobs: 15,
    roles: 15,
    calendarEvents: 15,
  };
}
