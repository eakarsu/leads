import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EmailStatus } from '@prisma/client';

export async function GET() {
  try {
    console.log('Starting email data seeding...');

    // Get all contacts and users
    const contacts = await prisma.contact.findMany({
      include: {
        client: true,
      },
      take: 50, // Use first 50 contacts
    });

    const users = await prisma.user.findMany();

    if (contacts.length === 0 || users.length === 0) {
      return NextResponse.json({ error: 'No contacts or users found' }, { status: 400 });
    }

    // Get email templates
    const templates = await prisma.emailTemplate.findMany();

    let emailsCreated = 0;

    // Email subject lines for different statuses
    const emailSubjects = {
      SENT: [
        'Follow-up on our discussion',
        'Proposal for your review',
        'Next steps for {company}',
        'Quick question about your project',
        'Meeting recap and action items',
        'Important update regarding your account',
        'Special offer for {company}',
        'Thank you for your time',
      ],
      DELIVERED: [
        'Your quote is ready',
        'Invitation to product demo',
        'Case study you might find interesting',
        'Answers to your questions',
        'Resources for your team',
      ],
      OPENED: [
        'Following up on my previous email',
        'Did you have a chance to review?',
        'Checking in on {company}',
        'Quick update for you',
      ],
      CLICKED: [
        'Exclusive offer inside',
        'View your personalized proposal',
        'See what others are saying',
        'Download your free guide',
      ],
      BOUNCED: [
        'Important: Email delivery issue',
        'Please update your contact information',
      ],
      FAILED: [
        'Technical issue with your email',
      ],
    };

    const emailBodies = [
      'Hi {name},\n\nI wanted to follow up on our recent conversation about {company}. I believe we have some great solutions that could benefit your team.\n\nWould you be available for a quick 15-minute call this week?\n\nBest regards',
      'Hello {name},\n\nThank you for taking the time to speak with me yesterday. As promised, I\'m sending over the information we discussed.\n\nPlease let me know if you have any questions.\n\nLooking forward to hearing from you.',
      'Dear {name},\n\nI hope this email finds you well. I wanted to reach out regarding an exciting opportunity for {company}.\n\nOur latest offering could help you achieve your goals faster. Can we schedule a demo?\n\nBest',
      'Hi {name},\n\nJust checking in to see if you had any questions about the proposal I sent last week.\n\nI\'m happy to jump on a call to discuss further.\n\nThanks',
      'Hello {name},\n\nI came across {company} and was impressed by your work. I think there might be a good fit for collaboration.\n\nWould love to connect and explore possibilities.\n\nCheers',
    ];

    // Create emails for each contact with different statuses
    for (const contact of contacts) {
      const user = users[Math.floor(Math.random() * users.length)];
      const numEmails = 2 + Math.floor(Math.random() * 4); // 2-5 emails per contact

      for (let i = 0; i < numEmails; i++) {
        // Distribute statuses: 40% SENT, 25% DELIVERED, 20% OPENED, 10% CLICKED, 3% BOUNCED, 2% FAILED
        const rand = Math.random();
        let status: EmailStatus;
        let subjects: string[];

        if (rand < 0.40) {
          status = 'SENT';
          subjects = emailSubjects.SENT;
        } else if (rand < 0.65) {
          status = 'DELIVERED';
          subjects = emailSubjects.DELIVERED;
        } else if (rand < 0.85) {
          status = 'OPENED';
          subjects = emailSubjects.OPENED;
        } else if (rand < 0.95) {
          status = 'CLICKED';
          subjects = emailSubjects.CLICKED;
        } else if (rand < 0.98) {
          status = 'BOUNCED';
          subjects = emailSubjects.BOUNCED;
        } else {
          status = 'FAILED';
          subjects = emailSubjects.FAILED;
        }

        const subject = subjects[Math.floor(Math.random() * subjects.length)]
          .replace('{company}', contact.client.name);

        const body = emailBodies[Math.floor(Math.random() * emailBodies.length)]
          .replace('{name}', contact.firstName)
          .replace('{company}', contact.client.name);

        // Randomly assign a template (or no template)
        const template = Math.random() > 0.5 && templates.length > 0
          ? templates[Math.floor(Math.random() * templates.length)]
          : null;

        // Create timestamps
        const sentAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Last 30 days
        let deliveredAt = null;
        let openedAt = null;
        let clickedAt = null;

        if (['DELIVERED', 'OPENED', 'CLICKED'].includes(status)) {
          deliveredAt = new Date(sentAt.getTime() + Math.random() * 60 * 60 * 1000); // Within 1 hour
        }

        if (['OPENED', 'CLICKED'].includes(status)) {
          openedAt = new Date(deliveredAt!.getTime() + Math.random() * 24 * 60 * 60 * 1000); // Within 24 hours
          const openCount = 1 + Math.floor(Math.random() * 3); // 1-3 opens

          if (status === 'CLICKED') {
            clickedAt = new Date(openedAt.getTime() + Math.random() * 60 * 60 * 1000); // Within 1 hour of opening
          }

          await prisma.email.create({
            data: {
              subject,
              body,
              status,
              sentAt,
              openedAt,
              clickedAt,
              senderId: user.id,
              toAddress: contact.email || `${contact.firstName.toLowerCase()}@${contact.client.name.replace(/\s+/g, '').toLowerCase()}.com`,
              contactId: contact.id,
              templateId: template?.id,
            },
          });
        } else {
          await prisma.email.create({
            data: {
              subject,
              body,
              status,
              sentAt: status !== 'DRAFT' ? sentAt : null,
              senderId: user.id,
              toAddress: contact.email || `${contact.firstName.toLowerCase()}@${contact.client.name.replace(/\s+/g, '').toLowerCase()}.com`,
              contactId: contact.id,
              templateId: template?.id,
            },
          });
        }

        emailsCreated++;
      }
    }

    // Create some draft emails (10-15)
    const draftCount = 10 + Math.floor(Math.random() * 6);
    for (let i = 0; i < draftCount; i++) {
      const contact = contacts[Math.floor(Math.random() * contacts.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      const template = templates[Math.floor(Math.random() * templates.length)];

      await prisma.email.create({
        data: {
          subject: `Draft: ${emailSubjects.SENT[Math.floor(Math.random() * emailSubjects.SENT.length)].replace('{company}', contact.client.name)}`,
          body: `[Draft] ${emailBodies[Math.floor(Math.random() * emailBodies.length)].replace('{name}', contact.firstName).replace('{company}', contact.client.name)}`,
          status: 'DRAFT',
          senderId: user.id,
          toAddress: contact.email || `${contact.firstName.toLowerCase()}@${contact.client.name.replace(/\s+/g, '').toLowerCase()}.com`,
          contactId: contact.id,
          templateId: template?.id,
        },
      });

      emailsCreated++;
    }

    console.log('Email seeding completed!');

    return NextResponse.json({
      success: true,
      message: 'Email data seeded successfully',
      summary: {
        emailsCreated,
        contactsProcessed: contacts.length,
        templatesUsed: templates.length,
      },
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
