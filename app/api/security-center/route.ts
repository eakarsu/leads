import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    users,
    admins,
    unverifiedUsers,
    staleResetTokens,
    openVerificationTokens,
    attachments,
    aiErrors,
    aiCalls,
    inactiveValidationRules,
    inactiveWorkflows,
    recentFieldChanges,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.user.count({ where: { emailVerified: false } }),
    prisma.passwordResetToken.count({ where: { usedAt: null, expiresAt: { lt: new Date() } } }),
    prisma.emailVerificationToken.count({ where: { usedAt: null, expiresAt: { gt: new Date() } } }),
    prisma.attachment.aggregate({ _count: true, _sum: { fileSize: true } }),
    prisma.aIResult.count({ where: { status: 'error', createdAt: { gte: since7 } } }).catch(() => 0),
    prisma.aIResult.count({ where: { createdAt: { gte: since7 } } }).catch(() => 0),
    prisma.validationRule.count({ where: { isActive: false } }),
    prisma.workflowRule.count({ where: { isActive: false } }),
    prisma.fieldHistory.findMany({ orderBy: { changedAt: 'desc' }, take: 12 }),
  ]);

  const attachmentCount = typeof attachments._count === 'number'
    ? attachments._count
    : (attachments._count as any)?._all || 0;

  const findings = [
    {
      key: 'unverified-users',
      severity: unverifiedUsers > 0 ? 'medium' : 'low',
      title: 'Unverified users',
      detail: `${unverifiedUsers} of ${users} users have not verified email.`,
      action: 'Review user onboarding and resend verification where needed.',
      scoreImpact: Math.min(20, unverifiedUsers * 3),
    },
    {
      key: 'admin-count',
      severity: admins > 2 ? 'medium' : 'low',
      title: 'Administrator footprint',
      detail: `${admins} administrator account${admins === 1 ? '' : 's'} found.`,
      action: 'Keep admin access limited to named platform owners.',
      scoreImpact: admins > 2 ? Math.min(20, (admins - 2) * 5) : 0,
    },
    {
      key: 'ai-errors',
      severity: aiErrors > 0 ? 'medium' : 'low',
      title: 'AI execution errors',
      detail: `${aiErrors} errors in ${aiCalls} AI calls over the last 7 days.`,
      action: 'Open Agent Studio history and inspect failing prompts or provider responses.',
      scoreImpact: aiErrors > 0 ? Math.min(20, aiErrors * 4) : 0,
    },
    {
      key: 'inactive-automation',
      severity: inactiveValidationRules + inactiveWorkflows > 0 ? 'medium' : 'low',
      title: 'Inactive controls',
      detail: `${inactiveValidationRules} validation rules and ${inactiveWorkflows} workflows are inactive.`,
      action: 'Review inactive controls before assuming business rules are enforced.',
      scoreImpact: Math.min(15, inactiveValidationRules + inactiveWorkflows),
    },
    {
      key: 'tokens',
      severity: staleResetTokens > 0 || openVerificationTokens > 5 ? 'medium' : 'low',
      title: 'Auth token hygiene',
      detail: `${staleResetTokens} expired reset tokens and ${openVerificationTokens} open verification tokens found.`,
      action: 'Expire stale auth tokens during maintenance windows.',
      scoreImpact: Math.min(15, staleResetTokens + Math.max(0, openVerificationTokens - 5)),
    },
  ];

  const riskScore = Math.max(0, 100 - findings.reduce((sum, item) => sum + item.scoreImpact, 0));

  return NextResponse.json({
    riskScore,
    posture: riskScore >= 85 ? 'Strong' : riskScore >= 70 ? 'Moderate' : 'Needs Attention',
    stats: {
      users,
      admins,
      unverifiedUsers,
      attachments: attachmentCount,
      attachmentBytes: attachments._sum.fileSize || 0,
      aiErrors,
      aiCalls,
      inactiveValidationRules,
      inactiveWorkflows,
      recentWindow: { since7, since30 },
    },
    findings,
    recentFieldChanges,
  });
}
