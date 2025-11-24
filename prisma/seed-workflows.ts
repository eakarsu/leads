import { prisma } from '../lib/prisma';

async function main() {
  console.log('🔄 Seeding workflow automation rules...');

  const workflows = [
    {
      name: 'Auto-qualify High Score Leads',
      description: 'Automatically mark leads as QUALIFIED when score reaches 70+',
      objectType: 'Lead',
      triggerType: 'field_update',
      conditions: {
        field: 'qualificationScore',
        operator: 'greater_than_or_equal',
        value: 70,
      },
      actions: [
        {
          type: 'update_field',
          field: 'status',
          value: 'QUALIFIED',
        },
        {
          type: 'create_task',
          subject: 'Follow up with hot lead',
          priority: 'HIGH',
          dueInDays: 1,
        },
      ],
      isActive: true,
    },
    {
      name: 'New Lead Welcome Email',
      description: 'Send welcome email when new lead is created',
      objectType: 'Lead',
      triggerType: 'record_created',
      conditions: {
        field: 'leadSource',
        operator: 'equals',
        value: 'AGENCY',
      },
      actions: [
        {
          type: 'send_email',
          template: 'new_lead_welcome',
          to: 'lead.email',
        },
        {
          type: 'create_activity',
          activityType: 'EMAIL',
          content: 'Welcome email sent to new lead',
        },
      ],
      isActive: true,
    },
    {
      name: 'Stale Lead Alert',
      description: 'Alert when lead has not been contacted in 7 days',
      objectType: 'Lead',
      triggerType: 'time_based',
      conditions: {
        field: 'status',
        operator: 'equals',
        value: 'NEW',
        timeCondition: {
          field: 'createdAt',
          operator: 'older_than_days',
          value: 7,
        },
      },
      actions: [
        {
          type: 'send_notification',
          recipient: 'owner',
          message: 'Lead has not been contacted in 7 days',
        },
        {
          type: 'update_field',
          field: 'status',
          value: 'CONTACTED',
        },
      ],
      isActive: true,
    },
    {
      name: 'Unqualified Lead Routing',
      description: 'Move low-scoring leads to unqualified status',
      objectType: 'Lead',
      triggerType: 'field_update',
      conditions: {
        field: 'qualificationScore',
        operator: 'less_than',
        value: 20,
      },
      actions: [
        {
          type: 'update_field',
          field: 'status',
          value: 'UNQUALIFIED',
        },
      ],
      isActive: true,
    },
    {
      name: 'Opportunity Stage Change Notification',
      description: 'Notify team when opportunity moves to Proposal stage',
      objectType: 'Opportunity',
      triggerType: 'field_update',
      conditions: {
        field: 'stage',
        operator: 'equals',
        value: 'PROPOSAL',
      },
      actions: [
        {
          type: 'send_notification',
          recipient: 'owner',
          message: 'Opportunity reached Proposal stage',
        },
        {
          type: 'create_task',
          subject: 'Prepare proposal document',
          priority: 'HIGH',
          dueInDays: 2,
        },
      ],
      isActive: true,
    },
  ];

  console.log(`Creating ${workflows.length} workflow rules...`);

  for (const workflow of workflows) {
    await prisma.workflowRule.create({
      data: workflow,
    });
  }

  console.log(`✅ Successfully created ${workflows.length} workflow rules`);

  // Show summary
  const summary = await prisma.workflowRule.groupBy({
    by: ['objectType', 'triggerType'],
    _count: true,
  });

  console.log('\n📊 Workflow Summary:');
  for (const item of summary) {
    console.log(`   ${item.objectType} - ${item.triggerType}: ${item._count} workflows`);
  }

  console.log('\n✅ Workflow seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding workflows:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
