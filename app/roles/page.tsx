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
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

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

const permissionSetColumns: Column[] = [
  { id: 'name', label: 'Name' },
  { id: 'description', label: 'Description', sortable: false },
  { id: 'assignments', label: 'Assignments', sortable: false },
  { id: 'isActive', label: 'Status' },
  { id: 'actions', label: 'Actions', sortable: false },
];

const assignmentColumns: Column[] = [
  { id: 'userName', label: 'User' },
  { id: 'email', label: 'Email' },
  { id: 'role', label: 'Role', sortable: false },
  { id: 'actions', label: 'Actions', sortable: false },
];

export default function RolesPage() {
  const toast = useToast();
  const { confirm } = useConfirmDialog();
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
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermissionSet, setSelectedPermissionSet] = useState<PermissionSet | null>(null);
  const [assignType, setAssignType] = useState<'role' | 'permission'>('role');
  const [users, setUsers] = useState<any[]>([]);
  const [expandedRoles, setExpandedRoles] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
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
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    label: '',
    description: '',
    parentRoleId: '',
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

  const handleSort = (columnId: string) => {
    const newOrder = sortBy === columnId && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(columnId);
    setSortOrder(newOrder);
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
        toast.showSuccess('Role created successfully');
        fetchRoles();
        setRoleFormData({ name: '', description: '', parentRoleId: '' });
      }
    } catch (error) {
      toast.showError('Error creating role');
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
        toast.showSuccess('Permission set created successfully');
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
      toast.showError('Error creating permission set');
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
        toast.showSuccess(`${assignType === 'role' ? 'Role' : 'Permission set'} assigned successfully`);
        if (assignType === 'role') {
          fetchRoles();
        } else {
          fetchPermissions();
        }
        setAssignFormData({ userId: '', roleId: '', permissionSetId: '' });
      }
    } catch (error) {
      toast.showError('Error assigning');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    const confirmed = await confirm({
      title: 'Delete Role',
      message: 'Are you sure you want to delete this role? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      await fetch(`/api/roles?id=${roleId}`, { method: 'DELETE' });
      toast.showSuccess('Role deleted successfully');
      fetchRoles();
    } catch (error) {
      toast.showError('Error deleting role');
    }
  };

  const handleDeletePermissionSet = async (permissionSetId: string) => {
    const confirmed = await confirm({
      title: 'Delete Permission Set',
      message: 'Are you sure you want to delete this permission set? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      await fetch(`/api/permissions?id=${permissionSetId}`, { method: 'DELETE' });
      toast.showSuccess('Permission set deleted successfully');
      fetchPermissions();
    } catch (error) {
      toast.showError('Error deleting permission set');
    }
  };

  const handleDeleteAssignment = async (assignmentId: string, type: 'role' | 'permission') => {
    const confirmed = await confirm({
      title: 'Remove Assignment',
      message: 'Are you sure you want to remove this assignment?',
      severity: 'warning',
      confirmText: 'Remove',
    });
    if (!confirmed) return;

    try {
      const endpoint = type === 'role' ? '/api/roles' : '/api/permissions';
      await fetch(`${endpoint}?id=${assignmentId}&type=assignment`, { method: 'DELETE' });
      toast.showSuccess('Assignment removed successfully');
      if (type === 'role') {
        fetchRoles();
      } else {
        fetchPermissions();
      }
    } catch (error) {
      toast.showError('Error removing assignment');
    }
  };

  const handleStartEdit = () => {
    if (!selectedRole) return;
    setEditFormData({
      name: selectedRole.name,
      label: selectedRole.label || '',
      description: selectedRole.description || '',
      parentRoleId: selectedRole.parentRoleId || '',
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedRole) return;
    try {
      const response = await fetch(`/api/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFormData.name,
          label: editFormData.label,
          description: editFormData.description || null,
          parentRoleId: editFormData.parentRoleId || null,
        }),
      });

      if (response.ok) {
        toast.showSuccess('Role updated successfully');
        setEditMode(false);
        setDetailDialogOpen(false);
        setSelectedRole(null);
        fetchRoles();
      } else {
        const data = await response.json();
        toast.showError(data.error || 'Error updating role');
      }
    } catch (error) {
      toast.showError('Error updating role');
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
          sx={{ pl: level * 4, cursor: 'pointer' }}
          onClick={() => {
            setSelectedRole(role);
            setDetailDialogOpen(true);
          }}
          secondaryAction={
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteRole(role.id);
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          }
        >
          <ListItemIcon>
            {role._count.childRoles > 0 ? (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleRoleExpand(role.id);
                }}
              >
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

  const assignmentExportData = assignments.map((a) => ({
    User: a.user.name,
    Email: a.user.email,
    Role: a.role.name,
  }));

  const permissionSetExportData = permissionSets.map((ps) => ({
    Name: ps.name,
    Description: ps.description || '-',
    Assignments: `${ps._count.assignments} users`,
    Status: ps.isActive ? 'Active' : 'Inactive',
  }));

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Roles & Permissions</Typography>
          <Box display="flex" gap={2} alignItems="center">
            {tabValue === 1 && (
              <ExportToolbar data={permissionSetExportData} filename="permission-sets" title="Permission Sets" />
            )}
            {tabValue === 2 && (
              <ExportToolbar data={assignmentExportData} filename="role-assignments" title="Role Assignments" />
            )}
          </Box>
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
            {loading ? (
              <Box sx={{ p: 2 }}>
                <TableSkeleton rows={5} columns={3} />
              </Box>
            ) : (
              <List>
                {renderRoleHierarchy()}
                {roles.length === 0 && (
                  <ListItem>
                    <ListItemText secondary="No roles found. Create your first role." />
                  </ListItem>
                )}
              </List>
            )}
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
            {loading ? (
              <TableSkeleton rows={5} columns={5} />
            ) : (
              <TableContainer>
                <Table>
                  <SortableTableHead
                    columns={permissionSetColumns}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <TableBody>
                    {permissionSets.map((ps) => (
                      <TableRow
                        key={ps.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => {
                          setSelectedPermissionSet(ps);
                          setDetailDialogOpen(true);
                        }}
                      >
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
                        <TableCell onClick={(e) => e.stopPropagation()}>
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
            )}
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
            {loading ? (
              <TableSkeleton rows={5} columns={4} />
            ) : (
              <TableContainer>
                <Table>
                  <SortableTableHead
                    columns={assignmentColumns}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow key={assignment.id} hover>
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
            )}
          </Paper>
        )}
      </Box>

      {/* Role Detail Dialog */}
      <Dialog open={detailDialogOpen && !!selectedRole} onClose={() => { setDetailDialogOpen(false); setSelectedRole(null); setEditMode(false); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Role' : 'Role Details'}</DialogTitle>
        <DialogContent>
          {selectedRole && !editMode && (
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                <Typography>{selectedRole.label || selectedRole.name}</Typography>
              </Box>
              {selectedRole.description && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                  <Typography>{selectedRole.description}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Parent Role</Typography>
                <Typography>{selectedRole.parentRole?.name || 'None (Top Level)'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Users</Typography>
                <Typography>{selectedRole._count.users} users assigned</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Child Roles</Typography>
                <Typography>{selectedRole._count.childRoles} child roles</Typography>
              </Box>
            </Box>
          )}
          {selectedRole && editMode && (
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
              <TextField
                fullWidth
                label="Label"
                value={editFormData.label}
                onChange={(e) => setEditFormData({ ...editFormData, label: e.target.value })}
              />
              <TextField
                fullWidth
                label="Description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                multiline
                rows={2}
              />
              <FormControl fullWidth>
                <InputLabel>Parent Role</InputLabel>
                <Select
                  value={editFormData.parentRoleId}
                  onChange={(e) => setEditFormData({ ...editFormData, parentRoleId: e.target.value })}
                  label="Parent Role"
                >
                  <MenuItem value="">None (Top Level)</MenuItem>
                  {roles
                    .filter((role) => role.id !== selectedRole.id)
                    .map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.label || role.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {editMode ? (
            <>
              <Button onClick={() => setEditMode(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit} variant="contained" disabled={!editFormData.name}>
                Save
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => { setDetailDialogOpen(false); setSelectedRole(null); }}>Close</Button>
              <Button onClick={handleStartEdit} variant="outlined" startIcon={<EditIcon />}>
                Edit
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Permission Set Detail Dialog */}
      <Dialog open={detailDialogOpen && !!selectedPermissionSet} onClose={() => { setDetailDialogOpen(false); setSelectedPermissionSet(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>Permission Set Details</DialogTitle>
        <DialogContent>
          {selectedPermissionSet && (
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                <Typography>{selectedPermissionSet.name}</Typography>
              </Box>
              {selectedPermissionSet.description && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                  <Typography>{selectedPermissionSet.description}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip
                  label={selectedPermissionSet.isActive ? 'Active' : 'Inactive'}
                  color={selectedPermissionSet.isActive ? 'success' : 'default'}
                  size="small"
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Assignments</Typography>
                <Typography>{selectedPermissionSet._count.assignments} users</Typography>
              </Box>
              {selectedPermissionSet.permissions && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Permissions</Typography>
                  <Paper sx={{ p: 1, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(selectedPermissionSet.permissions, null, 2)}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDetailDialogOpen(false); setSelectedPermissionSet(null); }}>Close</Button>
        </DialogActions>
      </Dialog>

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
              <SortableTableHead
                columns={[
                  { id: 'object', label: 'Object', sortable: false },
                  { id: 'read', label: 'Read', sortable: false },
                  { id: 'create', label: 'Create', sortable: false },
                  { id: 'edit', label: 'Edit', sortable: false },
                  { id: 'delete', label: 'Delete', sortable: false },
                ]}
                sortBy=""
                sortOrder="asc"
                onSort={() => {}}
              />
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
