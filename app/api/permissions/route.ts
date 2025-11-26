import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - List permission sets and assignments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Get all permission sets
    const permissionSets = await prisma.permissionSet.findMany({
      include: {
        _count: {
          select: { assignments: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Get user's permission sets if userId provided
    let userPermissions = null;
    if (userId) {
      userPermissions = await prisma.permissionSetAssignment.findMany({
        where: { userId },
        include: {
          permissionSet: true,
        },
      });
    }

    // Get all assignments
    const assignments = await prisma.permissionSetAssignment.findMany({
      include: {
        permissionSet: {
          select: { id: true, name: true },
        },
      },
    });

    // Fetch user data separately
    const userIds = [...new Set(assignments.map(a => a.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    const assignmentsWithUsers = assignments.map(a => ({
      ...a,
      user: userMap.get(a.userId) || null,
    }));

    return NextResponse.json({
      permissionSets,
      userPermissions,
      assignments: assignmentsWithUsers,
      stats: {
        totalPermissionSets: permissionSets.length,
        totalAssignments: assignments.length,
        customPermissionSets: permissionSets.filter(p => p.isCustom).length,
      },
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new permission set or assignment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body;

    if (type === 'assignment') {
      const { userId, permissionSetId } = body;

      // Check if assignment already exists
      const existing = await prisma.permissionSetAssignment.findFirst({
        where: { userId, permissionSetId },
      });

      if (existing) {
        return NextResponse.json({ error: 'User already has this permission set' }, { status: 400 });
      }

      const assignment = await prisma.permissionSetAssignment.create({
        data: { userId, permissionSetId },
        include: {
          permissionSet: true,
        },
      });

      // Fetch user separately
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      });

      return NextResponse.json({ ...assignment, user }, { status: 201 });
    }

    // Create permission set
    const {
      name,
      label,
      description,
      isCustom,
      permissions,
    } = body;

    // Check for duplicate name
    const existing = await prisma.permissionSet.findFirst({
      where: { name },
    });

    if (existing) {
      return NextResponse.json({ error: 'Permission set with this name already exists' }, { status: 400 });
    }

    const permissionSet = await prisma.permissionSet.create({
      data: {
        name,
        label: label || name,
        description,
        isCustom: isCustom !== false,
        permissions: permissions || {},
      },
    });

    return NextResponse.json(permissionSet, { status: 201 });
  } catch (error) {
    console.error('Error creating permission set:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update a permission set
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, label, description, isCustom, permissions } = body;

    const permissionSet = await prisma.permissionSet.update({
      where: { id },
      data: {
        name,
        label,
        description,
        isCustom,
        permissions: permissions || undefined,
      },
    });

    return NextResponse.json(permissionSet);
  } catch (error) {
    console.error('Error updating permission set:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a permission set or assignment
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
      await prisma.permissionSetAssignment.delete({
        where: { id },
      });
    } else {
      // Delete assignments first
      await prisma.permissionSetAssignment.deleteMany({
        where: { permissionSetId: id },
      });

      // Delete permission set
      await prisma.permissionSet.delete({
        where: { id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting permission set:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
