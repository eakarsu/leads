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
import EventIcon from '@mui/icons-material/Event';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SendIcon from '@mui/icons-material/Send';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelPresentationIcon from '@mui/icons-material/CancelPresentation';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface ServiceAppointment {
  id: string;
  appointmentNumber: string;
  subject: string;
  status: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  durationMinutes: number | null;
  workOrder: { id: string; workOrderNumber: string; subject: string } | null;
  resource: { id: string; name: string } | null;
  territory: { id: string; name: string } | null;
  createdAt: string;
}

const columns: Column[] = [
  { id: 'appointmentNumber', label: 'Appt#' },
  { id: 'workOrder', label: 'Work Order', sortable: false },
  { id: 'subject', label: 'Subject' },
  { id: 'resource', label: 'Resource', sortable: false },
  { id: 'status', label: 'Status' },
  { id: 'scheduledStart', label: 'Scheduled Start' },
  { id: 'scheduledEnd', label: 'Scheduled End' },
  { id: 'actions', label: 'Actions', sortable: false },
];

const defaultFormData = {
  workOrderId: '',
  subject: '',
  status: 'NONE',
  scheduledStart: '',
  scheduledEnd: '',
  durationMinutes: '',
  resourceId: '',
  territoryId: '',
};

export default function ServiceAppointmentsPage() {
  const [stats, setStats] = useState({
    total: 0, scheduled: 0, dispatched: 0, inProgress: 0, completed: 0, cancelled: 0,
  });
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ServiceAppointment | null>(null);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [territories, setTerritories] = useState<any[]>([]);
  const [formData, setFormData] = useState({ ...defaultFormData });
  const [editFormData, setEditFormData] = useState({ ...defaultFormData });

  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: items, loading, pagination, setPage, setPageSize, setSort, refresh } = usePagination<ServiceAppointment>({
    url: '/api/service-appointments',
    defaultSortBy: 'createdAt',
  });

  const toast = useToast();
  const { confirm } = useConfirmDialog();

  const handleSort = (col: string) => {
    const newOrder = sortBy === col && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(col);
    setSortOrder(newOrder);
    setSort(col, newOrder);
  };

  useEffect(() => {
    fetchStats();
    fetchWorkOrders();
    fetchResources();
    fetchTerritories();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/service-appointments');
      const data = await res.json();
      setStats(data.stats || { total: 0, scheduled: 0, dispatched: 0, inProgress: 0, completed: 0, cancelled: 0 });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchWorkOrders = async () => {
    try {
      const res = await fetch('/api/work-orders');
      const data = await res.json();
      setWorkOrders(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Error fetching work orders:', error);
    }
  };

  const fetchResources = async () => {
    try {
      const res = await fetch('/api/service-resources');
      const data = await res.json();
      setResources(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  const fetchTerritories = async () => {
    try {
      const res = await fetch('/api/service-territories');
      const data = await res.json();
      setTerritories(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Error fetching territories:', error);
    }
  };

  const handleCreate = async () => {
    try {
      const payload = {
        ...formData,
        durationMinutes: formData.durationMinutes ? Number(formData.durationMinutes) : null,
        scheduledStart: formData.scheduledStart || null,
        scheduledEnd: formData.scheduledEnd || null,
      };
      const res = await fetch('/api/service-appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setDialogOpen(false);
        refresh();
        fetchStats();
        setFormData({ ...defaultFormData });
        toast.showSuccess('Service appointment created successfully');
      } else {
        toast.showError('Failed to create service appointment');
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.showError('Error creating service appointment');
    }
  };

  const handleEdit = (item: ServiceAppointment) => {
    setSelectedItem(item);
    setEditFormData({
      workOrderId: item.workOrder?.id || '',
      subject: item.subject || '',
      status: item.status || 'NONE',
      scheduledStart: item.scheduledStart ? new Date(item.scheduledStart).toISOString().slice(0, 16) : '',
      scheduledEnd: item.scheduledEnd ? new Date(item.scheduledEnd).toISOString().slice(0, 16) : '',
      durationMinutes: item.durationMinutes?.toString() || '',
      resourceId: item.resource?.id || '',
      territoryId: item.territory?.id || '',
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    try {
      const payload = {
        ...editFormData,
        durationMinutes: editFormData.durationMinutes ? Number(editFormData.durationMinutes) : null,
        scheduledStart: editFormData.scheduledStart || null,
        scheduledEnd: editFormData.scheduledEnd || null,
      };
      const res = await fetch(`/api/service-appointments/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setEditDialogOpen(false);
        refresh();
        fetchStats();
        toast.showSuccess('Service appointment updated successfully');
      } else {
        toast.showError('Failed to update service appointment');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.showError('Error updating service appointment');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Service Appointment',
      message: 'Are you sure you want to delete this service appointment? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/service-appointments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        refresh();
        fetchStats();
        toast.showSuccess('Service appointment deleted successfully');
      } else {
        toast.showError('Failed to delete service appointment');
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.showError('Error deleting service appointment');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NONE': return 'default';
      case 'SCHEDULED': return 'info';
      case 'DISPATCHED': return 'primary';
      case 'IN_PROGRESS': return 'warning';
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'error';
      case 'CANNOT_COMPLETE': return 'error';
      default: return 'default';
    }
  };

  const filteredItems = items.filter((item) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      item.appointmentNumber?.toLowerCase().includes(s) ||
      item.subject?.toLowerCase().includes(s) ||
      item.workOrder?.workOrderNumber?.toLowerCase().includes(s) ||
      item.resource?.name?.toLowerCase().includes(s)
    );
  });

  const exportData = filteredItems.map((item) => ({
    'Appt#': item.appointmentNumber,
    'Work Order': item.workOrder?.workOrderNumber || '-',
    'Subject': item.subject,
    'Resource': item.resource?.name || '-',
    'Status': item.status,
    'Scheduled Start': item.scheduledStart ? new Date(item.scheduledStart).toLocaleString() : '-',
    'Scheduled End': item.scheduledEnd ? new Date(item.scheduledEnd).toLocaleString() : '-',
  }));

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Service Appointments</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ExportToolbar data={exportData} filename="service-appointments" title="Service Appointments Export" />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              New Appointment
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <EventIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary" variant="body2">Total</Typography>
                </Box>
                <Typography variant="h4">{stats.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ScheduleIcon color="info" sx={{ mr: 1 }} />
                  <Typography color="textSecondary" variant="body2">Scheduled</Typography>
                </Box>
                <Typography variant="h4">{stats.scheduled}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <SendIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary" variant="body2">Dispatched</Typography>
                </Box>
                <Typography variant="h4">{stats.dispatched}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PlayArrowIcon color="warning" sx={{ mr: 1 }} />
                  <Typography color="textSecondary" variant="body2">In Progress</Typography>
                </Box>
                <Typography variant="h4">{stats.inProgress}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                  <Typography color="textSecondary" variant="body2">Completed</Typography>
                </Box>
                <Typography variant="h4">{stats.completed}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CancelPresentationIcon color="error" sx={{ mr: 1 }} />
                  <Typography color="textSecondary" variant="body2">Cancelled</Typography>
                </Box>
                <Typography variant="h4">{stats.cancelled}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Paper sx={{ mb: 2, p: 2 }}>
          <TextField
            size="small"
            placeholder="Search appointments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 300 }}
          />
        </Paper>

        {loading ? (
          <TableSkeleton rows={8} columns={8} />
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <SortableTableHead columns={columns} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleEdit(item)}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color="primary">{item.appointmentNumber}</Typography>
                    </TableCell>
                    <TableCell>{item.workOrder?.workOrderNumber || '-'}</TableCell>
                    <TableCell>{item.subject}</TableCell>
                    <TableCell>{item.resource?.name || '-'}</TableCell>
                    <TableCell>
                      <Chip label={item.status.replace(/_/g, ' ')} color={getStatusColor(item.status) as any} size="small" />
                    </TableCell>
                    <TableCell>{item.scheduledStart ? new Date(item.scheduledStart).toLocaleString() : '-'}</TableCell>
                    <TableCell>{item.scheduledEnd ? new Date(item.scheduledEnd).toLocaleString() : '-'}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit(item)}><EditIcon /></IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}><DeleteIcon /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">No service appointments found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <PaginationControls
              page={pagination.page}
              pageSize={pagination.pageSize}
              totalItems={pagination.totalItems}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </TableContainer>
        )}
      </Box>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Service Appointment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Work Order</InputLabel>
                <Select
                  value={formData.workOrderId}
                  onChange={(e) => setFormData({ ...formData, workOrderId: e.target.value })}
                  label="Work Order"
                >
                  <MenuItem value="">None</MenuItem>
                  {workOrders.map((wo: any) => (
                    <MenuItem key={wo.id} value={wo.id}>{wo.workOrderNumber} - {wo.subject}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Subject *"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="NONE">None</MenuItem>
                  <MenuItem value="SCHEDULED">Scheduled</MenuItem>
                  <MenuItem value="DISPATCHED">Dispatched</MenuItem>
                  <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  <MenuItem value="CANNOT_COMPLETE">Cannot Complete</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Duration (minutes)"
                type="number"
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Scheduled Start"
                type="datetime-local"
                value={formData.scheduledStart}
                onChange={(e) => setFormData({ ...formData, scheduledStart: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Scheduled End"
                type="datetime-local"
                value={formData.scheduledEnd}
                onChange={(e) => setFormData({ ...formData, scheduledEnd: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Resource</InputLabel>
                <Select
                  value={formData.resourceId}
                  onChange={(e) => setFormData({ ...formData, resourceId: e.target.value })}
                  label="Resource"
                >
                  <MenuItem value="">None</MenuItem>
                  {resources.map((r: any) => (
                    <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
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
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={!formData.subject}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Service Appointment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Work Order</InputLabel>
                <Select
                  value={editFormData.workOrderId}
                  onChange={(e) => setEditFormData({ ...editFormData, workOrderId: e.target.value })}
                  label="Work Order"
                >
                  <MenuItem value="">None</MenuItem>
                  {workOrders.map((wo: any) => (
                    <MenuItem key={wo.id} value={wo.id}>{wo.workOrderNumber} - {wo.subject}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Subject *"
                value={editFormData.subject}
                onChange={(e) => setEditFormData({ ...editFormData, subject: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="NONE">None</MenuItem>
                  <MenuItem value="SCHEDULED">Scheduled</MenuItem>
                  <MenuItem value="DISPATCHED">Dispatched</MenuItem>
                  <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  <MenuItem value="CANNOT_COMPLETE">Cannot Complete</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Duration (minutes)"
                type="number"
                value={editFormData.durationMinutes}
                onChange={(e) => setEditFormData({ ...editFormData, durationMinutes: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Scheduled Start"
                type="datetime-local"
                value={editFormData.scheduledStart}
                onChange={(e) => setEditFormData({ ...editFormData, scheduledStart: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Scheduled End"
                type="datetime-local"
                value={editFormData.scheduledEnd}
                onChange={(e) => setEditFormData({ ...editFormData, scheduledEnd: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Resource</InputLabel>
                <Select
                  value={editFormData.resourceId}
                  onChange={(e) => setEditFormData({ ...editFormData, resourceId: e.target.value })}
                  label="Resource"
                >
                  <MenuItem value="">None</MenuItem>
                  {resources.map((r: any) => (
                    <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
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
          </Grid>
        </DialogContent>
        <DialogActions>
          {selectedItem && (
            <Button color="error" onClick={() => handleDelete(selectedItem.id)} sx={{ mr: 'auto' }}>
              Delete
            </Button>
          )}
          <Button onClick={() => setEditDialogOpen(false)} startIcon={<CancelIcon />}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained" startIcon={<SaveIcon />} disabled={!editFormData.subject}>Save</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
