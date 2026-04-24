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

interface WorkOrderLineItem {
  id: string;
  lineItemNumber: string;
  description: string | null;
  status: string;
  durationMinutes: number | null;
  workOrder: { id: string; workOrderNumber: string; subject: string } | null;
  workType: { id: string; name: string } | null;
  createdAt: string;
}

const columns: Column[] = [
  { id: 'lineItemNumber', label: 'Line #' },
  { id: 'workOrder', label: 'Work Order', sortable: false },
  { id: 'description', label: 'Description' },
  { id: 'workType', label: 'Work Type', sortable: false },
  { id: 'status', label: 'Status' },
  { id: 'durationMinutes', label: 'Duration (min)' },
  { id: 'actions', label: 'Actions', sortable: false },
];

const defaultFormData = {
  workOrderId: '',
  lineItemNumber: '',
  description: '',
  workTypeId: '',
  status: 'NEW',
  durationMinutes: '',
};

export default function WorkOrderLineItemsPage() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WorkOrderLineItem | null>(null);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [workTypes, setWorkTypes] = useState<any[]>([]);
  const [formData, setFormData] = useState({ ...defaultFormData });
  const [editFormData, setEditFormData] = useState({ ...defaultFormData });

  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: items, loading, pagination, setPage, setPageSize, setSort, refresh } = usePagination<WorkOrderLineItem>({
    url: '/api/work-order-line-items',
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
    fetchWorkOrders();
    fetchWorkTypes();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      const res = await fetch('/api/work-orders');
      const data = await res.json();
      setWorkOrders(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Error fetching work orders:', error);
    }
  };

  const fetchWorkTypes = async () => {
    try {
      const res = await fetch('/api/work-types');
      const data = await res.json();
      setWorkTypes(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Error fetching work types:', error);
    }
  };

  const handleCreate = async () => {
    try {
      const payload = {
        ...formData,
        durationMinutes: formData.durationMinutes ? Number(formData.durationMinutes) : null,
      };
      const res = await fetch('/api/work-order-line-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setDialogOpen(false);
        refresh();
        setFormData({ ...defaultFormData });
        toast.showSuccess('Work order line item created successfully');
      } else {
        toast.showError('Failed to create line item');
      }
    } catch (error) {
      console.error('Error creating line item:', error);
      toast.showError('Error creating line item');
    }
  };

  const handleEdit = (item: WorkOrderLineItem) => {
    setSelectedItem(item);
    setEditFormData({
      workOrderId: item.workOrder?.id || '',
      lineItemNumber: item.lineItemNumber || '',
      description: item.description || '',
      workTypeId: item.workType?.id || '',
      status: item.status || 'NEW',
      durationMinutes: item.durationMinutes?.toString() || '',
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    try {
      const payload = {
        ...editFormData,
        durationMinutes: editFormData.durationMinutes ? Number(editFormData.durationMinutes) : null,
      };
      const res = await fetch(`/api/work-order-line-items/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setEditDialogOpen(false);
        refresh();
        toast.showSuccess('Line item updated successfully');
      } else {
        toast.showError('Failed to update line item');
      }
    } catch (error) {
      console.error('Error updating line item:', error);
      toast.showError('Error updating line item');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Line Item',
      message: 'Are you sure you want to delete this line item? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/work-order-line-items/${id}`, { method: 'DELETE' });
      if (res.ok) {
        refresh();
        toast.showSuccess('Line item deleted successfully');
      } else {
        toast.showError('Failed to delete line item');
      }
    } catch (error) {
      console.error('Error deleting line item:', error);
      toast.showError('Error deleting line item');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'info';
      case 'IN_PROGRESS': return 'warning';
      case 'COMPLETED': return 'success';
      default: return 'default';
    }
  };

  const filteredItems = items.filter((item) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      item.lineItemNumber?.toLowerCase().includes(s) ||
      item.description?.toLowerCase().includes(s) ||
      item.workOrder?.workOrderNumber?.toLowerCase().includes(s) ||
      item.workOrder?.subject?.toLowerCase().includes(s)
    );
  });

  const exportData = filteredItems.map((item) => ({
    'Line #': item.lineItemNumber,
    'Work Order': item.workOrder?.workOrderNumber || '-',
    'Description': item.description || '-',
    'Work Type': item.workType?.name || '-',
    'Status': item.status,
    'Duration (min)': item.durationMinutes ?? '-',
  }));

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Work Order Line Items</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ExportToolbar data={exportData} filename="work-order-line-items" title="Work Order Line Items Export" />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              New Line Item
            </Button>
          </Box>
        </Box>

        <Paper sx={{ mb: 2, p: 2 }}>
          <TextField
            size="small"
            placeholder="Search line items..."
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
                      <Typography variant="body2" fontWeight="bold">{item.lineItemNumber}</Typography>
                    </TableCell>
                    <TableCell>{item.workOrder?.workOrderNumber || '-'}</TableCell>
                    <TableCell>{item.description || '-'}</TableCell>
                    <TableCell>{item.workType?.name || '-'}</TableCell>
                    <TableCell>
                      <Chip label={item.status.replace('_', ' ')} color={getStatusColor(item.status) as any} size="small" />
                    </TableCell>
                    <TableCell>{item.durationMinutes ?? '-'}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit(item)}>
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
                {filteredItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">No line items found</TableCell>
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
        <DialogTitle>Create Work Order Line Item</DialogTitle>
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
                label="Line Item Number"
                value={formData.lineItemNumber}
                onChange={(e) => setFormData({ ...formData, lineItemNumber: e.target.value })}
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
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="NEW">New</MenuItem>
                  <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
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
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Work Order Line Item</DialogTitle>
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
                label="Line Item Number"
                value={editFormData.lineItemNumber}
                onChange={(e) => setEditFormData({ ...editFormData, lineItemNumber: e.target.value })}
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
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="NEW">New</MenuItem>
                  <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
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
