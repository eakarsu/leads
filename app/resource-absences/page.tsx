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
import EventBusyIcon from '@mui/icons-material/EventBusy';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface ResourceAbsence {
  id: string;
  resourceId: string;
  type: string;
  startTime: string;
  endTime: string;
  description: string | null;
  approvedBy: string | null;
  resource?: { id: string; name: string } | null;
}

const columns: Column[] = [
  { id: 'resource', label: 'Resource', sortable: false },
  { id: 'type', label: 'Type' },
  { id: 'startTime', label: 'Start' },
  { id: 'endTime', label: 'End' },
  { id: 'approvedBy', label: 'Approved By' },
  { id: 'actions', label: 'Actions', sortable: false },
];

export default function ResourceAbsencesPage() {
  const toast = useToast();
  const { confirm } = useConfirmDialog();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ResourceAbsence | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [resources, setResources] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('startTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [formData, setFormData] = useState({
    resourceId: '',
    type: 'VACATION',
    startTime: '',
    endTime: '',
    description: '',
  });

  const [editFormData, setEditFormData] = useState({
    resourceId: '',
    type: 'VACATION',
    startTime: '',
    endTime: '',
    description: '',
  });

  const extraParams: Record<string, string> = {};
  if (search) extraParams.search = search;

  const {
    data: items,
    loading,
    pagination,
    setPage,
    setPageSize,
    setSort,
    refresh,
  } = usePagination<ResourceAbsence>({
    url: '/api/resource-absences',
    defaultSortBy: 'startTime',
    defaultSortOrder: 'desc',
    extraParams,
  });

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const response = await fetch('/api/service-resources?pageSize=200');
      const data = await response.json();
      setResources(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Error fetching resources:', err);
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
      const response = await fetch('/api/resource-absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to create absence');
      setDialogOpen(false);
      toast.showSuccess('Resource absence created successfully');
      refresh();
      resetForm();
    } catch (err: any) {
      toast.showError(err.message || 'Error creating absence');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Absence',
      message: 'Are you sure you want to delete this absence record? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      await fetch(`/api/resource-absences/${id}`, { method: 'DELETE' });
      toast.showSuccess('Absence deleted successfully');
      refresh();
    } catch (err) {
      toast.showError('Error deleting absence');
    }
  };

  const handleStartEdit = () => {
    if (!selectedItem) return;
    setEditFormData({
      resourceId: selectedItem.resourceId,
      type: selectedItem.type,
      startTime: selectedItem.startTime ? new Date(selectedItem.startTime).toISOString().slice(0, 16) : '',
      endTime: selectedItem.endTime ? new Date(selectedItem.endTime).toISOString().slice(0, 16) : '',
      description: selectedItem.description || '',
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedItem) return;
    try {
      const response = await fetch(`/api/resource-absences/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      if (!response.ok) throw new Error('Failed to update absence');
      toast.showSuccess('Absence updated successfully');
      setEditMode(false);
      setDetailOpen(false);
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      resourceId: '',
      type: 'VACATION',
      startTime: '',
      endTime: '',
      description: '',
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'VACATION': return 'primary';
      case 'SICK': return 'error';
      case 'PERSONAL': return 'info';
      case 'TRAINING': return 'success';
      case 'OTHER': return 'default';
      default: return 'default';
    }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  const exportData = items.map((item) => ({
    Resource: item.resource?.name || '-',
    Type: item.type,
    Start: formatDateTime(item.startTime),
    End: formatDateTime(item.endTime),
    Description: item.description || '-',
    'Approved By': item.approvedBy || '-',
  }));

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EventBusyIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4">Resource Absences</Typography>
          </Box>
          <Box display="flex" gap={2} alignItems="center">
            <ExportToolbar data={exportData} filename="resource-absences" title="Resource Absences" />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              New Absence
            </Button>
          </Box>
        </Box>

        {/* Search */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search absences..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Paper>

        {/* Table */}
        {loading ? (
          <TableSkeleton rows={5} columns={6} />
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
                      <Typography variant="body2" fontWeight="bold">
                        {item.resource?.name || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.type}
                        color={getTypeColor(item.type) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDateTime(item.startTime)}</TableCell>
                    <TableCell>{formatDateTime(item.endTime)}</TableCell>
                    <TableCell>{item.approvedBy || '-'}</TableCell>
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
                    <TableCell colSpan={6} align="center">No absences found</TableCell>
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
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Absence</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Resource *</InputLabel>
                <Select
                  value={formData.resourceId}
                  onChange={(e) => setFormData({ ...formData, resourceId: e.target.value })}
                  label="Resource *"
                >
                  {resources.map((r: any) => (
                    <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  label="Type"
                >
                  <MenuItem value="VACATION">Vacation</MenuItem>
                  <MenuItem value="SICK">Sick</MenuItem>
                  <MenuItem value="PERSONAL">Personal</MenuItem>
                  <MenuItem value="TRAINING">Training</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Start Time *"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="End Time *"
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
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
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={!formData.resourceId || !formData.startTime || !formData.endTime}
          >
            Create Absence
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail/Edit Dialog */}
      <Dialog open={detailOpen} onClose={() => { setDetailOpen(false); setEditMode(false); }} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{editMode ? 'Edit Absence' : 'Absence Details'}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {!editMode && (
                <Tooltip title="Edit">
                  <IconButton onClick={handleStartEdit}><EditIcon /></IconButton>
                </Tooltip>
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
                <FormControl fullWidth>
                  <InputLabel>Resource *</InputLabel>
                  <Select
                    value={editFormData.resourceId}
                    onChange={(e) => setEditFormData({ ...editFormData, resourceId: e.target.value })}
                    label="Resource *"
                  >
                    {resources.map((r: any) => (
                      <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={editFormData.type}
                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                    label="Type"
                  >
                    <MenuItem value="VACATION">Vacation</MenuItem>
                    <MenuItem value="SICK">Sick</MenuItem>
                    <MenuItem value="PERSONAL">Personal</MenuItem>
                    <MenuItem value="TRAINING">Training</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Start Time *"
                  type="datetime-local"
                  value={editFormData.startTime}
                  onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="End Time *"
                  type="datetime-local"
                  value={editFormData.endTime}
                  onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
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
          ) : selectedItem ? (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Resource</Typography>
                <Typography variant="body1" fontWeight="bold">{selectedItem.resource?.name || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Type</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={selectedItem.type}
                    color={getTypeColor(selectedItem.type) as any}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Start Time</Typography>
                <Typography variant="body1">{formatDateTime(selectedItem.startTime)}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">End Time</Typography>
                <Typography variant="body1">{formatDateTime(selectedItem.endTime)}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Approved By</Typography>
                <Typography variant="body1">{selectedItem.approvedBy || 'Pending'}</Typography>
              </Grid>
              {selectedItem.description && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="textSecondary">Description</Typography>
                  <Typography variant="body1" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                    {selectedItem.description}
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
              <Button
                onClick={handleSaveEdit}
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={!editFormData.resourceId || !editFormData.startTime || !editFormData.endTime}
              >
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
