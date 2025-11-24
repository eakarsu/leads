import { PrismaClient, Lead, LeadActivity, EnrichmentData } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
});

// Inline scoring logic to avoid module resolution issues
function calculateLeadScore(
  lead: Lead,
  activities: LeadActivity[],
  enrichment: EnrichmentData | null
) {
  const breakdown: { category: string; points: number; reason: string }[] = [];
  let demographic = 0;
  let behavioral = 0;
  let engagement = 0;
  let firmographic = 0;

  // DEMOGRAPHIC SCORING (max 25 points)
  if (lead.title) {
    const titleLower = lead.title.toLowerCase();
    let seniorityScore = 0;
    if (/(ceo|chief executive|president|owner|founder)/i.test(titleLower)) {
      seniorityScore = 15;
    } else if (/(cto|cfo|cmo|coo|chief|vp|vice president|director|head of)/i.test(titleLower)) {
      seniorityScore = 10;
    } else if (/(manager|lead|senior)/i.test(titleLower)) {
      seniorityScore = 5;
    }
    if (seniorityScore > 0) {
      demographic += seniorityScore;
      breakdown.push({
        category: 'DEMOGRAPHIC',
        points: seniorityScore,
        reason: `Job title indicates seniority`,
      });
    }
  }

  if (lead.email && lead.email.includes('@')) {
    const emailDomain = lead.email.split('@')[1];
    const freeProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    if (emailDomain && !freeProviders.includes(emailDomain.toLowerCase())) {
      demographic += 5;
      breakdown.push({ category: 'DEMOGRAPHIC', points: 5, reason: 'Business email address' });
    }
  }

  if (lead.phone) {
    demographic += 3;
    breakdown.push({ category: 'DEMOGRAPHIC', points: 3, reason: 'Phone number provided' });
  }

  if (lead.linkedinUrl) {
    demographic += 2;
    breakdown.push({ category: 'DEMOGRAPHIC', points: 2, reason: 'LinkedIn profile available' });
  }

  // BEHAVIORAL SCORING (max 30 points)
  const recentActivities = activities.filter(
    (a) => new Date().getTime() - new Date(a.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000
  );

  const activityScore = Math.min(recentActivities.length * 3, 15);
  if (activityScore > 0) {
    behavioral += activityScore;
    breakdown.push({
      category: 'BEHAVIORAL',
      points: activityScore,
      reason: `${recentActivities.length} activities in last 30 days`,
    });
  }

  // ENGAGEMENT SCORING (max 25 points)
  const daysSinceCreated = Math.floor(
    (new Date().getTime() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceCreated < 7) {
    engagement += 10;
    breakdown.push({ category: 'ENGAGEMENT', points: 10, reason: 'Recent lead (less than 7 days)' });
  } else if (daysSinceCreated < 30) {
    engagement += 5;
    breakdown.push({ category: 'ENGAGEMENT', points: 5, reason: 'Lead created within 30 days' });
  }

  if (lead.status === 'QUALIFIED') {
    engagement += 10;
    breakdown.push({ category: 'ENGAGEMENT', points: 10, reason: 'Lead is qualified' });
  } else if (lead.status === 'CONTACTED') {
    engagement += 5;
    breakdown.push({ category: 'ENGAGEMENT', points: 5, reason: 'Lead has been contacted' });
  }

  // FIRMOGRAPHIC SCORING (max 20 points)
  if (lead.company) {
    firmographic += 5;
    breakdown.push({ category: 'FIRMOGRAPHIC', points: 5, reason: 'Company information available' });
  }

  if (lead.website) {
    firmographic += 5;
    breakdown.push({ category: 'FIRMOGRAPHIC', points: 5, reason: 'Company website available' });
  }

  const total = demographic + behavioral + engagement + firmographic;

  return {
    demographic,
    behavioral,
    engagement,
    firmographic,
    total,
    breakdown,
  };
}

async function main() {
  console.log('🎯 Calculating and seeding lead scores...');

  // Get all leads with their activities and enrichment data
  const leads = await prisma.lead.findMany({
    include: {
      activities: {
        orderBy: { createdAt: 'desc' },
      },
      enrichmentData: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  console.log(`📊 Found ${leads.length} leads to score`);

  let scoredCount = 0;
  let scoreRecordsCreated = 0;

  for (const lead of leads) {
    try {
      const enrichment = lead.enrichmentData[0] || null;
      const scores = calculateLeadScore(lead, lead.activities, enrichment);

      // Update lead's qualification score
      await prisma.lead.update({
        where: { id: lead.id },
        data: { qualificationScore: scores.total },
      });

      // Create score history records
      const scoreRecords = scores.breakdown.map((item) => ({
        leadId: lead.id,
        score: item.points,
        category: item.category as any,
        reason: item.reason,
        factors: item as any,
      }));

      if (scoreRecords.length > 0) {
        await prisma.leadScore.createMany({
          data: scoreRecords,
        });
        scoreRecordsCreated += scoreRecords.length;
      }

      scoredCount++;
      console.log(`✅ Scored lead: ${lead.fullName} (${scores.total}/100)`);
    } catch (error) {
      console.error(`❌ Error scoring lead ${lead.fullName}:`, error);
    }
  }

  console.log(`\n📊 Scoring Summary:`);
  console.log(`   - Leads scored: ${scoredCount}/${leads.length}`);
  console.log(`   - Score records created: ${scoreRecordsCreated}`);

  // Show score distribution
  const scoreDistribution = await prisma.lead.groupBy({
    by: ['qualificationScore'],
    _count: true,
  });

  console.log('\n📈 Score Distribution:');
  const ranges = [
    { label: 'Hot (80-100)', min: 80, max: 100 },
    { label: 'Warm (60-79)', min: 60, max: 79 },
    { label: 'Moderate (40-59)', min: 40, max: 59 },
    { label: 'Cold (20-39)', min: 20, max: 39 },
    { label: 'Unqualified (0-19)', min: 0, max: 19 },
  ];

  for (const range of ranges) {
    const count = scoreDistribution
      .filter((s) => s.qualificationScore >= range.min && s.qualificationScore <= range.max)
      .reduce((sum, s) => sum + s._count, 0);
    console.log(`   ${range.label}: ${count} leads`);
  }

  console.log('\n✅ Lead scoring seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding lead scores:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
