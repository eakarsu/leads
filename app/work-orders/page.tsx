'use client';

import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableRow, IconButton, Chip, Grid, Card,
  CardContent, FormControl, InputLabel, Select, MenuItem, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelPresentationIcon from '@mui/icons-material/CancelPresentation';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PendingIcon from '@mui/icons-material/Pending';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface WorkOrder {
  id: string;
  workOrderNumber: string;
  subject: string;
  description: string | null;
  priority: string;
  status: string;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  budget: number | null;
  address: string | null;
  city: string | null;
  state: string | null;
  territory?: { id: string; name: string } | null;
  workType?: { id: string; name: string } | null;
  account?: { id: string; name: string } | null;
  createdAt: string;
}

const columns: Column[] = [
  { id: 'workOrderNumber', label: 'WO#' },
  { id: 'subject', label: 'Subject' },
  { id: 'account', label: 'Account', sortable: false },
  { id: 'priority', label: 'Priority' },
  { id: 'status', label: 'Status' },
  { id: 'territory', label: 'Territory', sortable: false },
  { id: 'createdAt', label: 'Created' },
  { id: 'actions', label: 'Actions', sortable: false },
];

export default function WorkOrdersPage() {
  const toast = useToast();
  const { confirm } = useConfirmDialog();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WorkOrder | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [territories, setTerritories] = useState<any[]>([]);
  const [workTypes, setWorkTypes] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    accountId: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    budget: 0,
    priority: 'MEDIUM',
    territoryId: '',
    workTypeId: '',
    address: '',
    city: '',
    state: '',
  });

  const [editFormData, setEditFormData] = useState({
    subject: '',
    description: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    budget: 0,
    priority: 'MEDIUM',
    status: 'NEW',
    territoryId: '',
    workTypeId: '',
    address: '',
    city: '',
    state: '',
  });

  const extraParams: Record<string, string> = {};
  if (search) extraParams.search = search;
  if (statusFilter) extraParams.status = statusFilter;
  if (priorityFilter) extraParams.priority = priorityFilter;

  const {
    data: items,
    loading,
    pagination,
    setPage,
    setPageSize,
    setSort,
    refresh,
  } = usePagination<WorkOrder>({
    url: '/api/work-orders',
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
    extraParams,
  });

  useEffect(() => {
    fetchAccounts();
    fetchTerritories();
    fetchWorkTypes();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/clients?pageSize=200');
      const data = await response.json();
      setAccounts(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Error fetching accounts:', err);
    }
  };

  const fetchTerritories = async () => {
    try {
      const response = await fetch('/api/service-territories?pageSize=200');
      const data = await response.json();
      setTerritories(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Error fetching territories:', err);
    }
  };

  const fetchWorkTypes = async () => {
    try {
      const response = await fetch('/api/work-types?pageSize=200');
      const data = await response.json();
      setWorkTypes(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Error fetching work types:', err);
    }
  };

  const handleSort = (columnId: string) => {
    const newOrder = sortBy === columnId && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(columnId);
    setSortOrder(newOrder);
    setSort(columnId, newOrder);
  };

  const handleCreate = async () => {
    try {
      const payload = {
        ...formData,
        accountId: formData.accountId || null,
        territoryId: formData.territoryId || null,
        workTypeId: formData.workTypeId || null,
      };
      const response = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to create work order');
      setDialogOpen(false);
      toast.showSuccess('Work order created successfully');
      refresh();
      resetForm();
    } catch (err: any) {
      toast.showError(err.message || 'Error creating work order');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Work Order',
      message: 'Are you sure you want to delete this work order? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      await fetch(`/api/work-orders/${id}`, { method: 'DELETE' });
      toast.showSuccess('Work order deleted successfully');
      refresh();
    } catch (err) {
      toast.showError('Error deleting work order');
    }
  };

  const handleStartEdit = () => {
    if (!selectedItem) return;
    setEditFormData({
      subject: selectedItem.subject,
      description: selectedItem.description || '',
      contactName: selectedItem.contactName || '',
      contactPhone: selectedItem.contactPhone || '',
      contactEmail: selectedItem.contactEmail || '',
      budget: selectedItem.budget || 0,
      priority: selectedItem.priority,
      status: selectedItem.status,
      territoryId: selectedItem.territory?.id || '',
      workTypeId: selectedItem.workType?.id || '',
      address: selectedItem.address || '',
      city: selectedItem.city || '',
      state: selectedItem.state || '',
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedItem) return;
    try {
      const payload = {
        ...editFormData,
        territoryId: editFormData.territoryId || null,
        workTypeId: editFormData.workTypeId || null,
      };
      const response = await fetch(`/api/work-orders/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to update work order');
      toast.showSuccess('Work order updated successfully');
      setEditMode(false);
      setDetailOpen(false);
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      subject: '',
      description: '',
      accountId: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      budget: 0,
      priority: 'MEDIUM',
      territoryId: '',
      workTypeId: '',
      address: '',
      city: '',
      state: '',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'default';
      case 'MEDIUM': return 'primary';
      case 'HIGH': return 'warning';
      case 'CRITICAL': return 'error';
      case 'EMERGENCY': return 'error';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'info';
      case 'PENDING': return 'default';
      case 'OPEN': return 'primary';
      case 'IN_PROGRESS': return 'warning';
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const stats = {
    total: pagination.totalItems,
    new: items.filter((i) => i.status === 'NEW').length,
    open: items.filter((i) => i.status === 'OPEN').length,
    inProgress: items.filter((i) => i.status === 'IN_PROGRESS').length,
    completed: items.filter((i) => i.status === 'COMPLETED').length,
    cancelled: items.filter((i) => i.status === 'CANCELLED').length,
  };

  const exportData = items.map((item) => ({
    'WO#': item.workOrderNumber,
    Subject: item.subject,
    Account: item.account?.name || '-',
    Priority: item.priority,
    Status: item.status,
    Territory: item.territory?.name || '-',
    'Work Type': item.workType?.name || '-',
    Budget: item.budget ? formatCurrency(item.budget) : '-',
    Created: formatDate(item.createdAt),
  }));

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AssignmentIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4">Work Orders</Typography>
          </Box>
          <Box display="flex" gap={2} alignItems="center">
            <ExportToolbar data={exportData} filename="work-orders" title="Work Orders" />
            <Button
              variant="outlined"
              startIcon={<ScheduleIcon />}
              onClick={() => router.push('/scheduling')}
            >
              Schedule
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              New Work Order
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <Card>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <AssignmentIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="caption" color="textSecondary">Total</Typography>
                </Box>
                <Typography variant="h5">{stats.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <Card>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <FiberNewIcon color="info" sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="caption" color="textSecondary">New</Typography>
                </Box>
                <Typography variant="h5">{stats.new}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <Card>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <PendingIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="caption" color="textSecondary">Open</Typography>
                </Box>
                <Typography variant="h5">{stats.open}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <Card>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <PlayArrowIcon color="warning" sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="caption" color="textSecondary">In Progress</Typography>
                </Box>
                <Typography variant="h5">{stats.inProgress}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <Card>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <CheckCircleIcon color="success" sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="caption" color="textSecondary">Completed</Typography>
                </Box>
                <Typography variant="h5">{stats.completed}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <Card>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <CancelPresentationIcon color="error" sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="caption" color="textSecondary">Cancelled</Typography>
                </Box>
                <Typography variant="h5">{stats.cancelled}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search work orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="NEW">New</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="OPEN">Open</MenuItem>
                  <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  label="Priority"
                >
                  <MenuItem value="">All Priorities</MenuItem>
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="CRITICAL">Critical</MenuItem>
                  <MenuItem value="EMERGENCY">Emergency</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Table */}
        {loading ? (
          <TableSkeleton rows={5} columns={8} />
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <SortableTableHead
                columns={columns}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <TableBody>
                {items.map((item) => (
                  <TableRow
                    key={item.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => { setSelectedItem(item); setDetailOpen(true); setEditMode(false); }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">{item.workOrderNumber}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {item.subject}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.account?.name || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.priority}
                        color={getPriorityColor(item.priority) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.status.replace('_', ' ')}
                        color={getStatusColor(item.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{item.territory?.name || '-'}</TableCell>
                    <TableCell>{formatDate(item.createdAt)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => { setSelectedItem(item); setDetailOpen(true); handleStartEdit(); }}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">No work orders found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <PaginationControls
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Box>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Work Order</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Subject *"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Account</InputLabel>
                <Select
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  label="Account"
                >
                  <MenuItem value="">None</MenuItem>
                  {accounts.map((a: any) => (
                    <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  label="Priority"
                >
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="CRITICAL">Critical</MenuItem>
                  <MenuItem value="EMERGENCY">Emergency</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Contact Name"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Contact Phone"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Contact Email"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Budget"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Territory</InputLabel>
                <Select
                  value={formData.territoryId}
                  onChange={(e) => setFormData({ ...formData, territoryId: e.target.value })}
                  label="Territory"
                >
                  <MenuItem value="">None</MenuItem>
                  {territories.map((t: any) => (
                    <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Work Type</InputLabel>
                <Select
                  value={formData.workTypeId}
                  onChange={(e) => setFormData({ ...formData, workTypeId: e.target.value })}
                  label="Work Type"
                >
                  <MenuItem value="">None</MenuItem>
                  {workTypes.map((wt: any) => (
                    <MenuItem key={wt.id} value={wt.id}>{wt.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="State"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={!formData.subject}>
            Create Work Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail/Edit Dialog */}
      <Dialog open={detailOpen} onClose={() => { setDetailOpen(false); setEditMode(false); }} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">
                {editMode ? 'Edit Work Order' : selectedItem?.workOrderNumber}
              </Typography>
              {!editMode && selectedItem && (
                <Typography variant="body2" color="textSecondary">{selectedItem.subject}</Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {!editMode && (
                <>
                  <Tooltip title="Schedule">
                    <IconButton onClick={() => router.push('/scheduling')}>
                      <ScheduleIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton onClick={handleStartEdit}><EditIcon /></IconButton>
                  </Tooltip>
                </>
              )}
              <IconButton onClick={() => { setDetailOpen(false); setEditMode(false); }}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedItem && editMode ? (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Subject *"
                  value={editFormData.subject}
                  onChange={(e) => setEditFormData({ ...editFormData, subject: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={editFormData.priority}
                    onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                    label="Priority"
                  >
                    <MenuItem value="LOW">Low</MenuItem>
                    <MenuItem value="MEDIUM">Medium</MenuItem>
                    <MenuItem value="HIGH">High</MenuItem>
                    <MenuItem value="CRITICAL">Critical</MenuItem>
                    <MenuItem value="EMERGENCY">Emergency</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    label="Status"
                  >
                    <MenuItem value="NEW">New</MenuItem>
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="OPEN">Open</MenuItem>
                    <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Budget"
                  type="number"
                  value={editFormData.budget}
                  onChange={(e) => setEditFormData({ ...editFormData, budget: parseFloat(e.target.value) || 0 })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Contact Name"
                  value={editFormData.contactName}
                  onChange={(e) => setEditFormData({ ...editFormData, contactName: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Contact Phone"
                  value={editFormData.contactPhone}
                  onChange={(e) => setEditFormData({ ...editFormData, contactPhone: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Contact Email"
                  type="email"
                  value={editFormData.contactEmail}
                  onChange={(e) => setEditFormData({ ...editFormData, contactEmail: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Territory</InputLabel>
                  <Select
                    value={editFormData.territoryId}
                    onChange={(e) => setEditFormData({ ...editFormData, territoryId: e.target.value })}
                    label="Territory"
                  >
                    <MenuItem value="">None</MenuItem>
                    {territories.map((t: any) => (
                      <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Work Type</InputLabel>
                  <Select
                    value={editFormData.workTypeId}
                    onChange={(e) => setEditFormData({ ...editFormData, workTypeId: e.target.value })}
                    label="Work Type"
                  >
                    <MenuItem value="">None</MenuItem>
                    {workTypes.map((wt: any) => (
                      <MenuItem key={wt.id} value={wt.id}>{wt.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Address"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="City"
                  value={editFormData.city}
                  onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="State"
                  value={editFormData.state}
                  onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                />
              </Grid>
            </Grid>
          ) : selectedItem ? (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={selectedItem.priority}
                    color={getPriorityColor(selectedItem.priority) as any}
                  />
                  <Chip
                    label={selectedItem.status.replace('_', ' ')}
                    color={getStatusColor(selectedItem.status) as any}
                  />
                  {selectedItem.workType && (
                    <Chip label={selectedItem.workType.name} variant="outlined" />
                  )}
                </Box>
              </Grid>
              {selectedItem.description && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="textSecondary">Description</Typography>
                  <Typography variant="body1" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                    {selectedItem.description}
                  </Typography>
                </Grid>
              )}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Account</Typography>
                <Typography variant="body1">{selectedItem.account?.name || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Territory</Typography>
                <Typography variant="body1">{selectedItem.territory?.name || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Contact Name</Typography>
                <Typography variant="body1">{selectedItem.contactName || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Contact Phone</Typography>
                <Typography variant="body1">{selectedItem.contactPhone || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Contact Email</Typography>
                <Typography variant="body1">{selectedItem.contactEmail || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Budget</Typography>
                <Typography variant="body1">
                  {selectedItem.budget ? formatCurrency(selectedItem.budget) : '-'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Created</Typography>
                <Typography variant="body1">{new Date(selectedItem.createdAt).toLocaleString()}</Typography>
              </Grid>
              {(selectedItem.address || selectedItem.city || selectedItem.state) && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="textSecondary">Location</Typography>
                  <Typography variant="body1">
                    {[selectedItem.address, selectedItem.city, selectedItem.state]
                      .filter(Boolean)
                      .join(', ')}
                  </Typography>
                </Grid>
              )}
            </Grid>
          ) : null}
        </DialogContent>
        <DialogActions>
          {selectedItem && (
            <Button color="error" onClick={() => handleDelete(selectedItem.id)} sx={{ mr: 'auto' }}>
              Delete
            </Button>
          )}
          {editMode ? (
            <>
              <Button onClick={() => setEditMode(false)} startIcon={<CancelIcon />}>Cancel</Button>
              <Button onClick={handleSaveEdit} variant="contained" startIcon={<SaveIcon />} disabled={!editFormData.subject}>
                Save
              </Button>
            </>
          ) : (
            <Button onClick={() => { setDetailOpen(false); setEditMode(false); }}>Close</Button>
          )}
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
