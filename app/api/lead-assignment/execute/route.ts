import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Simple round-robin counter (in production, this should be persisted)
const roundRobinCounters: { [key: string]: number } = {};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
    }

    // Get the lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Get active assignment rules ordered by priority
    const rules = await prisma.leadAssignmentRule.findMany({
      where: { isActive: true },
      orderBy: { priority: 'desc' },
    });

    let assignedUserId: string | null = null;

    // Evaluate rules in priority order
    for (const rule of rules) {
      const criteria = rule.criteria as any;
      let matches = true;

      // Evaluate criteria (simple evaluation - in production, use a proper rules engine)
      if (criteria.leadSource && lead.leadSource !== criteria.leadSource) {
        matches = false;
      }
      if (criteria.status && lead.status !== criteria.status) {
        matches = false;
      }
      if (
        criteria.minQualificationScore &&
        lead.qualificationScore < criteria.minQualificationScore
      ) {
        matches = false;
      }
      if (
        criteria.maxQualificationScore &&
        lead.qualificationScore > criteria.maxQualificationScore
      ) {
        matches = false;
      }
      if (criteria.company && !lead.company?.includes(criteria.company)) {
        matches = false;
      }

      if (matches && rule.assignToUserIds.length > 0) {
        // Apply assignment method
        switch (rule.assignmentMethod) {
          case 'ROUND_ROBIN':
            const counter = roundRobinCounters[rule.id] || 0;
            assignedUserId =
              rule.assignToUserIds[counter % rule.assignToUserIds.length];
            roundRobinCounters[rule.id] = counter + 1;
            break;

          case 'LOAD_BALANCED':
            // Count current leads per user and assign to user with least leads
            const userLeadCounts = await Promise.all(
              rule.assignToUserIds.map(async (userId) => ({
                userId,
                count: await prisma.lead.count({
                  where: {
                    ownerId: userId,
                    status: { not: 'UNQUALIFIED' },
                  },
                }),
              }))
            );
            const leastBusyUser = userLeadCounts.sort((a, b) => a.count - b.count)[0];
            assignedUserId = leastBusyUser.userId;
            break;

          case 'MANUAL':
            // Manual assignment - don't auto-assign
            break;

          default:
            // Default to first user
            assignedUserId = rule.assignToUserIds[0];
        }

        if (assignedUserId) {
          // Update the lead
          await prisma.lead.update({
            where: { id: leadId },
            data: { ownerId: assignedUserId },
          });

          return NextResponse.json({
            success: true,
            leadId,
            assignedUserId,
            ruleName: rule.name,
          });
        }
      }
    }

    return NextResponse.json({
      success: false,
      message: 'No matching assignment rules found',
    });
  } catch (error: any) {
    console.error('Error executing assignment:', error);
    return NextResponse.json(
      { error: 'Failed to execute assignment' },
      { status: 500 }
    );
  }
}
