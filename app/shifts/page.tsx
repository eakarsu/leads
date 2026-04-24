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
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface Shift {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  timeSlotType: string;
  status: string;
  territory: { id: string; name: string } | null;
  resource: { id: string; name: string } | null;
  createdAt: string;
}

const columns: Column[] = [
  { id: 'label', label: 'Label' },
  { id: 'territory', label: 'Territory', sortable: false },
  { id: 'resource', label: 'Resource', sortable: false },
  { id: 'startTime', label: 'Start' },
  { id: 'endTime', label: 'End' },
  { id: 'timeSlotType', label: 'Type' },
  { id: 'status', label: 'Status' },
  { id: 'actions', label: 'Actions', sortable: false },
];

const defaultFormData = {
  label: '',
  territoryId: '',
  resourceId: '',
  startTime: '',
  endTime: '',
  timeSlotType: 'NORMAL',
  status: 'CONFIRMED',
};

export default function ShiftsPage() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Shift | null>(null);
  const [territories, setTerritories] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [formData, setFormData] = useState({ ...defaultFormData });
  const [editFormData, setEditFormData] = useState({ ...defaultFormData });

  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: items, loading, pagination, setPage, setPageSize, setSort, refresh } = usePagination<Shift>({
    url: '/api/shifts',
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
    fetchTerritories();
    fetchResources();
  }, []);

  const fetchTerritories = async () => {
    try {
      const res = await fetch('/api/service-territories');
      const data = await res.json();
      setTerritories(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Error fetching territories:', error);
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

  const handleCreate = async () => {
    try {
      const payload = {
        ...formData,
        startTime: formData.startTime || null,
        endTime: formData.endTime || null,
      };
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setDialogOpen(false);
        refresh();
        setFormData({ ...defaultFormData });
        toast.showSuccess('Shift created successfully');
      } else {
        toast.showError('Failed to create shift');
      }
    } catch (error) {
      console.error('Error creating shift:', error);
      toast.showError('Error creating shift');
    }
  };

  const handleEdit = (item: Shift) => {
    setSelectedItem(item);
    setEditFormData({
      label: item.label || '',
      territoryId: item.territory?.id || '',
      resourceId: item.resource?.id || '',
      startTime: item.startTime ? new Date(item.startTime).toISOString().slice(0, 16) : '',
      endTime: item.endTime ? new Date(item.endTime).toISOString().slice(0, 16) : '',
      timeSlotType: item.timeSlotType || 'NORMAL',
      status: item.status || 'CONFIRMED',
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    try {
      const payload = {
        ...editFormData,
        startTime: editFormData.startTime || null,
        endTime: editFormData.endTime || null,
      };
      const res = await fetch(`/api/shifts/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setEditDialogOpen(false);
        refresh();
        toast.showSuccess('Shift updated successfully');
      } else {
        toast.showError('Failed to update shift');
      }
    } catch (error) {
      console.error('Error updating shift:', error);
      toast.showError('Error updating shift');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Shift',
      message: 'Are you sure you want to delete this shift? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/shifts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        refresh();
        toast.showSuccess('Shift deleted successfully');
      } else {
        toast.showError('Failed to delete shift');
      }
    } catch (error) {
      console.error('Error deleting shift:', error);
      toast.showError('Error deleting shift');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'NORMAL': return 'default';
      case 'EXTENDED': return 'info';
      case 'ON_CALL': return 'warning';
      case 'BREAK': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const filteredItems = items.filter((item) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      item.label?.toLowerCase().includes(s) ||
      item.territory?.name?.toLowerCase().includes(s) ||
      item.resource?.name?.toLowerCase().includes(s)
    );
  });

  const exportData = filteredItems.map((item) => ({
    'Label': item.label,
    'Territory': item.territory?.name || '-',
    'Resource': item.resource?.name || '-',
    'Start': item.startTime ? new Date(item.startTime).toLocaleString() : '-',
    'End': item.endTime ? new Date(item.endTime).toLocaleString() : '-',
    'Type': item.timeSlotType,
    'Status': item.status,
  }));

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Shifts</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ExportToolbar data={exportData} filename="shifts" title="Shifts Export" />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              New Shift
            </Button>
          </Box>
        </Box>

        <Paper sx={{ mb: 2, p: 2 }}>
          <TextField
            size="small"
            placeholder="Search shifts..."
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
                      <Typography variant="body2" fontWeight="bold">{item.label}</Typography>
                    </TableCell>
                    <TableCell>{item.territory?.name || '-'}</TableCell>
                    <TableCell>{item.resource?.name || '-'}</TableCell>
                    <TableCell>{item.startTime ? new Date(item.startTime).toLocaleString() : '-'}</TableCell>
                    <TableCell>{item.endTime ? new Date(item.endTime).toLocaleString() : '-'}</TableCell>
                    <TableCell>
                      <Chip label={item.timeSlotType.replace(/_/g, ' ')} color={getTypeColor(item.timeSlotType) as any} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip label={item.status} color={getStatusColor(item.status) as any} size="small" />
                    </TableCell>
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
                    <TableCell colSpan={8} align="center">No shifts found</TableCell>
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
        <DialogTitle>Create Shift</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Label *"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              />
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
              <TextField
                fullWidth
                label="Start Time"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="End Time"
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Time Slot Type</InputLabel>
                <Select
                  value={formData.timeSlotType}
                  onChange={(e) => setFormData({ ...formData, timeSlotType: e.target.value })}
                  label="Time Slot Type"
                >
                  <MenuItem value="NORMAL">Normal</MenuItem>
                  <MenuItem value="EXTENDED">Extended</MenuItem>
                  <MenuItem value="ON_CALL">On Call</MenuItem>
                  <MenuItem value="BREAK">Break</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={!formData.label}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Shift</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Label *"
                value={editFormData.label}
                onChange={(e) => setEditFormData({ ...editFormData, label: e.target.value })}
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
              <TextField
                fullWidth
                label="Start Time"
                type="datetime-local"
                value={editFormData.startTime}
                onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="End Time"
                type="datetime-local"
                value={editFormData.endTime}
                onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Time Slot Type</InputLabel>
                <Select
                  value={editFormData.timeSlotType}
                  onChange={(e) => setEditFormData({ ...editFormData, timeSlotType: e.target.value })}
                  label="Time Slot Type"
                >
                  <MenuItem value="NORMAL">Normal</MenuItem>
                  <MenuItem value="EXTENDED">Extended</MenuItem>
                  <MenuItem value="ON_CALL">On Call</MenuItem>
                  <MenuItem value="BREAK">Break</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
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
          <Button onClick={handleUpdate} variant="contained" startIcon={<SaveIcon />} disabled={!editFormData.label}>Save</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
