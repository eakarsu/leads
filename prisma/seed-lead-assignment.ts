import { prisma } from '../lib/prisma';
import { AssignmentMethod, Prisma } from '@prisma/client';

async function main() {
  console.log('🎯 Seeding lead assignment rules...');

  // Get some existing users
  const users = await prisma.user.findMany({
    take: 5,
  });

  if (users.length === 0) {
    console.log('⚠️  No users found. Please run main seed first.');
    return;
  }

  const assignmentRules = [
    {
      name: 'High-Value Leads - Senior Sales Team',
      description: 'Assign high-scoring leads (70+) to senior sales representatives using round-robin',
      criteria: {
        minQualificationScore: 70,
      },
      assignmentMethod: 'ROUND_ROBIN',
      assignToUserIds: [users[0].id, users[1].id],
      isActive: true,
      priority: 100,
    },
    {
      name: 'Agency Leads - Load Balanced',
      description: 'Distribute agency leads evenly across all sales reps based on current workload',
      criteria: {
        leadSource: 'AGENCY',
      },
      assignmentMethod: 'LOAD_BALANCED',
      assignToUserIds: users.slice(0, 3).map((u) => u.id),
      isActive: true,
      priority: 80,
    },
    {
      name: 'Qualified Leads - Round Robin',
      description: 'Distribute qualified leads using round-robin assignment',
      criteria: {
        status: 'QUALIFIED',
      },
      assignmentMethod: 'ROUND_ROBIN',
      assignToUserIds: users.slice(0, 4).map((u) => u.id),
      isActive: true,
      priority: 60,
    },
    {
      name: 'New Leads - Balanced Distribution',
      description: 'Assign new leads to sales reps with lowest current lead count',
      criteria: {
        status: 'NEW',
      },
      assignmentMethod: 'LOAD_BALANCED',
      assignToUserIds: users.map((u) => u.id),
      isActive: true,
      priority: 40,
    },
    {
      name: 'Low Score Leads - Junior Team',
      description: 'Assign lower-scoring leads (below 30) to junior sales team for nurturing',
      criteria: {
        maxQualificationScore: 30,
      },
      assignmentMethod: 'ROUND_ROBIN',
      assignToUserIds: users.slice(2, 5).map((u) => u.id),
      isActive: true,
      priority: 20,
    },
  ];

  console.log(`Creating ${assignmentRules.length} assignment rules...`);

  for (const rule of assignmentRules) {
    await prisma.leadAssignmentRule.create({
      data: {
        ...rule,
        assignmentMethod: rule.assignmentMethod as AssignmentMethod,
      },
    });
  }

  console.log(`✅ Successfully created ${assignmentRules.length} assignment rules`);

  // Show summary
  const summary = await prisma.leadAssignmentRule.groupBy({
    by: ['assignmentMethod', 'isActive'],
    _count: true,
  });

  console.log('\n📊 Assignment Rules Summary:');
  for (const item of summary) {
    console.log(
      `   ${item.assignmentMethod} (${item.isActive ? 'Active' : 'Inactive'}): ${item._count} rules`
    );
  }

  console.log('\n✅ Lead assignment seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding lead assignment rules:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
