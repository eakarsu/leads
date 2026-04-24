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

interface TimeSheet {
  id: string;
  startDate: string;
  endDate: string;
  totalHours: number | null;
  status: string;
  resource: { id: string; name: string } | null;
  _count?: { entries: number };
  createdAt: string;
}

const columns: Column[] = [
  { id: 'resource', label: 'Resource', sortable: false },
  { id: 'startDate', label: 'Start Date' },
  { id: 'endDate', label: 'End Date' },
  { id: 'totalHours', label: 'Total Hours' },
  { id: 'entries', label: 'Entries', sortable: false },
  { id: 'status', label: 'Status' },
  { id: 'actions', label: 'Actions', sortable: false },
];

const defaultFormData = {
  resourceId: '',
  startDate: '',
  endDate: '',
  totalHours: '',
  status: 'NEW',
};

export default function TimeSheetsPage() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TimeSheet | null>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [formData, setFormData] = useState({ ...defaultFormData });
  const [editFormData, setEditFormData] = useState({ ...defaultFormData });

  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: items, loading, pagination, setPage, setPageSize, setSort, refresh } = usePagination<TimeSheet>({
    url: '/api/time-sheets',
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
    fetchResources();
  }, []);

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
        totalHours: formData.totalHours ? Number(formData.totalHours) : null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      };
      const res = await fetch('/api/time-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setDialogOpen(false);
        refresh();
        setFormData({ ...defaultFormData });
        toast.showSuccess('Time sheet created successfully');
      } else {
        toast.showError('Failed to create time sheet');
      }
    } catch (error) {
      console.error('Error creating time sheet:', error);
      toast.showError('Error creating time sheet');
    }
  };

  const handleEdit = (item: TimeSheet) => {
    setSelectedItem(item);
    setEditFormData({
      resourceId: item.resource?.id || '',
      startDate: item.startDate ? new Date(item.startDate).toISOString().slice(0, 10) : '',
      endDate: item.endDate ? new Date(item.endDate).toISOString().slice(0, 10) : '',
      totalHours: item.totalHours?.toString() || '',
      status: item.status || 'NEW',
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    try {
      const payload = {
        ...editFormData,
        totalHours: editFormData.totalHours ? Number(editFormData.totalHours) : null,
        startDate: editFormData.startDate || null,
        endDate: editFormData.endDate || null,
      };
      const res = await fetch(`/api/time-sheets/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setEditDialogOpen(false);
        refresh();
        toast.showSuccess('Time sheet updated successfully');
      } else {
        toast.showError('Failed to update time sheet');
      }
    } catch (error) {
      console.error('Error updating time sheet:', error);
      toast.showError('Error updating time sheet');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Time Sheet',
      message: 'Are you sure you want to delete this time sheet? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/time-sheets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        refresh();
        toast.showSuccess('Time sheet deleted successfully');
      } else {
        toast.showError('Failed to delete time sheet');
      }
    } catch (error) {
      console.error('Error deleting time sheet:', error);
      toast.showError('Error deleting time sheet');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'info';
      case 'SUBMITTED': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  const filteredItems = items.filter((item) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      item.resource?.name?.toLowerCase().includes(s) ||
      item.status?.toLowerCase().includes(s)
    );
  });

  const exportData = filteredItems.map((item) => ({
    'Resource': item.resource?.name || '-',
    'Start Date': item.startDate ? new Date(item.startDate).toLocaleDateString() : '-',
    'End Date': item.endDate ? new Date(item.endDate).toLocaleDateString() : '-',
    'Total Hours': item.totalHours ?? '-',
    'Entries': item._count?.entries ?? 0,
    'Status': item.status,
  }));

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Time Sheets</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ExportToolbar data={exportData} filename="time-sheets" title="Time Sheets Export" />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              New Time Sheet
            </Button>
          </Box>
        </Box>

        <Paper sx={{ mb: 2, p: 2 }}>
          <TextField
            size="small"
            placeholder="Search time sheets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 300 }}
          />
        </Paper>

        {loading ? (
          <TableSkeleton rows={8} columns={7} />
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <SortableTableHead columns={columns} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleEdit(item)}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">{item.resource?.name || '-'}</Typography>
                    </TableCell>
                    <TableCell>{item.startDate ? new Date(item.startDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{item.endDate ? new Date(item.endDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{item.totalHours ?? '-'}</TableCell>
                    <TableCell>{item._count?.entries ?? 0}</TableCell>
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
                    <TableCell colSpan={7} align="center">No time sheets found</TableCell>
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
        <DialogTitle>Create Time Sheet</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
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
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="NEW">New</MenuItem>
                  <MenuItem value="SUBMITTED">Submitted</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Total Hours"
                type="number"
                value={formData.totalHours}
                onChange={(e) => setFormData({ ...formData, totalHours: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Time Sheet</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
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
                <InputLabel>Status</InputLabel>
                <Select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="NEW">New</MenuItem>
                  <MenuItem value="SUBMITTED">Submitted</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={editFormData.startDate}
                onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={editFormData.endDate}
                onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Total Hours"
                type="number"
                value={editFormData.totalHours}
                onChange={(e) => setEditFormData({ ...editFormData, totalHours: e.target.value })}
              />
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
          <Button onClick={handleUpdate} variant="contained" startIcon={<SaveIcon />}>Save</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
