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

interface TimeSheetEntry {
  id: string;
  type: string;
  startTime: string | null;
  endTime: string | null;
  durationHours: number | null;
  description: string | null;
  timeSheet: { id: string; startDate: string; endDate: string } | null;
  resource: { id: string; name: string } | null;
  workOrder: { id: string; workOrderNumber: string; subject: string } | null;
  createdAt: string;
}

const columns: Column[] = [
  { id: 'timeSheet', label: 'Time Sheet', sortable: false },
  { id: 'resource', label: 'Resource', sortable: false },
  { id: 'workOrder', label: 'Work Order', sortable: false },
  { id: 'type', label: 'Type' },
  { id: 'startTime', label: 'Start' },
  { id: 'endTime', label: 'End' },
  { id: 'durationHours', label: 'Hours' },
  { id: 'actions', label: 'Actions', sortable: false },
];

const defaultFormData = {
  timeSheetId: '',
  resourceId: '',
  workOrderId: '',
  type: 'WORK',
  startTime: '',
  endTime: '',
  durationHours: '',
  description: '',
};

export default function TimeSheetEntriesPage() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TimeSheetEntry | null>(null);
  const [timeSheets, setTimeSheets] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [formData, setFormData] = useState({ ...defaultFormData });
  const [editFormData, setEditFormData] = useState({ ...defaultFormData });

  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: items, loading, pagination, setPage, setPageSize, setSort, refresh } = usePagination<TimeSheetEntry>({
    url: '/api/time-sheet-entries',
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
    fetchTimeSheets();
    fetchResources();
    fetchWorkOrders();
  }, []);

  const fetchTimeSheets = async () => {
    try {
      const res = await fetch('/api/time-sheets');
      const data = await res.json();
      setTimeSheets(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Error fetching time sheets:', error);
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

  const fetchWorkOrders = async () => {
    try {
      const res = await fetch('/api/work-orders');
      const data = await res.json();
      setWorkOrders(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Error fetching work orders:', error);
    }
  };

  const handleCreate = async () => {
    try {
      const payload = {
        ...formData,
        durationHours: formData.durationHours ? Number(formData.durationHours) : null,
        startTime: formData.startTime || null,
        endTime: formData.endTime || null,
      };
      const res = await fetch('/api/time-sheet-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setDialogOpen(false);
        refresh();
        setFormData({ ...defaultFormData });
        toast.showSuccess('Time sheet entry created successfully');
      } else {
        toast.showError('Failed to create time sheet entry');
      }
    } catch (error) {
      console.error('Error creating entry:', error);
      toast.showError('Error creating time sheet entry');
    }
  };

  const handleEdit = (item: TimeSheetEntry) => {
    setSelectedItem(item);
    setEditFormData({
      timeSheetId: item.timeSheet?.id || '',
      resourceId: item.resource?.id || '',
      workOrderId: item.workOrder?.id || '',
      type: item.type || 'WORK',
      startTime: item.startTime ? new Date(item.startTime).toISOString().slice(0, 16) : '',
      endTime: item.endTime ? new Date(item.endTime).toISOString().slice(0, 16) : '',
      durationHours: item.durationHours?.toString() || '',
      description: item.description || '',
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    try {
      const payload = {
        ...editFormData,
        durationHours: editFormData.durationHours ? Number(editFormData.durationHours) : null,
        startTime: editFormData.startTime || null,
        endTime: editFormData.endTime || null,
      };
      const res = await fetch(`/api/time-sheet-entries/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setEditDialogOpen(false);
        refresh();
        toast.showSuccess('Time sheet entry updated successfully');
      } else {
        toast.showError('Failed to update time sheet entry');
      }
    } catch (error) {
      console.error('Error updating entry:', error);
      toast.showError('Error updating time sheet entry');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Time Sheet Entry',
      message: 'Are you sure you want to delete this entry? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/time-sheet-entries/${id}`, { method: 'DELETE' });
      if (res.ok) {
        refresh();
        toast.showSuccess('Time sheet entry deleted successfully');
      } else {
        toast.showError('Failed to delete time sheet entry');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.showError('Error deleting time sheet entry');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'WORK': return 'primary';
      case 'TRAVEL': return 'info';
      case 'BREAK': return 'warning';
      default: return 'default';
    }
  };

  const filteredItems = items.filter((item) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      item.resource?.name?.toLowerCase().includes(s) ||
      item.workOrder?.workOrderNumber?.toLowerCase().includes(s) ||
      item.type?.toLowerCase().includes(s) ||
      item.description?.toLowerCase().includes(s)
    );
  });

  const exportData = filteredItems.map((item) => ({
    'Time Sheet': item.timeSheet ? `${new Date(item.timeSheet.startDate).toLocaleDateString()} - ${new Date(item.timeSheet.endDate).toLocaleDateString()}` : '-',
    'Resource': item.resource?.name || '-',
    'Work Order': item.workOrder?.workOrderNumber || '-',
    'Type': item.type,
    'Start': item.startTime ? new Date(item.startTime).toLocaleString() : '-',
    'End': item.endTime ? new Date(item.endTime).toLocaleString() : '-',
    'Hours': item.durationHours ?? '-',
  }));

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Time Sheet Entries</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ExportToolbar data={exportData} filename="time-sheet-entries" title="Time Sheet Entries Export" />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              New Entry
            </Button>
          </Box>
        </Box>

        <Paper sx={{ mb: 2, p: 2 }}>
          <TextField
            size="small"
            placeholder="Search entries..."
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
                      {item.timeSheet
                        ? `${new Date(item.timeSheet.startDate).toLocaleDateString()} - ${new Date(item.timeSheet.endDate).toLocaleDateString()}`
                        : '-'}
                    </TableCell>
                    <TableCell>{item.resource?.name || '-'}</TableCell>
                    <TableCell>{item.workOrder?.workOrderNumber || '-'}</TableCell>
                    <TableCell>
                      <Chip label={item.type} color={getTypeColor(item.type) as any} size="small" />
                    </TableCell>
                    <TableCell>{item.startTime ? new Date(item.startTime).toLocaleString() : '-'}</TableCell>
                    <TableCell>{item.endTime ? new Date(item.endTime).toLocaleString() : '-'}</TableCell>
                    <TableCell>{item.durationHours ?? '-'}</TableCell>
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
                    <TableCell colSpan={8} align="center">No time sheet entries found</TableCell>
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
        <DialogTitle>Create Time Sheet Entry</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Time Sheet</InputLabel>
                <Select
                  value={formData.timeSheetId}
                  onChange={(e) => setFormData({ ...formData, timeSheetId: e.target.value })}
                  label="Time Sheet"
                >
                  <MenuItem value="">None</MenuItem>
                  {timeSheets.map((ts: any) => (
                    <MenuItem key={ts.id} value={ts.id}>
                      {ts.resource?.name || 'Unknown'} ({new Date(ts.startDate).toLocaleDateString()} - {new Date(ts.endDate).toLocaleDateString()})
                    </MenuItem>
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
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  label="Type"
                >
                  <MenuItem value="WORK">Work</MenuItem>
                  <MenuItem value="TRAVEL">Travel</MenuItem>
                  <MenuItem value="BREAK">Break</MenuItem>
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
              <TextField
                fullWidth
                label="Duration (hours)"
                type="number"
                value={formData.durationHours}
                onChange={(e) => setFormData({ ...formData, durationHours: e.target.value })}
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
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Time Sheet Entry</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Time Sheet</InputLabel>
                <Select
                  value={editFormData.timeSheetId}
                  onChange={(e) => setEditFormData({ ...editFormData, timeSheetId: e.target.value })}
                  label="Time Sheet"
                >
                  <MenuItem value="">None</MenuItem>
                  {timeSheets.map((ts: any) => (
                    <MenuItem key={ts.id} value={ts.id}>
                      {ts.resource?.name || 'Unknown'} ({new Date(ts.startDate).toLocaleDateString()} - {new Date(ts.endDate).toLocaleDateString()})
                    </MenuItem>
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
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={editFormData.type}
                  onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                  label="Type"
                >
                  <MenuItem value="WORK">Work</MenuItem>
                  <MenuItem value="TRAVEL">Travel</MenuItem>
                  <MenuItem value="BREAK">Break</MenuItem>
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
              <TextField
                fullWidth
                label="Duration (hours)"
                type="number"
                value={editFormData.durationHours}
                onChange={(e) => setEditFormData({ ...editFormData, durationHours: e.target.value })}
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
