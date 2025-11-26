import { prisma } from '../lib/prisma';
import { EmailStatus, Prisma } from '@prisma/client';

async function main() {
  console.log('📧 Seeding email data...');

  // Get some existing contacts, opportunities, and users
  const contacts = await prisma.contact.findMany({
    take: 5,
  });

  const opportunities = await prisma.opportunity.findMany({
    take: 3,
  });

  const users = await prisma.user.findMany({
    take: 3,
  });

  if (contacts.length === 0 || users.length === 0) {
    console.log('⚠️  No contacts or users found. Please run main seed first.');
    return;
  }

  const emails = [];

  // Welcome emails to contacts
  for (const contact of contacts.slice(0, 3)) {
    const user = users[Math.floor(Math.random() * users.length)];
    emails.push({
      senderId: user.id,
      toAddress: contact.email,
      ccAddress: null,
      bccAddress: null,
      subject: 'Welcome to Our Platform',
      body: `Hi ${contact.firstName},

Thank you for your interest in our services! We're excited to have you on board.

I wanted to personally reach out and introduce myself. I'm ${user.name}, and I'll be your main point of contact.

If you have any questions or would like to schedule a demo, please feel free to reach out.

Best regards,
${user.name}`,
      status: 'SENT',
      sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      contactId: contact.id,
      opportunityId: null,
      templateId: null,
    });
  }

  // Follow-up emails
  for (const contact of contacts.slice(0, 4)) {
    const user = users[Math.floor(Math.random() * users.length)];
    emails.push({
      senderId: user.id,
      toAddress: contact.email,
      ccAddress: null,
      bccAddress: null,
      subject: 'Quick Follow-up',
      body: `Hi ${contact.firstName},

I hope this email finds you well. I wanted to follow up on our previous conversation.

Have you had a chance to review the materials I sent over? I'd love to hear your thoughts and answer any questions you might have.

Would you be available for a quick call this week?

Best,
${user.name}`,
      status: 'SENT',
      sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      contactId: contact.id,
      opportunityId: null,
      templateId: null,
    });
  }

  // Proposal emails for opportunities
  for (const opportunity of opportunities) {
    const user = users[Math.floor(Math.random() * users.length)];
    const contact = contacts.find((c) => c.id === opportunity.contactId);
    if (contact) {
      emails.push({
        senderId: user.id,
        toAddress: contact.email,
        ccAddress: user.email || null,
        bccAddress: null,
        subject: `Proposal for ${opportunity.name}`,
        body: `Hi ${contact.firstName},

Thank you for taking the time to discuss ${opportunity.name} with us.

I'm pleased to attach our proposal for your review. This outlines our recommended solution, timeline, and investment.

Key highlights:
- Implementation timeline: 8-12 weeks
- Dedicated support team
- 24/7 monitoring and maintenance
- ROI projected within 6 months

I'm confident this solution will meet your needs. Please let me know if you'd like to schedule a call to discuss any aspects in detail.

Looking forward to hearing from you!

Best regards,
${user.name}`,
        status: 'SENT',
        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        contactId: contact.id,
        opportunityId: opportunity.id,
        templateId: null,
      });
    }
  }

  // Check-in emails
  for (const contact of contacts.slice(2, 5)) {
    const user = users[Math.floor(Math.random() * users.length)];
    emails.push({
      senderId: user.id,
      toAddress: contact.email,
      ccAddress: null,
      bccAddress: null,
      subject: 'Checking In',
      body: `Hi ${contact.firstName},

I hope you're doing well! I wanted to check in and see how things are going.

Is there anything I can help you with? Any questions about our services or how we might be able to support your goals?

Let me know if you'd like to catch up!

Best,
${user.name}`,
      status: 'SENT',
      sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      contactId: contact.id,
      opportunityId: null,
      templateId: null,
    });
  }

  // Draft email (scheduled)
  const firstContact = contacts[0];
  const firstUser = users[0];
  emails.push({
    senderId: firstUser.id,
    toAddress: firstContact.email,
    ccAddress: null,
    bccAddress: null,
    subject: 'Quarterly Business Review - Q1 2025',
    body: `Hi ${firstContact.firstName},

As we approach the end of Q1, I'd like to schedule our quarterly business review.

This would be a great opportunity to:
- Review progress against our goals
- Discuss any challenges or concerns
- Plan for Q2 initiatives

Please let me know your availability for next week.

Best regards,
${firstUser.name}`,
    status: 'DRAFT',
    sentAt: null,
    contactId: firstContact.id,
    opportunityId: null,
    templateId: null,
  });

  // Meeting confirmation emails
  for (const contact of contacts.slice(1, 3)) {
    const user = users[Math.floor(Math.random() * users.length)];
    emails.push({
      senderId: user.id,
      toAddress: contact.email,
      ccAddress: user.email || null,
      bccAddress: null,
      subject: 'Meeting Confirmation - Tomorrow at 2 PM',
      body: `Hi ${contact.firstName},

This is to confirm our meeting scheduled for tomorrow at 2:00 PM EST.

Meeting Details:
- Date: Tomorrow
- Time: 2:00 PM EST
- Duration: 45 minutes
- Location: Zoom (link will be sent separately)

Agenda:
1. Introduction and overview
2. Demo of our platform
3. Q&A
4. Next steps

Looking forward to speaking with you!

Best,
${user.name}`,
      status: 'SENT',
      sentAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      contactId: contact.id,
      opportunityId: null,
      templateId: null,
    });
  }

  console.log(`Creating ${emails.length} email records...`);
  // Filter out emails with null toAddress and cast to proper type
  const validEmails = emails
    .filter((e) => e.toAddress !== null)
    .map((e) => ({
      ...e,
      toAddress: e.toAddress as string,
      status: e.status as EmailStatus,
    })) as Prisma.EmailCreateManyInput[];
  await prisma.email.createMany({
    data: validEmails,
  });

  console.log(`✅ Successfully created ${emails.length} email records`);

  // Show summary
  const summary = await prisma.email.groupBy({
    by: ['status'],
    _count: true,
  });

  console.log('\n📊 Email Summary:');
  for (const item of summary) {
    console.log(`   ${item.status}: ${item._count} emails`);
  }

  console.log('\n✅ Email seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding emails:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
