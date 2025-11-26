import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
// @ts-ignore
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedSalesforceFeatures() {
  console.log('🌱 Seeding Salesforce features data...');

  // Get admin user
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!admin) {
    console.error('❌ Admin user not found. Run main seed first.');
    return;
  }

  // Get client companies for relationships
  let clients = await prisma.clientCompany.findMany({ take: 5 });

  // Create sample client companies if none exist
  if (clients.length === 0) {
    console.log('Creating sample client companies...');
    const clientData = [
      { name: 'Acme Corporation', industry: 'Technology', contactName: 'John Smith', contactEmail: 'john@acme.com', contactPhone: '555-0100', website: 'https://acme.com' },
      { name: 'Global Industries', industry: 'Manufacturing', contactName: 'Sarah Johnson', contactEmail: 'sarah@global-ind.com', contactPhone: '555-0200', website: 'https://global-ind.com' },
      { name: 'Tech Solutions Inc', industry: 'Technology', contactName: 'Mike Williams', contactEmail: 'mike@techsolutions.com', contactPhone: '555-0300', website: 'https://techsolutions.com' },
      { name: 'Healthcare Plus', industry: 'Healthcare', contactName: 'Emily Brown', contactEmail: 'emily@healthcareplus.com', contactPhone: '555-0400', website: 'https://healthcareplus.com' },
      { name: 'Finance First', industry: 'Finance', contactName: 'David Davis', contactEmail: 'david@financefirst.com', contactPhone: '555-0500', website: 'https://financefirst.com' },
      { name: 'Retail Giants', industry: 'Retail', contactName: 'Lisa Miller', contactEmail: 'lisa@retailgiants.com', contactPhone: '555-0600', website: 'https://retailgiants.com' },
      { name: 'Energy Corp', industry: 'Energy', contactName: 'Robert Wilson', contactEmail: 'robert@energycorp.com', contactPhone: '555-0700', website: 'https://energycorp.com' },
      { name: 'Media Works', industry: 'Media', contactName: 'Jennifer Taylor', contactEmail: 'jennifer@mediaworks.com', contactPhone: '555-0800', website: 'https://mediaworks.com' },
    ];

    for (const client of clientData) {
      await prisma.clientCompany.create({ data: client });
    }
    clients = await prisma.clientCompany.findMany({ take: 8 });
  }
  console.log('✅ Client companies ready: ' + clients.length);

  // Create sample contacts
  let contacts = await prisma.contact.findMany({ take: 5 });
  if (contacts.length === 0) {
    console.log('Creating sample contacts...');
    const contactData = [
      { firstName: 'John', lastName: 'Smith', email: 'john.smith@acme.com', phone: '555-1001', title: 'CEO', clientId: clients[0]?.id, ownerId: admin.id },
      { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.j@global-ind.com', phone: '555-1002', title: 'VP Sales', clientId: clients[1]?.id, ownerId: admin.id },
      { firstName: 'Mike', lastName: 'Williams', email: 'mike.w@techsolutions.com', phone: '555-1003', title: 'CTO', clientId: clients[2]?.id, ownerId: admin.id },
      { firstName: 'Emily', lastName: 'Brown', email: 'emily.b@healthcareplus.com', phone: '555-1004', title: 'Director', clientId: clients[3]?.id, ownerId: admin.id },
      { firstName: 'David', lastName: 'Davis', email: 'david.d@financefirst.com', phone: '555-1005', title: 'CFO', clientId: clients[4]?.id, ownerId: admin.id },
      { firstName: 'Lisa', lastName: 'Miller', email: 'lisa.m@retailgiants.com', phone: '555-1006', title: 'COO', clientId: clients[5]?.id, ownerId: admin.id },
      { firstName: 'Robert', lastName: 'Wilson', email: 'robert.w@energycorp.com', phone: '555-1007', title: 'Manager', clientId: clients[6]?.id, ownerId: admin.id },
      { firstName: 'Jennifer', lastName: 'Taylor', email: 'jennifer.t@mediaworks.com', phone: '555-1008', title: 'VP Marketing', clientId: clients[7]?.id, ownerId: admin.id },
    ];

    for (const contact of contactData) {
      if (contact.clientId) {
        await prisma.contact.create({ data: contact });
      }
    }
    contacts = await prisma.contact.findMany({ take: 8 });
  }
  console.log('✅ Contacts ready: ' + contacts.length);

  // Create Products
  let products = await prisma.product.findMany({ take: 5 });
  if (products.length === 0) {
    console.log('Creating products...');
    const productData = [
      { name: 'Enterprise CRM License', code: 'CRM-ENT-001', description: 'Full enterprise CRM license', unitPrice: 999.99, isActive: true, clientId: clients[0].id },
      { name: 'Professional CRM License', code: 'CRM-PRO-001', description: 'Professional CRM license', unitPrice: 499.99, isActive: true, clientId: clients[0].id },
      { name: 'Basic CRM License', code: 'CRM-BAS-001', description: 'Basic CRM license', unitPrice: 199.99, isActive: true, clientId: clients[0].id },
      { name: 'Support Package - Gold', code: 'SUP-GLD-001', description: '24/7 premium support', unitPrice: 299.99, isActive: true, clientId: clients[0].id },
      { name: 'Support Package - Silver', code: 'SUP-SLV-001', description: 'Business hours support', unitPrice: 149.99, isActive: true, clientId: clients[0].id },
      { name: 'Training Package', code: 'TRN-PKG-001', description: 'Complete training program', unitPrice: 599.99, isActive: true, clientId: clients[0].id },
      { name: 'Data Migration Service', code: 'SVC-MIG-001', description: 'Full data migration', unitPrice: 1999.99, isActive: true, clientId: clients[0].id },
      { name: 'Custom Integration', code: 'SVC-INT-001', description: 'Custom API integration', unitPrice: 2499.99, isActive: true, clientId: clients[0].id },
      { name: 'Consulting Hours (10)', code: 'SVC-CON-010', description: '10 consulting hours', unitPrice: 1500.00, isActive: true, clientId: clients[0].id },
      { name: 'Annual Maintenance', code: 'MNT-ANN-001', description: 'Annual maintenance fee', unitPrice: 399.99, isActive: true, clientId: clients[0].id },
      { name: 'Mobile Add-on', code: 'ADD-MOB-001', description: 'Mobile app access', unitPrice: 99.99, isActive: true, clientId: clients[0].id },
      { name: 'Analytics Module', code: 'ADD-ANL-001', description: 'Advanced analytics', unitPrice: 249.99, isActive: true, clientId: clients[0].id },
      { name: 'Storage Upgrade 100GB', code: 'STG-100-001', description: 'Additional 100GB storage', unitPrice: 49.99, isActive: true, clientId: clients[0].id },
      { name: 'API Access Package', code: 'API-PKG-001', description: 'API access and rate limits', unitPrice: 199.99, isActive: true, clientId: clients[0].id },
      { name: 'Security Add-on', code: 'SEC-ADD-001', description: 'Advanced security features', unitPrice: 299.99, isActive: true, clientId: clients[0].id },
    ];

    for (const product of productData) {
      await prisma.product.create({ data: product });
    }
    products = await prisma.product.findMany();
  }
  console.log('✅ Products created: ' + products.length);

  // Create Quotes (15+)
  const existingQuotes = await prisma.quote.count();
  if (existingQuotes < 15) {
    console.log('Creating quotes...');
    const quoteStatuses: ('DRAFT' | 'NEEDS_REVIEW' | 'APPROVED' | 'PRESENTED' | 'ACCEPTED')[] = ['DRAFT', 'NEEDS_REVIEW', 'APPROVED', 'PRESENTED', 'ACCEPTED'];

    for (let i = 0; i < 20; i++) {
      const client = clients[i % clients.length];
      const contact = contacts[i % contacts.length];
      const subtotal = Math.floor(Math.random() * 50000) + 5000;
      const discount = Math.floor(subtotal * 0.1);
      const tax = Math.floor((subtotal - discount) * 0.08);

      const quote = await prisma.quote.create({
        data: {
          name: `Quote for ${client.name} - Q${2024}${String(i + 1).padStart(3, '0')}`,
          accountId: client.id,
          contactId: contact?.id,
          status: quoteStatuses[i % quoteStatuses.length],
          expirationDate: new Date(Date.now() + (30 + i * 7) * 24 * 60 * 60 * 1000),
          subtotal,
          discount,
          tax,
          grandTotal: subtotal - discount + tax,
          ownerId: admin.id,
          billingName: client.contactName,
          billingCity: 'San Francisco',
          billingState: 'CA',
          billingCountry: 'USA',
        }
      });

      // Add line items to each quote
      const numItems = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < numItems; j++) {
        const product = products[j % products.length];
        const qty = Math.floor(Math.random() * 5) + 1;
        await prisma.quoteLineItem.create({
          data: {
            quoteId: quote.id,
            productId: product.id,
            productName: product.name,
            productCode: product.code,
            quantity: qty,
            listPrice: product.unitPrice,
            unitPrice: product.unitPrice,
            totalPrice: product.unitPrice * qty,
          }
        });
      }
    }
  }
  console.log('✅ Quotes created');

  // Create Contracts (15+)
  const existingContracts = await prisma.contract.count();
  if (existingContracts < 15) {
    console.log('Creating contracts...');
    const contractStatuses: ('DRAFT' | 'IN_APPROVAL' | 'ACTIVATED' | 'EXPIRED')[] = ['DRAFT', 'IN_APPROVAL', 'ACTIVATED', 'ACTIVATED'];

    for (let i = 0; i < 20; i++) {
      const client = clients[i % clients.length];
      const startDate = new Date(Date.now() - (Math.random() * 365 * 24 * 60 * 60 * 1000));
      const contractTerm = [12, 24, 36][Math.floor(Math.random() * 3)];
      const endDate = new Date(startDate.getTime() + contractTerm * 30 * 24 * 60 * 60 * 1000);

      await prisma.contract.create({
        data: {
          name: `Service Agreement - ${client.name}`,
          accountId: client.id,
          status: contractStatuses[i % contractStatuses.length],
          startDate,
          endDate,
          contractTerm,
          totalValue: Math.floor(Math.random() * 100000) + 10000,
          ownerId: admin.id,
          billingCity: 'San Francisco',
          billingState: 'CA',
          billingCountry: 'USA',
        }
      });
    }
  }
  console.log('✅ Contracts created');

  // Create Orders (15+)
  const existingOrders = await prisma.order.count();
  if (existingOrders < 15) {
    console.log('Creating orders...');
    const orderStatuses: ('DRAFT' | 'ACTIVATED' | 'FULFILLED')[] = ['DRAFT', 'ACTIVATED', 'FULFILLED'];

    for (let i = 0; i < 20; i++) {
      const client = clients[i % clients.length];
      const contact = contacts[i % contacts.length];
      const subtotal = Math.floor(Math.random() * 30000) + 5000;
      const discount = Math.floor(subtotal * 0.05);
      const tax = Math.floor((subtotal - discount) * 0.08);

      const order = await prisma.order.create({
        data: {
          accountId: client.id,
          contactId: contact?.id,
          status: orderStatuses[i % orderStatuses.length],
          orderDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
          subtotal,
          discount,
          tax,
          totalAmount: subtotal - discount + tax,
          ownerId: admin.id,
          poNumber: `PO-${2024}${String(i + 1).padStart(4, '0')}`,
          billingCity: 'San Francisco',
          billingState: 'CA',
          billingCountry: 'USA',
        }
      });

      // Add order line items
      const numItems = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < numItems; j++) {
        const product = products[j % products.length];
        const qty = Math.floor(Math.random() * 5) + 1;
        await prisma.orderLineItem.create({
          data: {
            orderId: order.id,
            productId: product.id,
            productName: product.name,
            productCode: product.code,
            quantity: qty,
            listPrice: product.unitPrice,
            unitPrice: product.unitPrice,
            totalPrice: product.unitPrice * qty,
          }
        });
      }
    }
  }
  console.log('✅ Orders created');

  // Create Invoices (15+)
  const existingInvoices = await prisma.invoice.count();
  if (existingInvoices < 15) {
    console.log('Creating invoices...');
    const invoiceStatuses: ('DRAFT' | 'PENDING' | 'SENT' | 'PAID' | 'OVERDUE')[] = ['DRAFT', 'PENDING', 'SENT', 'PAID', 'OVERDUE'];

    for (let i = 0; i < 20; i++) {
      const client = clients[i % clients.length];
      const contact = contacts[i % contacts.length];
      const subtotal = Math.floor(Math.random() * 25000) + 2000;
      const discount = Math.floor(subtotal * 0.05);
      const tax = Math.floor((subtotal - discount) * 0.08);
      const total = subtotal - discount + tax;
      const status = invoiceStatuses[i % invoiceStatuses.length];
      const amountPaid = status === 'PAID' ? total : (status === 'PENDING' || status === 'OVERDUE' ? 0 : Math.floor(total * 0.5));

      const invoice = await prisma.invoice.create({
        data: {
          accountId: client.id,
          contactId: contact?.id,
          status,
          invoiceDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
          dueDate: new Date(Date.now() + (30 - i) * 24 * 60 * 60 * 1000),
          subtotal,
          discount,
          tax,
          totalAmount: total,
          amountPaid,
          balance: total - amountPaid,
          ownerId: admin.id,
          billingCity: 'San Francisco',
          billingState: 'CA',
          billingCountry: 'USA',
        }
      });

      // Add invoice line items
      const numItems = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < numItems; j++) {
        const product = products[j % products.length];
        const qty = Math.floor(Math.random() * 5) + 1;
        await prisma.invoiceLineItem.create({
          data: {
            invoiceId: invoice.id,
            productId: product.id,
            description: product.name,
            quantity: qty,
            unitPrice: product.unitPrice,
            totalPrice: product.unitPrice * qty,
          }
        });
      }
    }
  }
  console.log('✅ Invoices created');

  // Create Cases (15+)
  const existingCases = await prisma.case.count();
  if (existingCases < 15) {
    console.log('Creating cases...');
    const caseStatuses: ('NEW' | 'OPEN' | 'IN_PROGRESS' | 'ESCALATED' | 'CLOSED')[] = ['NEW', 'OPEN', 'IN_PROGRESS', 'ESCALATED', 'CLOSED'];
    const casePriorities: ('LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL')[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const caseOrigins: ('PHONE' | 'EMAIL' | 'WEB' | 'CHAT')[] = ['PHONE', 'EMAIL', 'WEB', 'CHAT'];
    const caseTypes = ['Bug', 'Feature Request', 'Question', 'How-to', 'Problem'];
    const caseSubjects = [
      'Cannot login to dashboard',
      'Report not generating correctly',
      'Need help with API integration',
      'Performance issues on large datasets',
      'Feature request: Dark mode',
      'Mobile app crashing on startup',
      'Email notifications not working',
      'Data export timing out',
      'User permissions not applying',
      'Custom field not saving',
      'Dashboard widgets loading slowly',
      'Calendar sync issues',
      'Lead import failing',
      'Report filters not working',
      'Task reminders not sending',
      'Password reset email delayed',
      'File upload size limit',
      'API rate limit questions',
      'Bulk update performance',
      'Integration with Slack',
    ];

    for (let i = 0; i < 20; i++) {
      const contact = contacts[i % contacts.length];
      await prisma.case.create({
        data: {
          subject: caseSubjects[i],
          description: `Detailed description for case: ${caseSubjects[i]}. Customer reported this issue and needs assistance.`,
          status: caseStatuses[i % caseStatuses.length],
          priority: casePriorities[i % casePriorities.length],
          origin: caseOrigins[i % caseOrigins.length],
          type: caseTypes[i % caseTypes.length],
          contactId: contact?.id,
          accountId: clients[i % clients.length].id,
          ownerId: admin.id,
        }
      });
    }
  }
  console.log('✅ Cases created');

  // Create Knowledge Articles (15+)
  const existingArticles = await prisma.knowledgeArticle.count();
  if (existingArticles < 15) {
    console.log('Creating knowledge articles...');

    // Create categories first
    const categories = await prisma.knowledgeCategory.createMany({
      data: [
        { name: 'Getting Started', description: 'Introductory guides and tutorials' },
        { name: 'User Guide', description: 'Detailed user documentation' },
        { name: 'Troubleshooting', description: 'Common issues and solutions' },
        { name: 'Best Practices', description: 'Tips and recommendations' },
        { name: 'API Documentation', description: 'Developer resources' },
      ],
      skipDuplicates: true,
    });

    const cats = await prisma.knowledgeCategory.findMany();

    const articleData = [
      { title: 'Getting Started with LeadGenFlow', summary: 'Learn the basics of LeadGenFlow CRM', keywords: ['beginner', 'setup', 'tutorial'] },
      { title: 'How to Create Your First Lead', summary: 'Step-by-step guide to creating leads', keywords: ['leads', 'create', 'guide'] },
      { title: 'Setting Up Email Templates', summary: 'Create and manage email templates', keywords: ['email', 'templates', 'marketing'] },
      { title: 'Understanding the Dashboard', summary: 'Navigate the main dashboard', keywords: ['dashboard', 'overview', 'metrics'] },
      { title: 'Managing Opportunities', summary: 'Track and manage sales opportunities', keywords: ['opportunities', 'sales', 'pipeline'] },
      { title: 'User Roles and Permissions', summary: 'Configure user access levels', keywords: ['security', 'roles', 'permissions'] },
      { title: 'API Authentication Guide', summary: 'Authenticate with the LeadGenFlow API', keywords: ['api', 'authentication', 'oauth'] },
      { title: 'Importing Data from CSV', summary: 'Bulk import your existing data', keywords: ['import', 'csv', 'migration'] },
      { title: 'Creating Custom Reports', summary: 'Build custom reports and dashboards', keywords: ['reports', 'analytics', 'custom'] },
      { title: 'Troubleshooting Login Issues', summary: 'Common login problems and solutions', keywords: ['login', 'troubleshooting', 'password'] },
      { title: 'Workflow Automation Basics', summary: 'Automate your business processes', keywords: ['automation', 'workflow', 'rules'] },
      { title: 'Mobile App Setup', summary: 'Get started with the mobile app', keywords: ['mobile', 'ios', 'android'] },
      { title: 'Email Integration Guide', summary: 'Connect your email account', keywords: ['email', 'integration', 'sync'] },
      { title: 'Best Practices for Lead Scoring', summary: 'Optimize your lead scoring model', keywords: ['leads', 'scoring', 'best-practices'] },
      { title: 'Calendar and Task Management', summary: 'Manage your schedule effectively', keywords: ['calendar', 'tasks', 'productivity'] },
      { title: 'Data Security Best Practices', summary: 'Keep your data safe and secure', keywords: ['security', 'data', 'best-practices'] },
    ];

    const articleStatuses: ('DRAFT' | 'PUBLISHED')[] = ['DRAFT', 'PUBLISHED'];

    for (let i = 0; i < articleData.length; i++) {
      const article = articleData[i];
      await prisma.knowledgeArticle.create({
        data: {
          title: article.title,
          summary: article.summary,
          content: `# ${article.title}\n\n${article.summary}\n\n## Introduction\nThis article provides detailed information about ${article.title.toLowerCase()}.\n\n## Key Points\n- Point 1\n- Point 2\n- Point 3\n\n## Steps\n1. First step\n2. Second step\n3. Third step\n\n## Conclusion\nFor more information, contact support.`,
          status: articleStatuses[i % articleStatuses.length],
          categoryId: cats[i % cats.length]?.id,
          authorId: admin.id,
          keywords: article.keywords,
          isPublic: i % 2 === 0,
          publishedAt: i % 2 === 0 ? new Date() : null,
        }
      });
    }
  }
  console.log('✅ Knowledge articles created');

  // Create Assets (15+)
  const existingAssets = await prisma.asset.count();
  if (existingAssets < 15) {
    console.log('Creating assets...');
    const assetStatuses: ('PURCHASED' | 'SHIPPED' | 'INSTALLED' | 'REGISTERED')[] = ['PURCHASED', 'SHIPPED', 'INSTALLED', 'REGISTERED'];

    for (let i = 0; i < 20; i++) {
      const client = clients[i % clients.length];
      const contact = contacts[i % contacts.length];
      const product = products[i % products.length];

      await prisma.asset.create({
        data: {
          name: `${product.name} - ${client.name}`,
          serialNumber: `SN-${Date.now()}-${i}`,
          description: `Asset for ${client.name}`,
          status: assetStatuses[i % assetStatuses.length],
          accountId: client.id,
          contactId: contact?.id,
          productId: product.id,
          productName: product.name,
          quantity: Math.floor(Math.random() * 10) + 1,
          price: product.unitPrice,
          purchaseDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          installDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
          warrantyEndDate: new Date(Date.now() + Math.random() * 730 * 24 * 60 * 60 * 1000),
          ownerId: admin.id,
        }
      });
    }
  }
  console.log('✅ Assets created');

  // Create Entitlement Processes (5)
  const existingProcesses = await prisma.entitlementProcess.count();
  let entitlementProcesses: any[] = [];
  if (existingProcesses < 5) {
    console.log('Creating entitlement processes...');
    const processData = [
      { name: 'Standard Support', description: 'Standard support SLA with business hours response' },
      { name: 'Premium Support', description: 'Premium support with 24/7 response' },
      { name: 'Enterprise Support', description: 'Enterprise-grade support with dedicated team' },
      { name: 'Basic Support', description: 'Basic support with email-only response' },
      { name: 'Partner Support', description: 'Support for partner organizations' },
    ];

    for (const process of processData) {
      await prisma.entitlementProcess.create({ data: process });
    }
    entitlementProcesses = await prisma.entitlementProcess.findMany();
  } else {
    entitlementProcesses = await prisma.entitlementProcess.findMany();
  }
  console.log('✅ Entitlement processes created');

  // Create Entitlements (15+)
  const existingEntitlements = await prisma.entitlement.count();
  if (existingEntitlements < 15) {
    console.log('Creating entitlements...');
    const entitlementStatuses: ('ACTIVE' | 'EXPIRED' | 'INACTIVE')[] = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'EXPIRED'];

    for (let i = 0; i < 20; i++) {
      const client = clients[i % clients.length];
      const process = entitlementProcesses[i % entitlementProcesses.length];

      await prisma.entitlement.create({
        data: {
          name: `${process.name} - ${client.name}`,
          accountId: client.id,
          status: entitlementStatuses[i % entitlementStatuses.length],
          startDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000),
          slaProcessId: process.id,
          remainingCases: Math.floor(Math.random() * 50) + 10,
          description: `Entitlement for ${client.name} under ${process.name} plan`,
        }
      });
    }
  }
  console.log('✅ Entitlements created');

  // Create Calendar Events (15+)
  const existingEvents = await prisma.calendarEvent.count();
  if (existingEvents < 15) {
    console.log('Creating calendar events...');
    const eventSubjects = [
      'Sales Meeting', 'Product Demo', 'Strategy Call', 'Quarterly Review',
      'Team Standup', 'Client Presentation', 'Training Session', 'Interview',
      'Project Kickoff', 'Budget Review', 'Customer Onboarding', 'Support Call',
      'Partner Meeting', 'Marketing Review', 'Sprint Planning', 'Retrospective',
      'Executive Sync', 'Technical Review', 'Sales Forecast', 'Pipeline Review',
    ];

    for (let i = 0; i < 20; i++) {
      const startDate = new Date(Date.now() + (Math.random() * 30 - 15) * 24 * 60 * 60 * 1000);
      const duration = [30, 60, 90, 120][Math.floor(Math.random() * 4)];
      const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

      await prisma.calendarEvent.create({
        data: {
          subject: eventSubjects[i],
          description: `Meeting for ${eventSubjects[i]}`,
          location: ['Zoom', 'Conference Room A', 'Conference Room B', 'Google Meet', 'Office'][Math.floor(Math.random() * 5)],
          startDateTime: startDate,
          endDateTime: endDate,
          isAllDay: i % 10 === 0,
          ownerId: admin.id,
          status: 'CONFIRMED',
          busyStatus: 'BUSY',
          reminderMinutes: 15,
        }
      });
    }
  }
  console.log('✅ Calendar events created');

  // Create File Folders and Files (15+)
  const existingFiles = await prisma.file.count();
  if (existingFiles < 15) {
    console.log('Creating files and folders...');

    // Create folders
    const folderData = [
      { name: 'Documents', ownerId: admin.id },
      { name: 'Contracts', ownerId: admin.id },
      { name: 'Proposals', ownerId: admin.id },
      { name: 'Marketing Materials', ownerId: admin.id },
      { name: 'Training', ownerId: admin.id },
    ];

    for (const folder of folderData) {
      await prisma.fileFolder.create({ data: folder });
    }
    const folders = await prisma.fileFolder.findMany();

    const fileData = [
      { name: 'Company Overview.pdf', fileType: 'pdf', contentType: 'application/pdf', fileSize: 1024000 },
      { name: 'Product Brochure.pdf', fileType: 'pdf', contentType: 'application/pdf', fileSize: 2048000 },
      { name: 'Sales Presentation.pptx', fileType: 'pptx', contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', fileSize: 5120000 },
      { name: 'Price List 2024.xlsx', fileType: 'xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fileSize: 512000 },
      { name: 'Contract Template.docx', fileType: 'docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', fileSize: 256000 },
      { name: 'Logo.png', fileType: 'png', contentType: 'image/png', fileSize: 128000 },
      { name: 'Product Screenshot.jpg', fileType: 'jpg', contentType: 'image/jpeg', fileSize: 384000 },
      { name: 'User Guide.pdf', fileType: 'pdf', contentType: 'application/pdf', fileSize: 4096000 },
      { name: 'API Documentation.pdf', fileType: 'pdf', contentType: 'application/pdf', fileSize: 1536000 },
      { name: 'Case Study - Acme.pdf', fileType: 'pdf', contentType: 'application/pdf', fileSize: 896000 },
      { name: 'Webinar Recording.mp4', fileType: 'mp4', contentType: 'video/mp4', fileSize: 102400000 },
      { name: 'Training Video.mp4', fileType: 'mp4', contentType: 'video/mp4', fileSize: 51200000 },
      { name: 'Feature Comparison.xlsx', fileType: 'xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fileSize: 384000 },
      { name: 'ROI Calculator.xlsx', fileType: 'xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fileSize: 256000 },
      { name: 'NDA Template.pdf', fileType: 'pdf', contentType: 'application/pdf', fileSize: 128000 },
      { name: 'Onboarding Checklist.pdf', fileType: 'pdf', contentType: 'application/pdf', fileSize: 192000 },
    ];

    for (let i = 0; i < fileData.length; i++) {
      const file = fileData[i];
      await prisma.file.create({
        data: {
          name: file.name,
          fileSize: file.fileSize,
          fileType: file.fileType,
          contentType: file.contentType,
          storageUrl: `/files/${file.name.toLowerCase().replace(/\s+/g, '-')}`,
          ownerId: admin.id,
          folderId: folders[i % folders.length]?.id,
          downloadCount: Math.floor(Math.random() * 100),
          tags: [file.fileType, 'shared'],
        }
      });
    }
  }
  console.log('✅ Files and folders created');

  // Create Roles (hierarchy)
  const existingRoles = await prisma.role.count();
  if (existingRoles < 5) {
    console.log('Creating roles...');

    const ceoRole = await prisma.role.create({
      data: { name: 'ceo', label: 'CEO', description: 'Chief Executive Officer' }
    });

    const vp = await prisma.role.create({
      data: { name: 'vp_sales', label: 'VP Sales', description: 'Vice President of Sales', parentRoleId: ceoRole.id }
    });

    await prisma.role.createMany({
      data: [
        { name: 'sales_manager', label: 'Sales Manager', description: 'Sales Team Manager', parentRoleId: vp.id },
        { name: 'sales_rep', label: 'Sales Representative', description: 'Sales Representative', parentRoleId: vp.id },
        { name: 'support_manager', label: 'Support Manager', description: 'Support Team Manager', parentRoleId: ceoRole.id },
        { name: 'support_agent', label: 'Support Agent', description: 'Customer Support Agent', parentRoleId: ceoRole.id },
        { name: 'marketing_manager', label: 'Marketing Manager', description: 'Marketing Team Manager', parentRoleId: ceoRole.id },
      ],
      skipDuplicates: true,
    });
  }
  console.log('✅ Roles created');

  // Create Permission Sets
  const existingPermSets = await prisma.permissionSet.count();
  if (existingPermSets < 5) {
    console.log('Creating permission sets...');

    const permSetData = [
      { name: 'sales_cloud_user', label: 'Sales Cloud User', description: 'Access to Sales Cloud features', permissions: { leads: { read: true, create: true, edit: true }, opportunities: { read: true, create: true, edit: true } } },
      { name: 'service_cloud_user', label: 'Service Cloud User', description: 'Access to Service Cloud features', permissions: { cases: { read: true, create: true, edit: true }, knowledge: { read: true } } },
      { name: 'marketing_user', label: 'Marketing User', description: 'Access to Marketing features', permissions: { campaigns: { read: true, create: true, edit: true }, emails: { read: true, create: true } } },
      { name: 'report_builder', label: 'Report Builder', description: 'Can create and manage reports', permissions: { reports: { read: true, create: true, edit: true, delete: true } } },
      { name: 'api_user', label: 'API User', description: 'API access permissions', permissions: { api: { enabled: true, rateLimit: 10000 } } },
    ];

    for (const permSet of permSetData) {
      await prisma.permissionSet.create({ data: permSet });
    }
  }
  console.log('✅ Permission sets created');

  // Create Routing Queues
  const existingQueues = await prisma.routingQueue.count();
  if (existingQueues < 5) {
    console.log('Creating routing queues...');

    const queueData = [
      { name: 'Sales Queue', description: 'Queue for sales inquiries', channel: 'WEB', routingType: 'ROUND_ROBIN' },
      { name: 'Support Queue', description: 'Queue for support requests', channel: 'WEB', routingType: 'SKILL_BASED' },
      { name: 'Enterprise Support', description: 'Priority queue for enterprise customers', channel: 'WEB', routingType: 'QUEUE', priority: 10 },
      { name: 'Phone Support', description: 'Inbound phone support', channel: 'PHONE', routingType: 'ROUND_ROBIN' },
      { name: 'Email Support', description: 'Email support queue', channel: 'EMAIL', routingType: 'QUEUE' },
    ];

    for (const queue of queueData) {
      await prisma.routingQueue.create({ data: queue });
    }
  }
  console.log('✅ Routing queues created');

  // Create Live Chats (15+)
  const existingChats = await prisma.liveChat.count();
  if (existingChats < 15) {
    console.log('Creating live chats...');
    const chatStatuses: ('WAITING' | 'ACTIVE' | 'ENDED')[] = ['WAITING', 'ACTIVE', 'ENDED'];

    for (let i = 0; i < 20; i++) {
      const contact = contacts[i % contacts.length];
      const status = chatStatuses[i % chatStatuses.length];

      const chat = await prisma.liveChat.create({
        data: {
          visitorName: contact ? `${contact.firstName} ${contact.lastName}` : `Visitor ${i + 1}`,
          visitorEmail: contact?.email || `visitor${i + 1}@example.com`,
          agentId: status !== 'WAITING' ? admin.id : null,
          status,
          channel: 'WEB',
          startedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          endedAt: status === 'ENDED' ? new Date() : null,
          waitTime: Math.floor(Math.random() * 300),
          duration: status === 'ENDED' ? Math.floor(Math.random() * 1800) : null,
          rating: status === 'ENDED' ? Math.floor(Math.random() * 5) + 1 : null,
        }
      });

      // Add some messages
      await prisma.liveChatMessage.createMany({
        data: [
          { chatId: chat.id, senderType: 'VISITOR', content: 'Hello, I need help with my account' },
          { chatId: chat.id, senderId: admin.id, senderType: 'AGENT', content: 'Hi! I\'d be happy to help. What seems to be the issue?' },
          { chatId: chat.id, senderType: 'VISITOR', content: 'I cannot access my reports' },
        ]
      });
    }
  }
  console.log('✅ Live chats created');

  // Create Mass Email Jobs (15+)
  const existingMassEmails = await prisma.massEmailJob.count();
  if (existingMassEmails < 15) {
    console.log('Creating mass email jobs...');
    const emailStatuses: ('DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED' | 'FAILED')[] = ['DRAFT', 'SCHEDULED', 'COMPLETED', 'COMPLETED', 'COMPLETED'];
    const emailSubjects = [
      'Welcome to LeadGenFlow - Getting Started Guide',
      'New Feature Announcement: AI-Powered Insights',
      'Your Monthly Product Update - November 2024',
      'Exclusive Webinar Invitation: Sales Best Practices',
      'End of Year Promotion - 20% Off All Plans',
      'Customer Success Story: How Acme Doubled Revenue',
      'Product Tips & Tricks Newsletter',
      'Important: Security Update Required',
      'Join Us at SalesForce Summit 2024',
      'Holiday Schedule and Support Hours',
      'New Integration Available: Slack & Teams',
      'Quarterly Business Review Invitation',
      'Introducing Our Partner Program',
      'Training Series: Mastering CRM Analytics',
      'Customer Appreciation Week Starts Now!',
      'Beta Testing Invitation: New Dashboard',
      'Your Account Summary for Q4',
      'Industry Report: CRM Trends 2025',
    ];

    for (let i = 0; i < 18; i++) {
      const status = emailStatuses[i % emailStatuses.length];
      const totalRecipients = Math.floor(Math.random() * 5000) + 100;
      const sentCount = status === 'COMPLETED' ? totalRecipients : (status === 'SENDING' ? Math.floor(totalRecipients * 0.5) : 0);
      const failedCount = status === 'COMPLETED' ? Math.floor(totalRecipients * 0.02) : 0;
      const openedCount = status === 'COMPLETED' ? Math.floor(sentCount * 0.35) : 0;
      const clickedCount = status === 'COMPLETED' ? Math.floor(openedCount * 0.15) : 0;

      await prisma.massEmailJob.create({
        data: {
          name: `Campaign: ${emailSubjects[i]}`,
          subject: emailSubjects[i],
          body: `<h1>${emailSubjects[i]}</h1><p>Dear {{fullName}},</p><p>We're excited to share this important update with you.</p><p>Best regards,<br/>The LeadGenFlow Team</p>`,
          recipientType: i % 2 === 0 ? 'Lead' : 'Contact',
          recipientIds: [],
          filterCriteria: { status: 'ACTIVE' },
          status,
          scheduledAt: status === 'SCHEDULED' ? new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000) : null,
          startedAt: status !== 'DRAFT' && status !== 'SCHEDULED' ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
          completedAt: status === 'COMPLETED' ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
          totalRecipients,
          sentCount,
          failedCount,
          openedCount,
          clickedCount,
          bouncedCount: Math.floor(failedCount * 0.5),
          ownerId: admin.id,
        }
      });
    }
  }
  console.log('✅ Mass email jobs created');

  // Create Web Forms (15+)
  const existingWebForms = await prisma.webForm.count();
  if (existingWebForms < 15) {
    console.log('Creating web forms...');
    const formNames = [
      { name: 'Contact Us - Main Website', type: 'LEAD', desc: 'Primary contact form on homepage' },
      { name: 'Request a Demo', type: 'LEAD', desc: 'Demo request form for sales team' },
      { name: 'Newsletter Signup', type: 'LEAD', desc: 'Email newsletter subscription' },
      { name: 'Support Ticket', type: 'CASE', desc: 'Customer support case submission' },
      { name: 'Free Trial Registration', type: 'LEAD', desc: 'Free trial signup form' },
      { name: 'Partner Inquiry', type: 'LEAD', desc: 'Partner program inquiry form' },
      { name: 'Bug Report', type: 'CASE', desc: 'Product bug reporting form' },
      { name: 'Feature Request', type: 'CASE', desc: 'Customer feature request submission' },
      { name: 'Webinar Registration', type: 'LEAD', desc: 'Webinar signup and registration' },
      { name: 'Pricing Inquiry', type: 'LEAD', desc: 'Custom pricing request form' },
      { name: 'Feedback Form', type: 'CASE', desc: 'General customer feedback' },
      { name: 'Career Application', type: 'LEAD', desc: 'Job application form' },
      { name: 'Whitepaper Download', type: 'LEAD', desc: 'Gated content download form' },
      { name: 'Event Registration', type: 'LEAD', desc: 'Event and conference signup' },
      { name: 'Billing Support', type: 'CASE', desc: 'Billing issues and inquiries' },
    ];

    const leadFields = [
      { name: 'firstName', label: 'First Name', type: 'text', required: true },
      { name: 'lastName', label: 'Last Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'company', label: 'Company', type: 'text', required: false },
      { name: 'phone', label: 'Phone', type: 'tel', required: false },
      { name: 'message', label: 'Message', type: 'textarea', required: false },
    ];

    const caseFields = [
      { name: 'name', label: 'Your Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'subject', label: 'Subject', type: 'text', required: true },
      { name: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High'], required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
    ];

    for (let i = 0; i < formNames.length; i++) {
      const form = formNames[i];
      const submissionCount = Math.floor(Math.random() * 500) + 20;

      const webForm = await prisma.webForm.create({
        data: {
          name: form.name,
          formType: form.type,
          description: form.desc,
          fields: form.type === 'LEAD' ? leadFields : caseFields,
          defaultValues: {},
          redirectUrl: form.type === 'LEAD' ? '/thank-you' : '/support/ticket-submitted',
          notifyEmails: ['sales@company.com', 'support@company.com'],
          isActive: i < 12,
          captchaEnabled: true,
          submissionCount,
        }
      });

      // Add some submissions
      const numSubmissions = Math.min(submissionCount, 5);
      for (let j = 0; j < numSubmissions; j++) {
        await prisma.webFormSubmission.create({
          data: {
            formId: webForm.id,
            data: form.type === 'LEAD'
              ? { firstName: `User${j}`, lastName: `Test${j}`, email: `user${j}@test.com`, company: 'Test Co', message: 'Sample submission' }
              : { name: `User ${j}`, email: `user${j}@test.com`, subject: `Support Request ${j}`, priority: 'Medium', description: 'Need help with...' },
            ipAddress: `192.168.1.${100 + j}`,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            status: j < 3 ? 'PROCESSED' : 'PENDING',
          }
        });
      }
    }
  }
  console.log('✅ Web forms created');

  // Create Partner Portal data
  console.log('Creating partner portal data...');

  // Get or create partner accounts (client companies as partners)
  const partnerLevels = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
  const partnerCompanyNames = [
    'Strategic Partners Inc',
    'Technology Alliance Group',
    'Global Resellers Ltd',
    'Integration Experts',
    'Cloud Solutions Partners',
    'Digital Transformation Co',
    'Enterprise Systems Inc',
  ];

  // Mark some existing client companies as partners and create new ones
  const allClients = await prisma.clientCompany.findMany();

  // Update first 4 existing clients as partners
  for (let i = 0; i < Math.min(4, allClients.length); i++) {
    await prisma.clientCompany.update({
      where: { id: allClients[i].id },
      data: {
        isPartner: true,
        partnerLevel: partnerLevels[i % 4],
        type: 'Partner',
      },
    });
  }

  // Create additional partner companies if needed
  for (let i = 0; i < partnerCompanyNames.length; i++) {
    const existingPartner = await prisma.clientCompany.findFirst({
      where: { name: partnerCompanyNames[i] },
    });

    if (!existingPartner) {
      await prisma.clientCompany.create({
        data: {
          name: partnerCompanyNames[i],
          industry: 'Technology',
          contactName: `Partner Contact ${i + 1}`,
          contactEmail: `contact${i + 1}@partner${i + 1}.com`,
          contactPhone: `555-200${i}`,
          website: `https://partner${i + 1}.com`,
          isPartner: true,
          partnerLevel: partnerLevels[i % 4],
          type: 'Partner',
        },
      });
    }
  }
  console.log('✅ Partner companies created');

  // Create partner users (contacts with isPartnerUser = true)
  const partnerClients = await prisma.clientCompany.findMany({
    where: { isPartner: true },
  });

  const partnerUserNames = [
    { firstName: 'Alex', lastName: 'Partner', title: 'Partner Manager' },
    { firstName: 'Jordan', lastName: 'Alliance', title: 'Alliance Director' },
    { firstName: 'Casey', lastName: 'Reseller', title: 'Sales Rep' },
    { firstName: 'Morgan', lastName: 'Channel', title: 'Channel Manager' },
    { firstName: 'Taylor', lastName: 'Tech', title: 'Technical Lead' },
    { firstName: 'Riley', lastName: 'Integration', title: 'Integration Specialist' },
    { firstName: 'Quinn', lastName: 'Solutions', title: 'Solutions Architect' },
    { firstName: 'Avery', lastName: 'Digital', title: 'Digital Consultant' },
    { firstName: 'Drew', lastName: 'Enterprise', title: 'Enterprise Specialist' },
    { firstName: 'Cameron', lastName: 'Cloud', title: 'Cloud Expert' },
    { firstName: 'Skyler', lastName: 'Business', title: 'Business Developer' },
    { firstName: 'Jamie', lastName: 'Strategic', title: 'Strategic Advisor' },
    { firstName: 'Reese', lastName: 'Growth', title: 'Growth Manager' },
    { firstName: 'Blake', lastName: 'Revenue', title: 'Revenue Lead' },
    { firstName: 'Emerson', lastName: 'Market', title: 'Market Analyst' },
  ];

  const portalStatuses = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'INACTIVE', 'PENDING'];

  for (let i = 0; i < partnerUserNames.length; i++) {
    const partnerUser = partnerUserNames[i];
    const client = partnerClients[i % partnerClients.length];

    if (client) {
      const existingContact = await prisma.contact.findFirst({
        where: {
          email: `${partnerUser.firstName.toLowerCase()}.${partnerUser.lastName.toLowerCase()}@partner.com`,
        },
      });

      if (!existingContact) {
        await prisma.contact.create({
          data: {
            firstName: partnerUser.firstName,
            lastName: partnerUser.lastName,
            email: `${partnerUser.firstName.toLowerCase()}.${partnerUser.lastName.toLowerCase()}@partner.com`,
            phone: `555-300${i}`,
            title: partnerUser.title,
            clientId: client.id,
            ownerId: admin.id,
            isPartnerUser: true,
            portalStatus: portalStatuses[i % 5],
          },
        });
      }
    }
  }
  console.log('✅ Partner users created');

  // Create Customer Portal data
  console.log('Creating customer portal data...');

  // Mark some client companies as customers
  const customerClients = await prisma.clientCompany.findMany({
    where: { isPartner: false },
    take: 8,
  });

  for (const client of customerClients) {
    await prisma.clientCompany.update({
      where: { id: client.id },
      data: { type: 'Customer' },
    });
  }

  // Create customer portal users (contacts with isPortalUser = true)
  const customerUserNames = [
    { firstName: 'Chris', lastName: 'Customer', title: 'IT Manager' },
    { firstName: 'Pat', lastName: 'Support', title: 'Support Admin' },
    { firstName: 'Sam', lastName: 'Operations', title: 'Operations Lead' },
    { firstName: 'Robin', lastName: 'Project', title: 'Project Manager' },
    { firstName: 'Dana', lastName: 'Business', title: 'Business Analyst' },
    { firstName: 'Leslie', lastName: 'Admin', title: 'System Admin' },
    { firstName: 'Kerry', lastName: 'User', title: 'Power User' },
    { firstName: 'Jesse', lastName: 'End', title: 'End User' },
    { firstName: 'Carey', lastName: 'Team', title: 'Team Lead' },
    { firstName: 'Shawn', lastName: 'Manager', title: 'Department Manager' },
    { firstName: 'Terry', lastName: 'Director', title: 'IT Director' },
    { firstName: 'Kelly', lastName: 'Coordinator', title: 'Project Coordinator' },
  ];

  for (let i = 0; i < customerUserNames.length; i++) {
    const customerUser = customerUserNames[i];
    const client = customerClients[i % customerClients.length];

    if (client) {
      const existingContact = await prisma.contact.findFirst({
        where: {
          email: `${customerUser.firstName.toLowerCase()}.${customerUser.lastName.toLowerCase()}@customer.com`,
        },
      });

      if (!existingContact) {
        await prisma.contact.create({
          data: {
            firstName: customerUser.firstName,
            lastName: customerUser.lastName,
            email: `${customerUser.firstName.toLowerCase()}.${customerUser.lastName.toLowerCase()}@customer.com`,
            phone: `555-400${i}`,
            title: customerUser.title,
            clientId: client.id,
            ownerId: admin.id,
            isPortalUser: true,
            portalStatus: portalStatuses[i % 5],
          },
        });
      }
    }
  }
  console.log('✅ Customer portal users created');

  // Create some cases for customer portal users
  const portalUsers = await prisma.contact.findMany({
    where: { isPortalUser: true },
  });

  const caseSubjects = [
    'Login issue - cannot access account',
    'Feature request - bulk export',
    'Bug report - dashboard not loading',
    'Billing inquiry - invoice clarification',
    'Integration help needed',
    'Password reset not working',
    'Data sync issue',
    'Performance problems',
    'User access management',
    'Training request',
  ];

  const caseStatuses = ['NEW', 'OPEN', 'IN_PROGRESS', 'ESCALATED', 'CLOSED'] as const;
  const casePriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
  const caseOrigins = ['WEB', 'EMAIL', 'PHONE', 'CHAT'] as const;

  for (let i = 0; i < Math.min(portalUsers.length * 2, 20); i++) {
    const portalUser = portalUsers[i % portalUsers.length];
    const subject = caseSubjects[i % caseSubjects.length];

    const existingCase = await prisma.case.findFirst({
      where: {
        subject: `${subject} - ${i + 1}`,
      },
    });

    if (!existingCase) {
      await prisma.case.create({
        data: {
          caseNumber: `CS-${String(i + 1000).padStart(6, '0')}`,
          subject: `${subject} - ${i + 1}`,
          description: `Customer reported: ${subject.toLowerCase()}. Needs attention.`,
          status: caseStatuses[i % 5],
          priority: casePriorities[i % 4],
          origin: caseOrigins[i % 4],
          contactId: portalUser.id,
          accountId: portalUser.clientId,
          ownerId: admin.id,
        },
      });
    }
  }
  console.log('✅ Portal cases created');

  console.log('🎉 Salesforce features seed complete!');
}

seedSalesforceFeatures()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('❌ Seed error:', e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
