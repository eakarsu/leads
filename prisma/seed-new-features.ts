import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function main() {
  console.log('🌱 Seeding new CRM features (Notes, Attachments, Contact Roles)...');

  // Get existing data to reference
  const users = await prisma.user.findMany({ take: 5 });
  const contacts = await prisma.contact.findMany({ take: 20 });
  const leads = await prisma.lead.findMany({ take: 20 });
  const opportunities = await prisma.opportunity.findMany({ take: 20 });

  if (users.length === 0) {
    console.log('❌ No users found. Please run the main seed file first.');
    return;
  }

  console.log(`📊 Found ${users.length} users, ${contacts.length} contacts, ${leads.length} leads, ${opportunities.length} opportunities`);

  // Seed Notes for Contacts
  console.log('📝 Creating notes for contacts...');
  const contactNoteTemplates = [
    'Had a great conversation about their current challenges. They mentioned budget constraints for Q1.',
    'Follow-up meeting scheduled for next Tuesday at 2 PM.',
    'Decision maker confirmed. Moving forward with proposal.',
    'Sent product demo video. Awaiting feedback.',
    'Contact expressed interest in enterprise plan.',
    'Discussed implementation timeline. They prefer Q2 start date.',
    'Key concerns: integration with existing CRM and data migration.',
    'Positive feedback on pricing. Requested custom quote.',
    'Introduced to technical team. Setting up technical evaluation.',
    'Annual contract preferred. Willing to commit for 2 years.',
  ];

  let noteCount = 0;
  for (const contact of contacts.slice(0, 15)) {
    const numNotes = Math.floor(Math.random() * 4) + 1; // 1-4 notes per contact
    for (let i = 0; i < numNotes; i++) {
      await prisma.note.create({
        data: {
          content: contactNoteTemplates[Math.floor(Math.random() * contactNoteTemplates.length)],
          createdBy: users[Math.floor(Math.random() * users.length)].id,
          contactId: contact.id,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        },
      });
      noteCount++;
    }
  }
  console.log(`✅ Created ${noteCount} notes for contacts`);

  // Seed Notes for Leads
  console.log('📝 Creating notes for leads...');
  const leadNoteTemplates = [
    'Initial outreach via LinkedIn. Connection request accepted.',
    'Left voicemail. Waiting for callback.',
    'Email opened but no response yet. Will follow up in 3 days.',
    'Gatekeeper said to email proposal. Sent detailed deck.',
    'Qualified lead. Budget: $50K-100K. Timeline: Q2.',
    'Not interested at this time. Set reminder to follow up in 6 months.',
    'Requested case studies for similar industry clients.',
    'Competitor mention: Currently using Salesforce. Contract expires in 4 months.',
    'Pain points: Manual data entry, lack of automation, poor reporting.',
    'Warm lead. Previous customer at different company.',
  ];

  noteCount = 0;
  for (const lead of leads.slice(0, 15)) {
    const numNotes = Math.floor(Math.random() * 3) + 1; // 1-3 notes per lead
    for (let i = 0; i < numNotes; i++) {
      await prisma.note.create({
        data: {
          content: leadNoteTemplates[Math.floor(Math.random() * leadNoteTemplates.length)],
          createdBy: users[Math.floor(Math.random() * users.length)].id,
          leadId: lead.id,
          createdAt: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000), // Random date within last 20 days
        },
      });
      noteCount++;
    }
  }
  console.log(`✅ Created ${noteCount} notes for leads`);

  // Seed Notes for Opportunities
  console.log('📝 Creating notes for opportunities...');
  const oppNoteTemplates = [
    'Proposal submitted. Waiting for board approval.',
    'Negotiating on payment terms. They want Net 60 instead of Net 30.',
    'Champion identified: CTO Sarah Johnson. Very supportive.',
    'Blocker: CFO concerned about ROI. Preparing ROI analysis.',
    'Competitor Intel: Also evaluating HubSpot and Pipedrive.',
    'Legal review in progress. Contract redlines received.',
    'Demo went extremely well. Technical team impressed with features.',
    'Pricing approved. Moving to contract stage.',
    'Lost to competitor due to price. They went with lower-cost option.',
    'Won! Contract signed. Implementation kickoff next week.',
    'Verbal commitment received. Waiting for PO.',
    'Requested 2-week trial. Trial license created.',
  ];

  noteCount = 0;
  for (const opp of opportunities.slice(0, 15)) {
    const numNotes = Math.floor(Math.random() * 5) + 2; // 2-6 notes per opportunity
    for (let i = 0; i < numNotes; i++) {
      await prisma.note.create({
        data: {
          content: oppNoteTemplates[Math.floor(Math.random() * oppNoteTemplates.length)],
          createdBy: users[Math.floor(Math.random() * users.length)].id,
          opportunityId: opp.id,
          createdAt: new Date(Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000), // Random date within last 45 days
        },
      });
      noteCount++;
    }
  }
  console.log(`✅ Created ${noteCount} notes for opportunities`);

  // Seed Attachments
  console.log('📎 Creating sample attachments...');
  const attachmentTemplates = [
    { fileName: 'proposal_v2.pdf', fileType: 'application/pdf', fileSize: 245678 },
    { fileName: 'contract_draft.docx', fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', fileSize: 98234 },
    { fileName: 'product_demo.mp4', fileType: 'video/mp4', fileSize: 15678234 },
    { fileName: 'pricing_quote.xlsx', fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fileSize: 45123 },
    { fileName: 'signed_nda.pdf', fileType: 'application/pdf', fileSize: 123456 },
    { fileName: 'technical_specs.pdf', fileType: 'application/pdf', fileSize: 567890 },
    { fileName: 'case_study_enterprise.pdf', fileType: 'application/pdf', fileSize: 345678 },
    { fileName: 'implementation_plan.docx', fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', fileSize: 78901 },
    { fileName: 'roi_analysis.xlsx', fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fileSize: 56789 },
    { fileName: 'business_card.jpg', fileType: 'image/jpeg', fileSize: 234567 },
  ];

  let attachmentCount = 0;

  // Attachments for contacts
  for (const contact of contacts.slice(0, 10)) {
    const numAttachments = Math.floor(Math.random() * 3) + 1; // 1-3 attachments
    for (let i = 0; i < numAttachments; i++) {
      const template = attachmentTemplates[Math.floor(Math.random() * attachmentTemplates.length)];
      await prisma.attachment.create({
        data: {
          fileName: template.fileName,
          fileType: template.fileType,
          fileSize: template.fileSize,
          fileUrl: `/uploads/contacts/${contact.id}/${template.fileName}`,
          uploadedBy: users[Math.floor(Math.random() * users.length)].id,
          contactId: contact.id,
          createdAt: new Date(Date.now() - Math.random() * 40 * 24 * 60 * 60 * 1000),
        },
      });
      attachmentCount++;
    }
  }

  // Attachments for opportunities
  for (const opp of opportunities.slice(0, 12)) {
    const numAttachments = Math.floor(Math.random() * 4) + 1; // 1-4 attachments
    for (let i = 0; i < numAttachments; i++) {
      const template = attachmentTemplates[Math.floor(Math.random() * attachmentTemplates.length)];
      await prisma.attachment.create({
        data: {
          fileName: template.fileName,
          fileType: template.fileType,
          fileSize: template.fileSize,
          fileUrl: `/uploads/opportunities/${opp.id}/${template.fileName}`,
          uploadedBy: users[Math.floor(Math.random() * users.length)].id,
          opportunityId: opp.id,
          createdAt: new Date(Date.now() - Math.random() * 35 * 24 * 60 * 60 * 1000),
        },
      });
      attachmentCount++;
    }
  }

  console.log(`✅ Created ${attachmentCount} attachments`);

  // Seed Opportunity Contact Roles
  console.log('👥 Creating opportunity contact roles...');
  const contactRoles = [
    'DECISION_MAKER',
    'INFLUENCER',
    'ECONOMIC_BUYER',
    'TECHNICAL_BUYER',
    'CHAMPION',
    'EVALUATOR',
    'END_USER',
  ] as const;

  let roleCount = 0;

  for (const opp of opportunities.slice(0, 15)) {
    // Get contacts from the same client
    const clientContacts = await prisma.contact.findMany({
      where: { clientId: opp.clientId },
      take: 5,
    });

    if (clientContacts.length === 0) continue;

    // Add 2-4 contacts to each opportunity with different roles
    const numContactsForOpp = Math.min(
      Math.floor(Math.random() * 3) + 2, // 2-4 contacts
      clientContacts.length
    );

    const usedRoles = new Set<string>();
    const usedContacts = new Set<string>();

    for (let i = 0; i < numContactsForOpp; i++) {
      // Pick a random contact that hasn't been used yet
      let contact;
      let attempts = 0;
      do {
        contact = clientContacts[Math.floor(Math.random() * clientContacts.length)];
        attempts++;
      } while (usedContacts.has(contact.id) && attempts < 10);

      if (usedContacts.has(contact.id)) continue;
      usedContacts.add(contact.id);

      // Pick a random role that hasn't been used yet
      let role;
      let roleAttempts = 0;
      do {
        role = contactRoles[Math.floor(Math.random() * contactRoles.length)];
        roleAttempts++;
      } while (usedRoles.has(role) && roleAttempts < 10);

      usedRoles.add(role);

      // First contact is primary
      const isPrimary = i === 0;

      try {
        await prisma.opportunityContactRole.create({
          data: {
            opportunityId: opp.id,
            contactId: contact.id,
            role: role,
            isPrimary: isPrimary,
          },
        });
        roleCount++;
      } catch (error) {
        // Skip if duplicate
        console.log(`⚠️  Skipping duplicate contact role for opportunity ${opp.id}`);
      }
    }
  }

  console.log(`✅ Created ${roleCount} opportunity contact roles`);

  // Summary
  console.log('\n📊 Seeding Summary:');
  const totalNotes = await prisma.note.count();
  const totalAttachments = await prisma.attachment.count();
  const totalContactRoles = await prisma.opportunityContactRole.count();

  console.log(`   - Notes: ${totalNotes}`);
  console.log(`   - Attachments: ${totalAttachments}`);
  console.log(`   - Opportunity Contact Roles: ${totalContactRoles}`);
  console.log('\n✅ New features seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding new features:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
