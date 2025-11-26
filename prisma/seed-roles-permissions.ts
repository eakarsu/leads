import { prisma } from '../lib/prisma';

async function main() {
  console.log('🔐 Seeding roles and permissions data...');

  // Get existing users and roles
  const users = await prisma.user.findMany();
  const roles = await prisma.role.findMany();

  if (users.length === 0) {
    console.log('⚠️  No users found. Please run main seed first.');
    return;
  }

  if (roles.length === 0) {
    console.log('⚠️  No roles found. Please run main seed first.');
    return;
  }

  console.log(`Found ${users.length} users and ${roles.length} roles`);

  // Create role assignments - assign users to roles
  const roleAssignments = [];

  // Find specific roles
  const ceoRole = roles.find(r => r.name === 'ceo');
  const vpSalesRole = roles.find(r => r.name === 'vp_sales');
  const salesManagerRole = roles.find(r => r.name === 'sales_manager');
  const salesRepRole = roles.find(r => r.name === 'sales_rep');
  const marketingManagerRole = roles.find(r => r.name === 'marketing_manager');
  const supportManagerRole = roles.find(r => r.name === 'support_manager');
  const supportAgentRole = roles.find(r => r.name === 'support_agent');

  // Distribute users across roles
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    let roleId: string | undefined;

    // Assign roles based on user index for variety
    if (i === 0 && ceoRole) {
      roleId = ceoRole.id;
    } else if (i === 1 && vpSalesRole) {
      roleId = vpSalesRole.id;
    } else if (i === 2 && salesManagerRole) {
      roleId = salesManagerRole.id;
    } else if (i % 5 === 0 && marketingManagerRole) {
      roleId = marketingManagerRole.id;
    } else if (i % 4 === 0 && supportManagerRole) {
      roleId = supportManagerRole.id;
    } else if (i % 3 === 0 && supportAgentRole) {
      roleId = supportAgentRole.id;
    } else if (salesRepRole) {
      roleId = salesRepRole.id;
    }

    if (roleId) {
      roleAssignments.push({
        userId: user.id,
        roleId: roleId,
      });
    }
  }

  // Clear existing role assignments
  await prisma.roleAssignment.deleteMany({});
  console.log('Cleared existing role assignments');

  // Create role assignments
  for (const assignment of roleAssignments) {
    await prisma.roleAssignment.create({
      data: assignment,
    });
  }
  console.log(`✅ Created ${roleAssignments.length} role assignments`);

  // Create permission sets
  const permissionSetsData = [
    {
      name: 'sales_full_access',
      label: 'Sales Full Access',
      description: 'Full access to all sales-related objects',
      isCustom: true,
      permissions: {
        leads: { read: true, create: true, edit: true, delete: true },
        contacts: { read: true, create: true, edit: true, delete: true },
        accounts: { read: true, create: true, edit: true, delete: true },
        opportunities: { read: true, create: true, edit: true, delete: true },
        quotes: { read: true, create: true, edit: true, delete: false },
        reports: { read: true, create: true, edit: false, delete: false },
      },
    },
    {
      name: 'sales_read_only',
      label: 'Sales Read Only',
      description: 'Read-only access to sales objects',
      isCustom: true,
      permissions: {
        leads: { read: true, create: false, edit: false, delete: false },
        contacts: { read: true, create: false, edit: false, delete: false },
        accounts: { read: true, create: false, edit: false, delete: false },
        opportunities: { read: true, create: false, edit: false, delete: false },
        quotes: { read: true, create: false, edit: false, delete: false },
        reports: { read: true, create: false, edit: false, delete: false },
      },
    },
    {
      name: 'support_full_access',
      label: 'Support Full Access',
      description: 'Full access to support and case management',
      isCustom: true,
      permissions: {
        cases: { read: true, create: true, edit: true, delete: true },
        contacts: { read: true, create: true, edit: true, delete: false },
        accounts: { read: true, create: false, edit: false, delete: false },
        knowledge: { read: true, create: true, edit: true, delete: true },
        entitlements: { read: true, create: true, edit: true, delete: false },
        reports: { read: true, create: true, edit: false, delete: false },
      },
    },
    {
      name: 'marketing_access',
      label: 'Marketing Access',
      description: 'Access for marketing team members',
      isCustom: true,
      permissions: {
        campaigns: { read: true, create: true, edit: true, delete: true },
        leads: { read: true, create: true, edit: true, delete: false },
        contacts: { read: true, create: false, edit: false, delete: false },
        reports: { read: true, create: true, edit: true, delete: false },
        emails: { read: true, create: true, edit: true, delete: true },
      },
    },
    {
      name: 'admin_access',
      label: 'Administrator Access',
      description: 'Full system administrator access',
      isCustom: false,
      permissions: {
        leads: { read: true, create: true, edit: true, delete: true },
        contacts: { read: true, create: true, edit: true, delete: true },
        accounts: { read: true, create: true, edit: true, delete: true },
        opportunities: { read: true, create: true, edit: true, delete: true },
        cases: { read: true, create: true, edit: true, delete: true },
        campaigns: { read: true, create: true, edit: true, delete: true },
        reports: { read: true, create: true, edit: true, delete: true },
        users: { read: true, create: true, edit: true, delete: true },
        roles: { read: true, create: true, edit: true, delete: true },
        settings: { read: true, create: true, edit: true, delete: true },
      },
    },
    {
      name: 'report_viewer',
      label: 'Report Viewer',
      description: 'Access to view and run reports',
      isCustom: true,
      permissions: {
        reports: { read: true, create: false, edit: false, delete: false },
        dashboards: { read: true, create: false, edit: false, delete: false },
      },
    },
  ];

  // Clear existing permission sets and assignments
  await prisma.permissionSetAssignment.deleteMany({});
  await prisma.permissionSet.deleteMany({});
  console.log('Cleared existing permission sets');

  // Create permission sets
  const createdPermissionSets = [];
  for (const ps of permissionSetsData) {
    const created = await prisma.permissionSet.create({
      data: ps,
    });
    createdPermissionSets.push(created);
  }
  console.log(`✅ Created ${createdPermissionSets.length} permission sets`);

  // Assign permission sets to users
  const permissionAssignments = [];

  const salesFullAccess = createdPermissionSets.find(ps => ps.name === 'sales_full_access');
  const salesReadOnly = createdPermissionSets.find(ps => ps.name === 'sales_read_only');
  const supportFullAccess = createdPermissionSets.find(ps => ps.name === 'support_full_access');
  const marketingAccess = createdPermissionSets.find(ps => ps.name === 'marketing_access');
  const adminAccess = createdPermissionSets.find(ps => ps.name === 'admin_access');
  const reportViewer = createdPermissionSets.find(ps => ps.name === 'report_viewer');

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const assignments: string[] = [];

    // Assign based on role
    const userRoleAssignment = roleAssignments.find(ra => ra.userId === user.id);
    if (userRoleAssignment) {
      if (userRoleAssignment.roleId === ceoRole?.id && adminAccess) {
        assignments.push(adminAccess.id);
      } else if (userRoleAssignment.roleId === vpSalesRole?.id && salesFullAccess) {
        assignments.push(salesFullAccess.id);
        if (reportViewer) assignments.push(reportViewer.id);
      } else if (userRoleAssignment.roleId === salesManagerRole?.id && salesFullAccess) {
        assignments.push(salesFullAccess.id);
      } else if (userRoleAssignment.roleId === salesRepRole?.id) {
        if (i % 2 === 0 && salesFullAccess) {
          assignments.push(salesFullAccess.id);
        } else if (salesReadOnly) {
          assignments.push(salesReadOnly.id);
        }
      } else if (userRoleAssignment.roleId === marketingManagerRole?.id && marketingAccess) {
        assignments.push(marketingAccess.id);
      } else if ((userRoleAssignment.roleId === supportManagerRole?.id ||
                  userRoleAssignment.roleId === supportAgentRole?.id) && supportFullAccess) {
        assignments.push(supportFullAccess.id);
      }
    }

    // Add report viewer to managers
    if (reportViewer && (i < 5 || i % 3 === 0)) {
      if (!assignments.includes(reportViewer.id)) {
        assignments.push(reportViewer.id);
      }
    }

    for (const permissionSetId of assignments) {
      permissionAssignments.push({
        userId: user.id,
        permissionSetId,
      });
    }
  }

  // Create permission set assignments
  for (const assignment of permissionAssignments) {
    await prisma.permissionSetAssignment.create({
      data: assignment,
    });
  }
  console.log(`✅ Created ${permissionAssignments.length} permission set assignments`);

  // Show summary
  console.log('\n📊 Summary:');

  const roleStats = await prisma.roleAssignment.groupBy({
    by: ['roleId'],
    _count: true,
  });

  console.log('\nRole Assignments:');
  for (const stat of roleStats) {
    const role = roles.find(r => r.id === stat.roleId);
    console.log(`   ${role?.label || role?.name}: ${stat._count} users`);
  }

  const permissionStats = await prisma.permissionSetAssignment.groupBy({
    by: ['permissionSetId'],
    _count: true,
  });

  console.log('\nPermission Set Assignments:');
  for (const stat of permissionStats) {
    const ps = createdPermissionSets.find(p => p.id === stat.permissionSetId);
    console.log(`   ${ps?.label || ps?.name}: ${stat._count} users`);
  }

  console.log('\n✅ Roles and permissions seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding roles and permissions:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
