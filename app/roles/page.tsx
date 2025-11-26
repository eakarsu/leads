'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  FormControlLabel,
  Checkbox,
  Switch,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DashboardLayout from '@/components/DashboardLayout';

interface Role {
  id: string;
  name: string;
  label: string;
  description: string | null;
  caseAccessLevel: string;
  opportunityAccessLevel: string;
  contactAccessLevel: string;
  parentRoleId: string | null;
  parentRole: { id: string; name: string } | null;
  childRoles: { id: string; name: string }[];
  _count: { users: number; childRoles: number };
}

interface PermissionSet {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  permissions: any;
  _count: { assignments: number };
}

interface RoleAssignment {
  id: string;
  user: { id: string; name: string; email: string };
  role: { id: string; name: string };
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissionSets, setPermissionSets] = useState<PermissionSet[]>([]);
  const [assignments, setAssignments] = useState<RoleAssignment[]>([]);
  const [permissionAssignments, setPermissionAssignments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRoles: 0,
    totalAssignments: 0,
    unassignedUsers: 0,
    totalPermissionSets: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignType, setAssignType] = useState<'role' | 'permission'>('role');
  const [users, setUsers] = useState<any[]>([]);
  const [expandedRoles, setExpandedRoles] = useState<Record<string, boolean>>({});
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    description: '',
    parentRoleId: '',
  });
  const [permissionFormData, setPermissionFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    permissions: {
      accounts: { read: true, create: false, edit: false, delete: false },
      contacts: { read: true, create: false, edit: false, delete: false },
      leads: { read: true, create: false, edit: false, delete: false },
      opportunities: { read: true, create: false, edit: false, delete: false },
      cases: { read: true, create: false, edit: false, delete: false },
      reports: { read: true, create: false, edit: false, delete: false },
    },
  });
  const [assignFormData, setAssignFormData] = useState({
    userId: '',
    roleId: '',
    permissionSetId: '',
  });

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
    fetchUsers();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles?hierarchy=true');
      const data = await response.json();
      setRoles(data.roles || []);
      setAssignments(data.assignments || []);
      setStats((prev) => ({
        ...prev,
        totalRoles: data.stats?.totalRoles || 0,
        totalAssignments: data.stats?.totalAssignments || 0,
        unassignedUsers: data.stats?.unassignedUsers || 0,
      }));
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/permissions');
      const data = await response.json();
      setPermissionSets(data.permissionSets || []);
      setPermissionAssignments(data.assignments || []);
      setStats((prev) => ({
        ...prev,
        totalPermissionSets: data.stats?.totalPermissionSets || 0,
      }));
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data.users || data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreateRole = async () => {
    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...roleFormData,
          parentRoleId: roleFormData.parentRoleId || null,
        }),
      });

      if (response.ok) {
        setRoleDialogOpen(false);
        fetchRoles();
        setRoleFormData({ name: '', description: '', parentRoleId: '' });
      }
    } catch (error) {
      console.error('Error creating role:', error);
    }
  };

  const handleCreatePermissionSet = async () => {
    try {
      const response = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permissionFormData),
      });

      if (response.ok) {
        setPermissionDialogOpen(false);
        fetchPermissions();
        setPermissionFormData({
          name: '',
          description: '',
          isActive: true,
          permissions: {
            accounts: { read: true, create: false, edit: false, delete: false },
            contacts: { read: true, create: false, edit: false, delete: false },
            leads: { read: true, create: false, edit: false, delete: false },
            opportunities: { read: true, create: false, edit: false, delete: false },
            cases: { read: true, create: false, edit: false, delete: false },
            reports: { read: true, create: false, edit: false, delete: false },
          },
        });
      }
    } catch (error) {
      console.error('Error creating permission set:', error);
    }
  };

  const handleAssign = async () => {
    try {
      const endpoint = assignType === 'role' ? '/api/roles' : '/api/permissions';
      const body =
        assignType === 'role'
          ? { type: 'assignment', userId: assignFormData.userId, roleId: assignFormData.roleId }
          : { type: 'assignment', userId: assignFormData.userId, permissionSetId: assignFormData.permissionSetId };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setAssignDialogOpen(false);
        if (assignType === 'role') {
          fetchRoles();
        } else {
          fetchPermissions();
        }
        setAssignFormData({ userId: '', roleId: '', permissionSetId: '' });
      }
    } catch (error) {
      console.error('Error assigning:', error);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      await fetch(`/api/roles?id=${roleId}`, { method: 'DELETE' });
      fetchRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
    }
  };

  const handleDeletePermissionSet = async (permissionSetId: string) => {
    if (!confirm('Are you sure you want to delete this permission set?')) return;

    try {
      await fetch(`/api/permissions?id=${permissionSetId}`, { method: 'DELETE' });
      fetchPermissions();
    } catch (error) {
      console.error('Error deleting permission set:', error);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string, type: 'role' | 'permission') => {
    try {
      const endpoint = type === 'role' ? '/api/roles' : '/api/permissions';
      await fetch(`${endpoint}?id=${assignmentId}&type=assignment`, { method: 'DELETE' });
      if (type === 'role') {
        fetchRoles();
      } else {
        fetchPermissions();
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
    }
  };

  const updatePermission = (object: string, action: string, value: boolean) => {
    setPermissionFormData({
      ...permissionFormData,
      permissions: {
        ...permissionFormData.permissions,
        [object]: {
          ...permissionFormData.permissions[object as keyof typeof permissionFormData.permissions],
          [action]: value,
        },
      },
    });
  };

  const toggleRoleExpand = (roleId: string) => {
    setExpandedRoles((prev) => ({ ...prev, [roleId]: !prev[roleId] }));
  };

  const renderRoleHierarchy = (parentRoleId: string | null = null, level = 0) => {
    const filteredRoles = roles.filter((r) => r.parentRoleId === parentRoleId);
    return filteredRoles.map((role) => (
      <Box key={role.id}>
        <ListItem
          sx={{ pl: level * 4 }}
          secondaryAction={
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => handleDeleteRole(role.id)}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          }
        >
          <ListItemIcon>
            {role._count.childRoles > 0 ? (
              <IconButton size="small" onClick={() => toggleRoleExpand(role.id)}>
                {expandedRoles[role.id] ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            ) : (
              <AccountTreeIcon color="action" />
            )}
          </ListItemIcon>
          <ListItemText
            primary={role.label || role.name}
            secondary={`${role._count.users} users`}
          />
        </ListItem>
        {role._count.childRoles > 0 && (
          <Collapse in={expandedRoles[role.id]}>
            {renderRoleHierarchy(role.id, level + 1)}
          </Collapse>
        )}
      </Box>
    ));
  };

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Roles & Permissions</Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AccountTreeIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Total Roles</Typography>
                </Box>
                <Typography variant="h4">{stats.totalRoles}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <SecurityIcon color="info" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Permission Sets</Typography>
                </Box>
                <Typography variant="h4">{stats.totalPermissionSets}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PersonIcon color="success" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Role Assignments</Typography>
                </Box>
                <Typography variant="h4">{stats.totalAssignments}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AdminPanelSettingsIcon color="warning" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Unassigned Users</Typography>
                </Box>
                <Typography variant="h4">{stats.unassignedUsers}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 2 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="Role Hierarchy" />
            <Tab label="Permission Sets" />
            <Tab label="User Assignments" />
          </Tabs>
        </Paper>

        {/* Role Hierarchy Tab */}
        {tabValue === 0 && (
          <Paper>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setRoleDialogOpen(true)}
              >
                New Role
              </Button>
            </Box>
            <List>
              {renderRoleHierarchy()}
              {roles.length === 0 && (
                <ListItem>
                  <ListItemText secondary="No roles found. Create your first role." />
                </ListItem>
              )}
            </List>
          </Paper>
        )}

        {/* Permission Sets Tab */}
        {tabValue === 1 && (
          <Paper>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setPermissionDialogOpen(true)}
              >
                New Permission Set
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Assignments</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {permissionSets.map((ps) => (
                    <TableRow key={ps.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {ps.name}
                        </Typography>
                      </TableCell>
                      <TableCell>{ps.description || '-'}</TableCell>
                      <TableCell>{ps._count.assignments} users</TableCell>
                      <TableCell>
                        <Chip
                          label={ps.isActive ? 'Active' : 'Inactive'}
                          color={ps.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDeletePermissionSet(ps.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {permissionSets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No permission sets found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* User Assignments Tab */}
        {tabValue === 2 && (
          <Paper>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => {
                  setAssignType('permission');
                  setAssignDialogOpen(true);
                }}
              >
                Assign Permission Set
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setAssignType('role');
                  setAssignDialogOpen(true);
                }}
              >
                Assign Role
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>{assignment.user.name}</TableCell>
                      <TableCell>{assignment.user.email}</TableCell>
                      <TableCell>
                        <Chip label={assignment.role.name} size="small" />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Remove Assignment">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteAssignment(assignment.id, 'role')}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {assignments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No role assignments found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>

      {/* Create Role Dialog */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Role</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Role Name"
            value={roleFormData.name}
            onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            value={roleFormData.description}
            onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Parent Role</InputLabel>
            <Select
              value={roleFormData.parentRoleId}
              onChange={(e) => setRoleFormData({ ...roleFormData, parentRoleId: e.target.value })}
              label="Parent Role"
            >
              <MenuItem value="">None (Top Level)</MenuItem>
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.label || role.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateRole} variant="contained" disabled={!roleFormData.name}>
            Create Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Permission Set Dialog */}
      <Dialog open={permissionDialogOpen} onClose={() => setPermissionDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Permission Set</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={permissionFormData.name}
            onChange={(e) => setPermissionFormData({ ...permissionFormData, name: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            value={permissionFormData.description}
            onChange={(e) => setPermissionFormData({ ...permissionFormData, description: e.target.value })}
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={permissionFormData.isActive}
                onChange={(e) => setPermissionFormData({ ...permissionFormData, isActive: e.target.checked })}
              />
            }
            label="Active"
            sx={{ mb: 2 }}
          />
          <Typography variant="subtitle2" gutterBottom>
            Object Permissions
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Object</TableCell>
                  <TableCell>Read</TableCell>
                  <TableCell>Create</TableCell>
                  <TableCell>Edit</TableCell>
                  <TableCell>Delete</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(permissionFormData.permissions).map(([object, perms]) => (
                  <TableRow key={object}>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{object}</TableCell>
                    {['read', 'create', 'edit', 'delete'].map((action) => (
                      <TableCell key={action}>
                        <Checkbox
                          checked={(perms as any)[action]}
                          onChange={(e) => updatePermission(object, action, e.target.checked)}
                          size="small"
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermissionDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreatePermissionSet} variant="contained" disabled={!permissionFormData.name}>
            Create Permission Set
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Assign {assignType === 'role' ? 'Role' : 'Permission Set'} to User
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>User</InputLabel>
            <Select
              value={assignFormData.userId}
              onChange={(e) => setAssignFormData({ ...assignFormData, userId: e.target.value })}
              label="User"
            >
              {users.map((user: any) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.name} - {user.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {assignType === 'role' ? (
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={assignFormData.roleId}
                onChange={(e) => setAssignFormData({ ...assignFormData, roleId: e.target.value })}
                label="Role"
              >
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.label || role.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <FormControl fullWidth>
              <InputLabel>Permission Set</InputLabel>
              <Select
                value={assignFormData.permissionSetId}
                onChange={(e) => setAssignFormData({ ...assignFormData, permissionSetId: e.target.value })}
                label="Permission Set"
              >
                {permissionSets.map((ps) => (
                  <MenuItem key={ps.id} value={ps.id}>
                    {ps.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAssign}
            variant="contained"
            disabled={
              !assignFormData.userId ||
              (assignType === 'role' ? !assignFormData.roleId : !assignFormData.permissionSetId)
            }
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
