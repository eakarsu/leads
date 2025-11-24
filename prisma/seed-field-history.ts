import { prisma } from '../lib/prisma';

async function main() {
  console.log('🔍 Seeding field history data...');

  // Get some existing leads and users
  const leads = await prisma.lead.findMany({
    take: 5,
  });

  const users = await prisma.user.findMany({
    take: 3,
  });

  if (leads.length === 0 || users.length === 0) {
    console.log('⚠️  No leads or users found. Please run main seed first.');
    return;
  }

  const fieldChanges = [];

  // Create realistic field history for leads
  for (const lead of leads) {
    const user = users[Math.floor(Math.random() * users.length)];

    // Status changes over time
    const statusProgression = ['NEW', 'CONTACTED', 'QUALIFIED'];
    for (let i = 0; i < statusProgression.length - 1; i++) {
      fieldChanges.push({
        objectType: 'Lead',
        objectId: lead.id,
        fieldName: 'status',
        oldValue: statusProgression[i],
        newValue: statusProgression[i + 1],
        changedBy: user.id,
        changedAt: new Date(Date.now() - (statusProgression.length - i) * 3 * 24 * 60 * 60 * 1000),
      });
    }

    // Qualification score improvements
    const scores = [15, 35, lead.qualificationScore];
    for (let i = 0; i < scores.length - 1; i++) {
      fieldChanges.push({
        objectType: 'Lead',
        objectId: lead.id,
        fieldName: 'qualificationScore',
        oldValue: scores[i].toString(),
        newValue: scores[i + 1].toString(),
        changedBy: user.id,
        changedAt: new Date(Date.now() - (scores.length - i) * 2 * 24 * 60 * 60 * 1000),
      });
    }

    // Phone number added
    if (lead.phone) {
      fieldChanges.push({
        objectType: 'Lead',
        objectId: lead.id,
        fieldName: 'phone',
        oldValue: null,
        newValue: lead.phone,
        changedBy: user.id,
        changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      });
    }

    // LinkedIn URL added
    if (lead.linkedinUrl) {
      fieldChanges.push({
        objectType: 'Lead',
        objectId: lead.id,
        fieldName: 'linkedinUrl',
        oldValue: null,
        newValue: lead.linkedinUrl,
        changedBy: user.id,
        changedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      });
    }

    // Company updated
    if (lead.company) {
      fieldChanges.push({
        objectType: 'Lead',
        objectId: lead.id,
        fieldName: 'company',
        oldValue: 'Unknown Company',
        newValue: lead.company,
        changedBy: user.id,
        changedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      });
    }

    // Title updated
    if (lead.title) {
      fieldChanges.push({
        objectType: 'Lead',
        objectId: lead.id,
        fieldName: 'title',
        oldValue: null,
        newValue: lead.title,
        changedBy: user.id,
        changedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      });
    }

    // Notes added
    if (lead.notes) {
      fieldChanges.push({
        objectType: 'Lead',
        objectId: lead.id,
        fieldName: 'notes',
        oldValue: null,
        newValue: lead.notes,
        changedBy: user.id,
        changedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      });
    }
  }

  // Create all field history records
  console.log(`Creating ${fieldChanges.length} field history records...`);
  await prisma.fieldHistory.createMany({
    data: fieldChanges,
  });

  console.log(`✅ Successfully created ${fieldChanges.length} field history records`);

  // Show summary by object
  const summary = await prisma.fieldHistory.groupBy({
    by: ['objectType', 'fieldName'],
    _count: true,
  });

  console.log('\n📊 Field History Summary:');
  for (const item of summary) {
    console.log(`   ${item.objectType}.${item.fieldName}: ${item._count} changes`);
  }

  console.log('\n✅ Field history seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding field history:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
