import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Generate demo data WITHOUT inserting into database
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const generated: Record<string, any[]> = {};

    // Generate unique prefix based on timestamp
    const uniquePrefix = Date.now().toString(36).toUpperCase();

    // 1. Generate Client Companies (some as partners, some as customers)
    const companyNames = [
      'Acme Corporation', 'TechVentures Inc', 'Global Solutions Ltd', 'Innovation Labs',
      'Enterprise Systems', 'Digital Dynamics', 'CloudFirst Technologies', 'DataDriven Co',
      'SmartBusiness Group', 'NextGen Solutions', 'Pioneer Industries', 'Strategic Partners Inc',
      'Alpha Consulting', 'Beta Technologies', 'Gamma Enterprises'
    ];

    generated.clientCompanies = companyNames.map((name, i) => ({
      id: `company-${uniquePrefix}-${i}`,
      name,
      industry: ['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing'][i % 5],
      website: `https://www.${name.toLowerCase().replace(/\s/g, '')}.com`,
      contactName: `Contact ${i + 1}`,
      contactEmail: `contact@${name.toLowerCase().replace(/\s/g, '')}.com`,
      contactPhone: `555-100-${String(i).padStart(4, '0')}`,
      isPartner: i < 5,
      partnerLevel: i < 5 ? ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'][i % 4] : null,
      type: i < 5 ? 'Partner' : 'Customer',
    }));

    // 2. Generate Products
    const productData = [
      { name: 'Enterprise CRM Suite', price: 50000, category: 'Software' },
      { name: 'Cloud Storage Plan', price: 12000, category: 'Cloud Services' },
      { name: 'Security Package', price: 25000, category: 'Security' },
      { name: 'Analytics Platform', price: 35000, category: 'Analytics' },
      { name: 'Support Premium', price: 15000, category: 'Support' },
      { name: 'Integration Services', price: 20000, category: 'Services' },
      { name: 'Training Program', price: 8000, category: 'Training' },
      { name: 'API Access Pro', price: 10000, category: 'Developer Tools' },
      { name: 'Mobile App License', price: 18000, category: 'Mobile' },
      { name: 'Data Migration Service', price: 30000, category: 'Services' },
    ];

    generated.products = productData.map((p, i) => ({
      id: `product-${uniquePrefix}-${i}`,
      clientId: generated.clientCompanies[i % generated.clientCompanies.length].id,
      name: p.name,
      description: `${p.name} - Professional grade solution`,
      category: p.category,
      unitPrice: p.price,
      isActive: true,
    }));

    // 3. Generate Contacts (some as portal users, some as partner users)
    const contactNames = [
      'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'David Wilson',
      'Jennifer Taylor', 'Robert Martinez', 'Lisa Anderson', 'William Thomas', 'Jessica White',
      'Christopher Lee', 'Amanda Garcia', 'Daniel Rodriguez', 'Michelle Lewis', 'Matthew Walker',
      'Ashley Hall', 'Joshua Allen', 'Stephanie Young', 'Andrew King', 'Nicole Wright'
    ];

    generated.contacts = contactNames.map((name, i) => {
      const nameParts = name.split(' ');
      return {
        id: `contact-${uniquePrefix}-${i}`,
        clientId: generated.clientCompanies[i % generated.clientCompanies.length].id,
        firstName: nameParts[0],
        lastName: nameParts[1],
        email: `${nameParts[0].toLowerCase()}.${nameParts[1].toLowerCase()}@example.com`,
        phone: `555-200-${String(i).padStart(4, '0')}`,
        title: ['CEO', 'CTO', 'CFO', 'VP Sales', 'Director', 'Manager', 'Engineer', 'Analyst'][i % 8],
        department: ['Executive', 'Engineering', 'Finance', 'Sales', 'Marketing', 'Operations'][i % 6],
        isPrimary: i % 3 === 0,
        ownerId: userId,
        isPortalUser: i >= 10 && i < 15,
        isPartnerUser: i < 5,
        portalStatus: (i < 5 || (i >= 10 && i < 15)) ? ['ACTIVE', 'ACTIVE', 'ACTIVE', 'INACTIVE', 'PENDING'][i % 5] : null,
      };
    });

    // 4. Generate Campaigns
    generated.campaigns = Array.from({ length: 5 }, (_, i) => ({
      id: `campaign-${uniquePrefix}-${i}`,
      clientId: generated.clientCompanies[i].id,
      name: `Q${(i % 4) + 1} ${['Outreach', 'Lead Gen', 'Nurture', 'Conversion', 'Retention'][i]} Campaign`,
      status: ['ACTIVE', 'DRAFT', 'COMPLETED', 'PAUSED', 'ACTIVE'][i],
      channel: ['EMAIL', 'LINKEDIN', 'COLD_CALL', 'PAID_ADS', 'MULTI_CHANNEL'][i],
      targetPersona: 'Decision Makers',
      startDate: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + (60 - i * 10) * 24 * 60 * 60 * 1000).toISOString(),
      ownerId: userId,
    }));

    // 5. Generate Leads
    generated.leads = Array.from({ length: 20 }, (_, i) => ({
      id: `lead-${uniquePrefix}-${i}`,
      clientId: generated.clientCompanies[i % generated.clientCompanies.length].id,
      fullName: `Lead Person ${i + 1}`,
      email: `lead${i + 1}@prospect.com`,
      phone: `555-300-${String(i).padStart(4, '0')}`,
      company: `Prospect Company ${i + 1}`,
      title: ['Manager', 'Director', 'VP', 'CEO'][i % 4],
      status: ['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'WON'][i % 5],
      leadSource: ['AGENCY', 'CLIENT_SUBMITTED', 'IMPORTED', 'MANUAL'][i % 4],
      qualificationScore: Math.floor(Math.random() * 50) + 50,
      submittedBy: userId,
      campaignId: generated.campaigns[i % generated.campaigns.length].id,
    }));

    // 6. Generate Opportunities
    generated.opportunities = Array.from({ length: 15 }, (_, i) => ({
      id: `opportunity-${uniquePrefix}-${i}`,
      clientId: generated.clientCompanies[i % generated.clientCompanies.length].id,
      contactId: generated.contacts[i % generated.contacts.length].id,
      name: `${['Enterprise Deal', 'Growth Package', 'Renewal', 'Expansion', 'New Business'][i % 5]} - ${generated.clientCompanies[i % generated.clientCompanies.length].name}`,
      stage: ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'][i % 6],
      amount: generated.products[i % generated.products.length].unitPrice * (1 + Math.random()),
      probability: [10, 25, 50, 75, 90, 100][i % 6],
      expectedCloseDate: new Date(Date.now() + (30 + i * 7) * 24 * 60 * 60 * 1000).toISOString(),
      ownerId: userId,
    }));

    // 7. Generate Cases
    const caseSubjects = [
      'Login issue', 'Feature request', 'Bug report', 'Billing inquiry', 'Integration help',
      'Performance problem', 'Data sync issue', 'Access management', 'Training request', 'General inquiry'
    ];
    generated.cases = Array.from({ length: 15 }, (_, i) => ({
      id: `case-${uniquePrefix}-${i}`,
      caseNumber: `CS-${uniquePrefix}-${String(i + 1).padStart(4, '0')}`,
      subject: `${caseSubjects[i % caseSubjects.length]} - ${i + 1}`,
      description: `Customer reported: ${caseSubjects[i % caseSubjects.length].toLowerCase()}`,
      status: ['NEW', 'OPEN', 'IN_PROGRESS', 'ESCALATED', 'CLOSED'][i % 5],
      priority: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][i % 4],
      origin: ['WEB', 'EMAIL', 'PHONE', 'CHAT'][i % 4],
      contactId: generated.contacts[i % generated.contacts.length].id,
      accountId: generated.clientCompanies[i % generated.clientCompanies.length].id,
      ownerId: userId,
    }));

    // 8. Generate Knowledge Articles
    const categoryNames = ['Getting Started', 'Troubleshooting', 'Best Practices', 'FAQs', 'Release Notes'];
    generated.knowledgeCategories = categoryNames.map((name, i) => ({
      id: `category-${uniquePrefix}-${i}`,
      name,
      description: `${name} articles`,
    }));

    generated.knowledgeArticles = Array.from({ length: 15 }, (_, i) => ({
      id: `article-${uniquePrefix}-${i}`,
      articleNumber: `KB-${uniquePrefix}-${String(i + 1).padStart(4, '0')}`,
      title: `How to ${['configure', 'troubleshoot', 'optimize', 'integrate', 'manage'][i % 5]} ${['settings', 'users', 'data', 'reports', 'workflows'][i % 5]}`,
      summary: `A comprehensive guide on ${['configuration', 'troubleshooting', 'optimization', 'integration', 'management'][i % 5]}`,
      content: `<h2>Overview</h2><p>This article covers...</p><h2>Steps</h2><ol><li>Step 1</li><li>Step 2</li><li>Step 3</li></ol>`,
      status: ['DRAFT', 'PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'ARCHIVED'][i % 5],
      categoryId: generated.knowledgeCategories[i % generated.knowledgeCategories.length].id,
      authorId: userId,
      keywords: ['help', 'guide', 'tutorial'],
      isPublic: i % 2 === 0,
      viewCount: Math.floor(Math.random() * 500),
    }));

    // 9. Generate Contracts
    generated.contracts = Array.from({ length: 12 }, (_, i) => ({
      id: `contract-${uniquePrefix}-${i}`,
      contractNumber: `CON-${uniquePrefix}-${String(i + 1).padStart(4, '0')}`,
      accountId: generated.clientCompanies[i % generated.clientCompanies.length].id,
      status: ['DRAFT', 'IN_APPROVAL', 'ACTIVATED', 'ACTIVATED', 'EXPIRED'][i % 5],
      startDate: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + (365 - i * 30) * 24 * 60 * 60 * 1000).toISOString(),
      contractTerm: 12,
      totalValue: generated.products[i % generated.products.length].unitPrice * 12,
      ownerId: userId,
      description: `Service agreement for ${generated.clientCompanies[i % generated.clientCompanies.length].name}`,
    }));

    // 10. Generate Quotes
    generated.quotes = Array.from({ length: 12 }, (_, i) => ({
      id: `quote-${uniquePrefix}-${i}`,
      quoteNumber: `QT-${uniquePrefix}-${String(i + 1).padStart(4, '0')}`,
      name: `Quote for ${generated.clientCompanies[i % generated.clientCompanies.length].name}`,
      accountId: generated.clientCompanies[i % generated.clientCompanies.length].id,
      opportunityId: generated.opportunities[i % generated.opportunities.length].id,
      contactId: generated.contacts[i % generated.contacts.length].id,
      status: ['DRAFT', 'NEEDS_REVIEW', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'ACCEPTED'][i % 6],
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      subtotal: generated.products[i % generated.products.length].unitPrice,
      discount: Math.floor(Math.random() * 15),
      tax: generated.products[i % generated.products.length].unitPrice * 0.1,
      totalPrice: generated.products[i % generated.products.length].unitPrice * 1.1,
      ownerId: userId,
    }));

    // 11. Generate Orders
    generated.orders = Array.from({ length: 10 }, (_, i) => ({
      id: `order-${uniquePrefix}-${i}`,
      orderNumber: `ORD-${uniquePrefix}-${String(i + 1).padStart(4, '0')}`,
      accountId: generated.clientCompanies[i % generated.clientCompanies.length].id,
      contractId: generated.contracts[i % generated.contracts.length].id,
      quoteId: generated.quotes[i % generated.quotes.length].id,
      status: ['DRAFT', 'PENDING', 'ACTIVATED', 'FULFILLED', 'CANCELLED'][i % 5],
      orderDate: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
      totalAmount: generated.products[i % generated.products.length].unitPrice,
      ownerId: userId,
    }));

    // 12. Generate Invoices
    generated.invoices = Array.from({ length: 10 }, (_, i) => ({
      id: `invoice-${uniquePrefix}-${i}`,
      invoiceNumber: `INV-${uniquePrefix}-${String(i + 1).padStart(4, '0')}`,
      accountId: generated.clientCompanies[i % generated.clientCompanies.length].id,
      orderId: generated.orders[i % generated.orders.length].id,
      status: ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'][i % 5],
      invoiceDate: new Date(Date.now() - i * 14 * 24 * 60 * 60 * 1000).toISOString(),
      dueDate: new Date(Date.now() + (30 - i * 3) * 24 * 60 * 60 * 1000).toISOString(),
      subtotal: generated.products[i % generated.products.length].unitPrice,
      tax: generated.products[i % generated.products.length].unitPrice * 0.1,
      totalAmount: generated.products[i % generated.products.length].unitPrice * 1.1,
      ownerId: userId,
    }));

    // 13. Generate Assets
    generated.assets = Array.from({ length: 12 }, (_, i) => ({
      id: `asset-${uniquePrefix}-${i}`,
      name: `${generated.products[i % generated.products.length].name} - License ${i + 1}`,
      accountId: generated.clientCompanies[i % generated.clientCompanies.length].id,
      contactId: generated.contacts[i % generated.contacts.length].id,
      productId: generated.products[i % generated.products.length].id,
      serialNumber: `SN-${uniquePrefix}-${String(i + 1).padStart(6, '0')}`,
      status: ['PURCHASED', 'SHIPPED', 'INSTALLED', 'REGISTERED', 'OBSOLETE'][i % 5],
      purchaseDate: new Date(Date.now() - i * 60 * 24 * 60 * 60 * 1000).toISOString(),
      installDate: new Date(Date.now() - (i * 60 - 7) * 24 * 60 * 60 * 1000).toISOString(),
      usageEndDate: new Date(Date.now() + (365 - i * 30) * 24 * 60 * 60 * 1000).toISOString(),
      price: generated.products[i % generated.products.length].unitPrice,
      quantity: 1,
    }));

    // 14. Generate Entitlements
    generated.entitlements = Array.from({ length: 10 }, (_, i) => ({
      id: `entitlement-${uniquePrefix}-${i}`,
      name: `Support Entitlement - ${generated.clientCompanies[i % generated.clientCompanies.length].name}`,
      accountId: generated.clientCompanies[i % generated.clientCompanies.length].id,
      assetId: generated.assets[i % generated.assets.length].id,
      contractId: generated.contracts[i % generated.contracts.length].id,
      type: ['PHONE', 'WEB', 'PREMIUM', 'BASIC'][i % 4],
      startDate: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + (365 - i * 30) * 24 * 60 * 60 * 1000).toISOString(),
      status: ['ACTIVE', 'ACTIVE', 'ACTIVE', 'EXPIRED', 'INACTIVE'][i % 5],
      remainingCases: Math.floor(Math.random() * 20) + 5,
      totalCases: 25,
    }));

    // 15. Generate Tasks
    generated.tasks = Array.from({ length: 20 }, (_, i) => ({
      id: `task-${uniquePrefix}-${i}`,
      subject: `${['Follow up', 'Review', 'Prepare', 'Schedule', 'Complete'][i % 5]} - ${['proposal', 'contract', 'demo', 'meeting', 'report'][i % 5]}`,
      description: `Task description for item ${i + 1}`,
      status: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'WAITING', 'DEFERRED'][i % 5],
      priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'][i % 4],
      dueDate: new Date(Date.now() + (i * 3) * 24 * 60 * 60 * 1000).toISOString(),
      assignedTo: userId,
      createdBy: userId,
      opportunityId: i < 10 ? generated.opportunities[i % generated.opportunities.length].id : null,
      contactId: generated.contacts[i % generated.contacts.length].id,
    }));

    // 16. Generate Events
    generated.events = Array.from({ length: 15 }, (_, i) => {
      const startTime = new Date(Date.now() + i * 2 * 24 * 60 * 60 * 1000);
      return {
        id: `event-${uniquePrefix}-${i}`,
        subject: `${['Meeting', 'Call', 'Demo', 'Review', 'Training'][i % 5]} with ${generated.contacts[i % generated.contacts.length].firstName}`,
        description: `Event details for ${i + 1}`,
        location: ['Office', 'Zoom', 'Client Site', 'Conference Room', 'Phone'][i % 5],
        startDateTime: startTime.toISOString(),
        endDateTime: new Date(startTime.getTime() + 60 * 60 * 1000).toISOString(),
        isAllDay: i % 5 === 0,
        ownerId: userId,
        contactId: generated.contacts[i % generated.contacts.length].id,
      };
    });

    // 17. Generate Mass Email Jobs
    generated.massEmailJobs = Array.from({ length: 8 }, (_, i) => ({
      id: `email-job-${uniquePrefix}-${i}`,
      name: `${['Newsletter', 'Promotion', 'Announcement', 'Follow-up'][i % 4]} Campaign ${i + 1}`,
      subject: `Important update from our team - ${i + 1}`,
      body: `<p>Dear Customer,</p><p>We have exciting news to share...</p>`,
      recipientType: ['Lead', 'Contact'][i % 2],
      status: ['DRAFT', 'SCHEDULED', 'SENDING', 'COMPLETED', 'FAILED'][i % 5],
      totalRecipients: Math.floor(Math.random() * 500) + 100,
      sentCount: i % 5 >= 3 ? Math.floor(Math.random() * 400) + 50 : 0,
      openedCount: i % 5 >= 3 ? Math.floor(Math.random() * 200) + 20 : 0,
      clickedCount: i % 5 >= 3 ? Math.floor(Math.random() * 50) + 5 : 0,
      scheduledAt: i % 5 === 1 ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null,
      ownerId: userId,
    }));

    // 18. Generate Web Forms
    generated.webForms = Array.from({ length: 6 }, (_, i) => ({
      id: `webform-${uniquePrefix}-${i}`,
      name: `${['Contact Us', 'Request Demo', 'Newsletter Signup', 'Support Request', 'Quote Request', 'Feedback'][i]} Form`,
      formType: i < 3 ? 'LEAD' : 'CASE',
      description: `Web form for ${['contact inquiries', 'demo requests', 'newsletter', 'support', 'quotes', 'feedback'][i]}`,
      fields: [
        { name: 'fullName', label: 'Full Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'phone', label: 'Phone', type: 'tel', required: false },
        { name: 'message', label: 'Message', type: 'textarea', required: i > 2 },
      ],
      isActive: i !== 5,
      captchaEnabled: true,
      submissionCount: Math.floor(Math.random() * 100) + 10,
    }));

    // 19. Generate Data Import Jobs
    generated.dataImports = Array.from({ length: 5 }, (_, i) => ({
      id: `import-${uniquePrefix}-${i}`,
      name: `${['Lead', 'Contact', 'Account'][i % 3]} Import - Batch ${i + 1}`,
      objectType: ['Lead', 'Contact', 'Account'][i % 3],
      fileName: `import_${i + 1}.csv`,
      fileSize: Math.floor(Math.random() * 500000) + 10000,
      status: ['PENDING', 'PROCESSING', 'COMPLETED', 'COMPLETED', 'FAILED'][i % 5],
      totalRows: Math.floor(Math.random() * 500) + 50,
      processedRows: i % 5 >= 2 ? Math.floor(Math.random() * 500) + 50 : 0,
      successRows: i % 5 >= 2 ? Math.floor(Math.random() * 450) + 40 : 0,
      failedRows: i % 5 >= 2 ? Math.floor(Math.random() * 20) : 0,
      duplicateRows: i % 5 >= 2 ? Math.floor(Math.random() * 30) : 0,
      fieldMapping: { fullName: 'fullName', email: 'email', phone: 'phone' },
      duplicateHandling: ['SKIP', 'UPDATE', 'CREATE_NEW'][i % 3],
      ownerId: userId,
    }));

    // 20. Generate Custom Objects
    const customObjectDefs = [
      { name: 'Project__c', label: 'Project', pluralLabel: 'Projects', fields: ['Name', 'Status', 'Start Date', 'End Date', 'Budget'] },
      { name: 'Certification__c', label: 'Certification', pluralLabel: 'Certifications', fields: ['Name', 'Vendor', 'Expiration Date', 'Level'] },
      { name: 'Training__c', label: 'Training', pluralLabel: 'Trainings', fields: ['Name', 'Type', 'Duration', 'Instructor'] },
    ];

    generated.customObjects = customObjectDefs.map((objDef, i) => ({
      id: `custom-obj-${uniquePrefix}-${i}`,
      name: objDef.name,
      label: objDef.label,
      pluralLabel: objDef.pluralLabel,
      description: `Custom object for tracking ${objDef.pluralLabel.toLowerCase()}`,
      isActive: true,
      fields: objDef.fields.map((fieldName, j) => ({
        name: fieldName.replace(/\s/g, '_') + '__c',
        label: fieldName,
        type: j === 0 ? 'TEXT' : ['TEXT', 'DATE', 'NUMBER', 'PICKLIST'][j % 4],
        required: j === 0,
        order: j,
      })),
      records: Array.from({ length: 5 }, (_, k) => ({
        name: `${objDef.label} Record ${k + 1}`,
        data: { description: `Sample ${objDef.label.toLowerCase()} record` },
        ownerId: userId,
      })),
    }));

    // 21. Generate Notes
    generated.notes = Array.from({ length: 15 }, (_, i) => ({
      id: `note-${uniquePrefix}-${i}`,
      title: `Note ${i + 1}`,
      content: `This is a note about ${['the meeting', 'the call', 'the proposal', 'the demo', 'the contract'][i % 5]}`,
      parentType: ['Lead', 'Contact', 'Opportunity', 'Case', 'Account'][i % 5],
      parentId: [
        generated.leads[i % generated.leads.length].id,
        generated.contacts[i % generated.contacts.length].id,
        generated.opportunities[i % generated.opportunities.length].id,
        generated.cases[i % generated.cases.length].id,
        generated.clientCompanies[i % generated.clientCompanies.length].id
      ][i % 5],
      createdById: userId,
    }));

    // 22. Generate Email Templates
    const templateNames = ['Welcome Email', 'Follow-up', 'Proposal Sent', 'Meeting Confirmation', 'Thank You'];
    generated.emailTemplates = templateNames.map((name, i) => ({
      id: `template-${uniquePrefix}-${i}`,
      name,
      subject: `${name} - {{companyName}}`,
      body: `<p>Dear {{firstName}},</p><p>Thank you for your interest in our services.</p><p>Best regards,<br/>The Team</p>`,
      category: ['Sales', 'Marketing', 'Support'][i % 3],
    }));

    // 23. Generate Reports (more comprehensive)
    const reportDefinitions = [
      { name: 'Sales Pipeline Report', objectType: 'Opportunity', format: 'SUMMARY', columns: ['Name', 'Stage', 'Amount', 'Probability', 'Close Date', 'Account', 'Owner'], groupBy: ['Stage'] },
      { name: 'Lead Conversion Analysis', objectType: 'Lead', format: 'SUMMARY', columns: ['Full Name', 'Company', 'Status', 'Lead Source', 'Created Date', 'Owner'], groupBy: ['Status'] },
      { name: 'Open Cases by Priority', objectType: 'Case', format: 'SUMMARY', columns: ['Case Number', 'Subject', 'Status', 'Priority', 'Contact', 'Account', 'Created Date'], groupBy: ['Priority'] },
      { name: 'Revenue Forecast', objectType: 'Opportunity', format: 'MATRIX', columns: ['Name', 'Amount', 'Stage', 'Close Date', 'Account'], groupBy: ['Stage', 'Close Date'] },
      { name: 'Task Activity Summary', objectType: 'Task', format: 'TABULAR', columns: ['Subject', 'Status', 'Priority', 'Due Date', 'Assigned To'], groupBy: [] },
      { name: 'Campaign Performance', objectType: 'Campaign', format: 'SUMMARY', columns: ['Name', 'Status', 'Type', 'Start Date', 'End Date', 'Expected Revenue'], groupBy: ['Status'] },
      { name: 'Contract Expiration Report', objectType: 'Contract', format: 'TABULAR', columns: ['Contract Number', 'Account', 'Status', 'Start Date', 'End Date', 'Value'], groupBy: [] },
      { name: 'Invoice Aging Report', objectType: 'Invoice', format: 'SUMMARY', columns: ['Invoice Number', 'Account', 'Status', 'Invoice Date', 'Due Date', 'Total Amount'], groupBy: ['Status'] },
      { name: 'Accounts by Industry', objectType: 'Account', format: 'SUMMARY', columns: ['Name', 'Industry', 'Type', 'Phone', 'Created Date'], groupBy: ['Industry'] },
      { name: 'Contact List', objectType: 'Contact', format: 'TABULAR', columns: ['First Name', 'Last Name', 'Email', 'Phone', 'Title', 'Account'], groupBy: [] },
    ];
    generated.reports = reportDefinitions.map((report, i) => ({
      id: `report-${uniquePrefix}-${i}`,
      name: report.name,
      description: `${report.name} - Auto-generated report for ${report.objectType} analysis`,
      format: report.format,
      objectType: report.objectType,
      columns: report.columns,
      filters: {},
      groupBy: report.groupBy,
      isPublic: i % 2 === 0,
      ownerId: userId,
    }));

    // 24. Generate Workflow Rules
    generated.workflowRules = Array.from({ length: 5 }, (_, i) => ({
      id: `workflow-${uniquePrefix}-${i}`,
      name: `${['Lead', 'Opportunity', 'Case', 'Contact', 'Task'][i]} Automation ${i + 1}`,
      description: `Automated workflow for ${['leads', 'opportunities', 'cases', 'contacts', 'tasks'][i]}`,
      objectType: ['Lead', 'Opportunity', 'Case', 'Contact', 'Task'][i],
      triggerType: ['record_created', 'field_update', 'record_created'][i % 3],
      conditions: { status: 'NEW' },
      actions: [{ type: 'send_email', template: 'welcome' }, { type: 'create_task', subject: 'Follow up' }],
      isActive: i !== 4,
      priority: i,
    }));

    // 25. Generate Lead Activities
    generated.leadActivities = Array.from({ length: 30 }, (_, i) => ({
      id: `activity-${uniquePrefix}-${i}`,
      leadId: generated.leads[i % generated.leads.length].id,
      type: ['EMAIL', 'CALL', 'LINKEDIN', 'MEETING', 'NOTE'][i % 5],
      content: `${['Sent email', 'Made call', 'LinkedIn message', 'Had meeting', 'Added note'][i % 5]} - ${i + 1}`,
      userId: userId,
    }));

    // 26. Generate Roles (hierarchical structure)
    const roleData = [
      { name: 'ceo', label: 'CEO', parentIndex: null, allowForecast: true },
      { name: 'vp_sales', label: 'VP of Sales', parentIndex: 0, allowForecast: true },
      { name: 'vp_service', label: 'VP of Service', parentIndex: 0, allowForecast: false },
      { name: 'sales_manager_east', label: 'Sales Manager - East', parentIndex: 1, allowForecast: true },
      { name: 'sales_manager_west', label: 'Sales Manager - West', parentIndex: 1, allowForecast: true },
      { name: 'service_manager', label: 'Service Manager', parentIndex: 2, allowForecast: false },
      { name: 'sales_rep_east', label: 'Sales Rep - East', parentIndex: 3, allowForecast: true },
      { name: 'sales_rep_west', label: 'Sales Rep - West', parentIndex: 4, allowForecast: true },
      { name: 'service_rep', label: 'Service Representative', parentIndex: 5, allowForecast: false },
      { name: 'partner_manager', label: 'Partner Manager', parentIndex: 1, allowForecast: true },
    ];

    generated.roles = roleData.map((role, i) => ({
      id: `role-${uniquePrefix}-${i}`,
      name: `${role.name}_${uniquePrefix}`,
      label: role.label,
      description: `${role.label} role with appropriate access levels`,
      parentRoleId: role.parentIndex !== null ? `role-${uniquePrefix}-${role.parentIndex}` : null,
      allowForecast: role.allowForecast,
      caseAccessLevel: role.name.includes('service') ? 'READ_WRITE_TRANSFER' : 'PRIVATE',
      opportunityAccessLevel: role.name.includes('sales') || role.name === 'ceo' ? 'READ_WRITE_TRANSFER' : 'READ_ONLY',
      contactAccessLevel: 'CONTROLLED_BY_PARENT',
    }));

    // 27. Generate Permission Sets
    const permissionSetData = [
      {
        name: 'sales_cloud_user',
        label: 'Sales Cloud User',
        description: 'Full access to Sales Cloud features including Leads, Opportunities, and Quotes',
        permissions: {
          objects: {
            Lead: { read: true, create: true, edit: true, delete: true, viewAll: false, modifyAll: false },
            Opportunity: { read: true, create: true, edit: true, delete: true, viewAll: false, modifyAll: false },
            Quote: { read: true, create: true, edit: true, delete: false, viewAll: false, modifyAll: false },
            Contact: { read: true, create: true, edit: true, delete: false, viewAll: false, modifyAll: false },
            Account: { read: true, create: true, edit: true, delete: false, viewAll: false, modifyAll: false },
          },
          features: ['forecasting', 'opportunity_teams', 'quote_creation'],
        },
      },
      {
        name: 'service_cloud_user',
        label: 'Service Cloud User',
        description: 'Full access to Service Cloud features including Cases and Knowledge',
        permissions: {
          objects: {
            Case: { read: true, create: true, edit: true, delete: true, viewAll: false, modifyAll: false },
            KnowledgeArticle: { read: true, create: true, edit: true, delete: false, viewAll: true, modifyAll: false },
            Entitlement: { read: true, create: false, edit: false, delete: false, viewAll: false, modifyAll: false },
            Contact: { read: true, create: true, edit: true, delete: false, viewAll: false, modifyAll: false },
          },
          features: ['case_escalation', 'knowledge_management', 'omnichannel'],
        },
      },
      {
        name: 'marketing_user',
        label: 'Marketing User',
        description: 'Access to Marketing features including Campaigns and Mass Email',
        permissions: {
          objects: {
            Campaign: { read: true, create: true, edit: true, delete: true, viewAll: true, modifyAll: false },
            Lead: { read: true, create: true, edit: true, delete: false, viewAll: true, modifyAll: false },
            MassEmailJob: { read: true, create: true, edit: true, delete: true, viewAll: true, modifyAll: false },
            EmailTemplate: { read: true, create: true, edit: true, delete: true, viewAll: true, modifyAll: false },
          },
          features: ['mass_email', 'campaign_management', 'email_templates'],
        },
      },
      {
        name: 'report_builder',
        label: 'Report Builder',
        description: 'Create and manage custom reports and dashboards',
        permissions: {
          objects: {
            Report: { read: true, create: true, edit: true, delete: true, viewAll: false, modifyAll: false },
          },
          features: ['create_reports', 'export_reports', 'schedule_reports'],
        },
      },
      {
        name: 'data_admin',
        label: 'Data Administrator',
        description: 'Manage data imports, exports, and custom objects',
        permissions: {
          objects: {
            DataImport: { read: true, create: true, edit: true, delete: true, viewAll: true, modifyAll: true },
            CustomObject: { read: true, create: true, edit: true, delete: true, viewAll: true, modifyAll: true },
          },
          features: ['data_import', 'data_export', 'custom_objects', 'field_management'],
        },
      },
      {
        name: 'contract_manager',
        label: 'Contract Manager',
        description: 'Manage contracts, orders, and invoices',
        permissions: {
          objects: {
            Contract: { read: true, create: true, edit: true, delete: false, viewAll: true, modifyAll: false },
            Order: { read: true, create: true, edit: true, delete: false, viewAll: true, modifyAll: false },
            Invoice: { read: true, create: true, edit: true, delete: false, viewAll: true, modifyAll: false },
            Quote: { read: true, create: false, edit: false, delete: false, viewAll: true, modifyAll: false },
          },
          features: ['contract_activation', 'order_management', 'invoice_management'],
        },
      },
      {
        name: 'system_admin',
        label: 'System Administrator',
        description: 'Full system access with all permissions',
        permissions: {
          objects: {
            all: { read: true, create: true, edit: true, delete: true, viewAll: true, modifyAll: true },
          },
          features: ['all'],
          system: ['manage_users', 'manage_roles', 'manage_permissions', 'view_setup', 'customize_application'],
        },
      },
    ];

    generated.permissionSets = permissionSetData.map((ps, i) => ({
      id: `permission-set-${uniquePrefix}-${i}`,
      name: `${ps.name}_${uniquePrefix}`,
      label: ps.label,
      description: ps.description,
      isCustom: true,
      permissions: ps.permissions,
    }));

    // 28. Generate Sharing Rules
    const sharingRuleData = [
      {
        name: 'Sales Managers See All Opportunities',
        objectType: 'Opportunity',
        description: 'Sales managers can view all opportunities in their region',
        sharedFromType: 'ROLE',
        sharedToType: 'ROLE',
        sharedFromIndex: 3, // Sales Manager East
        sharedToIndex: 4, // Sales Manager West
        accessLevel: 'READ',
      },
      {
        name: 'Service Team Case Access',
        objectType: 'Case',
        description: 'All service team members can edit cases',
        sharedFromType: 'ROLE',
        sharedToType: 'ROLE',
        sharedFromIndex: 5, // Service Manager
        sharedToIndex: 8, // Service Rep
        accessLevel: 'EDIT',
      },
      {
        name: 'Executive Full Access',
        objectType: 'Account',
        description: 'Executives have full access to all accounts',
        sharedFromType: 'ROLE',
        sharedToType: 'ROLE',
        sharedFromIndex: 0, // CEO
        sharedToIndex: 1, // VP Sales
        accessLevel: 'EDIT',
      },
      {
        name: 'Partner Manager Lead Access',
        objectType: 'Lead',
        description: 'Partner managers can view leads from partners',
        sharedFromType: 'ROLE',
        sharedToType: 'ROLE',
        sharedFromIndex: 9, // Partner Manager
        sharedToIndex: 1, // VP Sales
        accessLevel: 'READ',
      },
      {
        name: 'Marketing Campaign Visibility',
        objectType: 'Campaign',
        description: 'All sales roles can view marketing campaigns',
        sharedFromType: 'ROLE',
        sharedToType: 'ROLE',
        sharedFromIndex: 1, // VP Sales
        sharedToIndex: 6, // Sales Rep East
        accessLevel: 'READ',
      },
      {
        name: 'Cross-Region Opportunity Sharing',
        objectType: 'Opportunity',
        description: 'Sales reps can view opportunities across regions',
        sharedFromType: 'ROLE',
        sharedToType: 'ROLE',
        sharedFromIndex: 6, // Sales Rep East
        sharedToIndex: 7, // Sales Rep West
        accessLevel: 'READ',
      },
      {
        name: 'Contract Read Access',
        objectType: 'Contract',
        description: 'Service team can view contracts for entitlement verification',
        sharedFromType: 'ROLE',
        sharedToType: 'ROLE',
        sharedFromIndex: 1, // VP Sales
        sharedToIndex: 5, // Service Manager
        accessLevel: 'READ',
      },
      {
        name: 'Knowledge Article Public Access',
        objectType: 'KnowledgeArticle',
        description: 'All users can read published knowledge articles',
        sharedFromType: 'ROLE',
        sharedToType: 'ROLE',
        sharedFromIndex: 0, // CEO (top level)
        sharedToIndex: 8, // Service Rep
        accessLevel: 'READ',
        criteria: { status: 'PUBLISHED', isPublic: true },
      },
    ];

    generated.sharingRules = sharingRuleData.map((rule, i) => ({
      id: `sharing-rule-${uniquePrefix}-${i}`,
      name: rule.name,
      objectType: rule.objectType,
      description: rule.description,
      sharedFrom: generated.roles[rule.sharedFromIndex].id,
      sharedFromType: rule.sharedFromType,
      sharedTo: generated.roles[rule.sharedToIndex].id,
      sharedToType: rule.sharedToType,
      accessLevel: rule.accessLevel,
      criteria: rule.criteria || null,
      isActive: true,
    }));

    // Calculate totals
    const created: Record<string, number> = {};
    let totalRecords = 0;
    for (const [key, value] of Object.entries(generated)) {
      created[key] = value.length;
      totalRecords += value.length;
    }

    return NextResponse.json({
      success: true,
      message: 'Demo data generated successfully (NOT inserted into database)',
      totalRecords,
      created,
      data: generated,
    });
  } catch (error: any) {
    console.error('Generate demo data error:', error);
    return NextResponse.json(
      { error: 'Failed to generate demo data', details: error.message },
      { status: 500 }
    );
  }
}
