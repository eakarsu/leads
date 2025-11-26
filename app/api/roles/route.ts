import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - List roles and hierarchy
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const includeHierarchy = searchParams.get('hierarchy') === 'true';

    // Get all roles
    const roles = await prisma.role.findMany({
      include: {
        parentRole: {
          select: { id: true, name: true },
        },
        childRoles: {
          select: { id: true, name: true },
        },
        _count: {
          select: { users: true, childRoles: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Build hierarchy tree if requested
    let hierarchy = null;
    if (includeHierarchy) {
      const buildTree = (parentRoleId: string | null): any[] => {
        return roles
          .filter(r => r.parentRoleId === parentRoleId)
          .map(r => ({
            ...r,
            children: buildTree(r.id),
          }));
      };
      hierarchy = buildTree(null);
    }

    // Get user's role assignments if userId provided
    let userRoles = null;
    if (userId) {
      userRoles = await prisma.roleAssignment.findMany({
        where: { userId },
        include: {
          role: true,
        },
      });
    }

    // Get role assignments
    const assignments = await prisma.roleAssignment.findMany({
      include: {
        role: {
          select: { id: true, name: true },
        },
      },
    });

    // Fetch user data separately
    const assignmentUserIds = [...new Set(assignments.map(a => a.userId))];
    const assignmentUsers = await prisma.user.findMany({
      where: { id: { in: assignmentUserIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(assignmentUsers.map(u => [u.id, u]));

    const assignmentsWithUsers = assignments.map(a => ({
      ...a,
      user: userMap.get(a.userId) || null,
    }));

    return NextResponse.json({
      roles,
      hierarchy,
      userRoles,
      assignments: assignmentsWithUsers,
      stats: {
        totalRoles: roles.length,
        totalAssignments: assignments.length,
      },
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new role or assignment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body;

    if (type === 'assignment') {
      const { userId, roleId } = body;

      // Check if assignment already exists
      const existing = await prisma.roleAssignment.findFirst({
        where: { userId, roleId },
      });

      if (existing) {
        return NextResponse.json({ error: 'User already has this role' }, { status: 400 });
      }

      const assignment = await prisma.roleAssignment.create({
        data: { userId, roleId },
        include: {
          role: true,
        },
      });

      // Fetch user separately
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      });

      return NextResponse.json({ ...assignment, user }, { status: 201 });
    }

    // Create role
    const { name, label, description, parentRoleId, caseAccessLevel, opportunityAccessLevel, contactAccessLevel } = body;

    // Check for duplicate name
    const existing = await prisma.role.findFirst({
      where: { name },
    });

    if (existing) {
      return NextResponse.json({ error: 'Role with this name already exists' }, { status: 400 });
    }

    const role = await prisma.role.create({
      data: {
        name,
        label: label || name,
        description,
        parentRoleId,
        caseAccessLevel: caseAccessLevel || 'PRIVATE',
        opportunityAccessLevel: opportunityAccessLevel || 'PRIVATE',
        contactAccessLevel: contactAccessLevel || 'CONTROLLED_BY_PARENT',
      },
      include: {
        parentRole: true,
      },
    });

    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update a role
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, label, description, parentRoleId, caseAccessLevel, opportunityAccessLevel, contactAccessLevel } = body;

    // Prevent circular hierarchy
    if (parentRoleId) {
      const isCircular = async (roleId: string, targetParentId: string): Promise<boolean> => {
        if (roleId === targetParentId) return true;
        const parent = await prisma.role.findUnique({
          where: { id: targetParentId },
          select: { parentRoleId: true },
        });
        if (!parent?.parentRoleId) return false;
        return isCircular(roleId, parent.parentRoleId);
      };

      if (await isCircular(id, parentRoleId)) {
        return NextResponse.json({ error: 'Cannot create circular hierarchy' }, { status: 400 });
      }
    }

    const role = await prisma.role.update({
      where: { id },
      data: {
        name,
        label,
        description,
        parentRoleId,
        caseAccessLevel,
        opportunityAccessLevel,
        contactAccessLevel,
      },
      include: {
        parentRole: true,
        childRoles: true,
      },
    });

    return NextResponse.json(role);
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a role or assignment
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    if (type === 'assignment') {
      await prisma.roleAssignment.delete({
        where: { id },
      });
    } else {
      // Check for child roles
      const childRoles = await prisma.role.count({
        where: { parentRoleId: id },
      });

      if (childRoles > 0) {
        return NextResponse.json(
          { error: 'Cannot delete role with child roles. Please reassign or delete child roles first.' },
          { status: 400 }
        );
      }

      // Delete assignments first
      await prisma.roleAssignment.deleteMany({
        where: { roleId: id },
      });

      // Delete role
      await prisma.role.delete({
        where: { id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
