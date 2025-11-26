import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const myGroups = searchParams.get('myGroups') === 'true';

    const where: any = {};
    if (type) where.type = type;
    if (myGroups) {
      where.members = { some: { userId: session.user.id } };
    }

    const groups = await prisma.chatterGroup.findMany({
      where,
      include: {
        _count: { select: { members: true } },
        members: {
          where: { userId: session.user.id },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch owner data separately
    const ownerIds = [...new Set(groups.map(g => g.ownerId))];
    const owners = await prisma.user.findMany({
      where: { id: { in: ownerIds } },
      select: { id: true, name: true, email: true },
    });
    const ownerMap = new Map(owners.map(o => [o.id, o]));

    // Add membership status and owner
    const groupsWithMembership = groups.map((group) => ({
      ...group,
      owner: ownerMap.get(group.ownerId),
      isMember: group.members.length > 0,
      members: undefined,
    }));

    return NextResponse.json(groupsWithMembership);
  } catch (error: any) {
    console.error('Error fetching chatter groups:', error);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, type, isArchived } = body;

    if (!name) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    const group = await prisma.chatterGroup.create({
      data: {
        name,
        description,
        isPublic: type !== 'PRIVATE',
        isArchived: isArchived ?? false,
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: 'OWNER',
          },
        },
      },
      include: {
        _count: { select: { members: true } },
      },
    });

    // Fetch owner data
    const owner = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true },
    });

    const groupWithOwner = { ...group, owner };

    return NextResponse.json(groupWithOwner, { status: 201 });
  } catch (error: any) {
    console.error('Error creating chatter group:', error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}

// Join/Leave group or update membership
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { groupId, action, userId, role } = body;

    if (!groupId || !action) {
      return NextResponse.json({ error: 'Group ID and action are required' }, { status: 400 });
    }

    const group = await prisma.chatterGroup.findUnique({
      where: { id: groupId },
      include: {
        members: { where: { userId: session.user.id } },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (action === 'join') {
      // Check if already a member
      const existingMember = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: { groupId, userId: session.user.id },
        },
      });

      if (existingMember) {
        return NextResponse.json({ error: 'Already a member' }, { status: 400 });
      }

      // For private groups, create pending request
      if (!group.isPublic) {
        await prisma.groupMember.create({
          data: {
            groupId,
            userId: session.user.id,
            role: 'PENDING',
          },
        });
        return NextResponse.json({ status: 'pending' });
      }

      // For public groups, join directly
      await prisma.groupMember.create({
        data: {
          groupId,
          userId: session.user.id,
          role: 'MEMBER',
        },
      });

      return NextResponse.json({ status: 'joined' });
    }

    if (action === 'leave') {
      await prisma.groupMember.delete({
        where: {
          groupId_userId: { groupId, userId: session.user.id },
        },
      });

      return NextResponse.json({ status: 'left' });
    }

    if (action === 'approve' || action === 'reject') {
      // Only owner/admin can approve/reject
      const membership = group.members[0];
      if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }

      if (action === 'approve') {
        await prisma.groupMember.update({
          where: {
            groupId_userId: { groupId, userId },
          },
          data: { role: 'MEMBER' },
        });
      } else {
        await prisma.groupMember.delete({
          where: {
            groupId_userId: { groupId, userId },
          },
        });
      }

      return NextResponse.json({ status: action === 'approve' ? 'approved' : 'rejected' });
    }

    if (action === 'updateRole') {
      // Only owner can update roles
      if (group.ownerId !== session.user.id) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }

      await prisma.groupMember.update({
        where: {
          groupId_userId: { groupId, userId },
        },
        data: { role },
      });

      return NextResponse.json({ status: 'updated' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error processing group action:', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
