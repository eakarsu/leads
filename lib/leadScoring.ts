import { Lead, LeadActivity, EnrichmentData } from '@prisma/client';

export interface ScoringFactors {
  demographic: number;
  behavioral: number;
  engagement: number;
  firmographic: number;
  total: number;
  breakdown: {
    category: string;
    points: number;
    reason: string;
  }[];
}

export function calculateLeadScore(
  lead: Lead,
  activities?: LeadActivity[],
  enrichment?: EnrichmentData | null
): ScoringFactors {
  const breakdown: { category: string; points: number; reason: string }[] = [];
  let demographic = 0;
  let behavioral = 0;
  let engagement = 0;
  let firmographic = 0;

  // DEMOGRAPHIC SCORING (max 25 points)
  if (lead.title) {
    const seniorityScore = getSeniorityScore(lead.title);
    if (seniorityScore > 0) {
      demographic += seniorityScore;
      breakdown.push({
        category: 'DEMOGRAPHIC',
        points: seniorityScore,
        reason: `Job title indicates ${getSeniorityLevel(lead.title)} level`,
      });
    }
  }

  if (lead.email && lead.email.includes('@')) {
    const emailDomain = lead.email.split('@')[1];
    if (emailDomain && !isFreeEmailProvider(emailDomain)) {
      demographic += 5;
      breakdown.push({
        category: 'DEMOGRAPHIC',
        points: 5,
        reason: 'Business email address',
      });
    }
  }

  if (lead.phone) {
    demographic += 3;
    breakdown.push({
      category: 'DEMOGRAPHIC',
      points: 3,
      reason: 'Phone number provided',
    });
  }

  if (lead.linkedinUrl) {
    demographic += 2;
    breakdown.push({
      category: 'DEMOGRAPHIC',
      points: 2,
      reason: 'LinkedIn profile available',
    });
  }

  // BEHAVIORAL SCORING (max 30 points)
  if (activities && activities.length > 0) {
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

    const emailActivities = activities.filter((a) => a.type === 'EMAIL').length;
    const emailScore = Math.min(emailActivities * 2, 10);
    if (emailScore > 0) {
      behavioral += emailScore;
      breakdown.push({
        category: 'BEHAVIORAL',
        points: emailScore,
        reason: `${emailActivities} email interactions`,
      });
    }

    const callActivities = activities.filter((a) => a.type === 'CALL').length;
    if (callActivities > 0) {
      behavioral += 5;
      breakdown.push({
        category: 'BEHAVIORAL',
        points: 5,
        reason: `${callActivities} phone call(s)`,
      });
    }
  }

  // ENGAGEMENT SCORING (max 25 points)
  const daysSinceCreated = Math.floor(
    (new Date().getTime() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceCreated < 7) {
    engagement += 10;
    breakdown.push({
      category: 'ENGAGEMENT',
      points: 10,
      reason: 'Recent lead (less than 7 days)',
    });
  } else if (daysSinceCreated < 30) {
    engagement += 5;
    breakdown.push({
      category: 'ENGAGEMENT',
      points: 5,
      reason: 'Lead created within 30 days',
    });
  }

  if (lead.status === 'CONTACTED') {
    engagement += 5;
    breakdown.push({
      category: 'ENGAGEMENT',
      points: 5,
      reason: 'Lead has been contacted',
    });
  } else if (lead.status === 'QUALIFIED') {
    engagement += 10;
    breakdown.push({
      category: 'ENGAGEMENT',
      points: 10,
      reason: 'Lead is qualified',
    });
  }

  // FIRMOGRAPHIC SCORING (max 20 points)
  if (lead.company) {
    firmographic += 5;
    breakdown.push({
      category: 'FIRMOGRAPHIC',
      points: 5,
      reason: 'Company information available',
    });
  }

  if (enrichment) {
    if (enrichment.companySize) {
      const sizeScore = getCompanySizeScore(enrichment.companySize);
      if (sizeScore > 0) {
        firmographic += sizeScore;
        breakdown.push({
          category: 'FIRMOGRAPHIC',
          points: sizeScore,
          reason: `Company size: ${enrichment.companySize}`,
        });
      }
    }

    if (enrichment.industry) {
      firmographic += 5;
      breakdown.push({
        category: 'FIRMOGRAPHIC',
        points: 5,
        reason: `Industry: ${enrichment.industry}`,
      });
    }
  }

  if (lead.website) {
    firmographic += 5;
    breakdown.push({
      category: 'FIRMOGRAPHIC',
      points: 5,
      reason: 'Company website available',
    });
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

function getSeniorityScore(title: string): number {
  const titleLower = title.toLowerCase();

  if (/(ceo|chief executive|president|owner|founder)/i.test(titleLower)) {
    return 15;
  }
  if (/(cto|cfo|cmo|coo|chief|vp|vice president|director|head of)/i.test(titleLower)) {
    return 10;
  }
  if (/(manager|lead|senior)/i.test(titleLower)) {
    return 5;
  }
  return 0;
}

function getSeniorityLevel(title: string): string {
  const titleLower = title.toLowerCase();

  if (/(ceo|chief executive|president|owner|founder)/i.test(titleLower)) {
    return 'C-level';
  }
  if (/(cto|cfo|cmo|coo|chief|vp|vice president|director|head of)/i.test(titleLower)) {
    return 'executive';
  }
  if (/(manager|lead|senior)/i.test(titleLower)) {
    return 'management';
  }
  return 'staff';
}

function getCompanySizeScore(companySize: string): number {
  const sizeLower = companySize.toLowerCase();

  if (/(enterprise|1000\+|large|fortune)/i.test(sizeLower)) {
    return 10;
  }
  if (/(medium|100-1000|mid-size)/i.test(sizeLower)) {
    return 7;
  }
  if (/(small|10-100|startup)/i.test(sizeLower)) {
    return 3;
  }
  return 0;
}

function isFreeEmailProvider(domain: string): boolean {
  const freeProviders = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'aol.com',
    'icloud.com',
    'mail.com',
    'protonmail.com',
  ];
  return freeProviders.includes(domain.toLowerCase());
}

export function getScoreGrade(score: number): {
  grade: string;
  color: string;
  label: string;
} {
  if (score >= 80) {
    return { grade: 'A', color: 'success', label: 'Hot Lead' };
  }
  if (score >= 60) {
    return { grade: 'B', color: 'info', label: 'Warm Lead' };
  }
  if (score >= 40) {
    return { grade: 'C', color: 'warning', label: 'Moderate Lead' };
  }
  if (score >= 20) {
    return { grade: 'D', color: 'error', label: 'Cold Lead' };
  }
  return { grade: 'F', color: 'default', label: 'Unqualified' };
}
