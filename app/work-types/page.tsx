'use client';

import { useState } from 'react';
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
import CategoryIcon from '@mui/icons-material/Category';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface WorkType {
  id: string;
  name: string;
  estimatedDurationMinutes: number | null;
  skillRequirement: string | null;
  blockTimeBefore: number | null;
  blockTimeAfter: number | null;
}

const columns: Column[] = [
  { id: 'name', label: 'Name' },
  { id: 'estimatedDurationMinutes', label: 'Duration (min)' },
  { id: 'skillRequirement', label: 'Skill Required' },
  { id: 'blockTimeBefore', label: 'Block Before' },
  { id: 'blockTimeAfter', label: 'Block After' },
  { id: 'actions', label: 'Actions', sortable: false },
];

export default function WorkTypesPage() {
  const toast = useToast();
  const { confirm } = useConfirmDialog();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WorkType | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [formData, setFormData] = useState({
    name: '',
    estimatedDurationMinutes: 60,
    skillRequirement: '',
    blockTimeBefore: 0,
    blockTimeAfter: 0,
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    estimatedDurationMinutes: 60,
    skillRequirement: '',
    blockTimeBefore: 0,
    blockTimeAfter: 0,
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
  } = usePagination<WorkType>({
    url: '/api/work-types',
    defaultSortBy: 'name',
    defaultSortOrder: 'asc',
    extraParams,
  });

  const handleSort = (columnId: string) => {
    const newOrder = sortBy === columnId && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(columnId);
    setSortOrder(newOrder);
    setSort(columnId, newOrder);
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/work-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to create work type');
      setDialogOpen(false);
      toast.showSuccess('Work type created successfully');
      refresh();
      resetForm();
    } catch (err: any) {
      toast.showError(err.message || 'Error creating work type');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Work Type',
      message: 'Are you sure you want to delete this work type? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      await fetch(`/api/work-types/${id}`, { method: 'DELETE' });
      toast.showSuccess('Work type deleted successfully');
      refresh();
    } catch (err) {
      toast.showError('Error deleting work type');
    }
  };

  const handleStartEdit = () => {
    if (!selectedItem) return;
    setEditFormData({
      name: selectedItem.name,
      estimatedDurationMinutes: selectedItem.estimatedDurationMinutes || 60,
      skillRequirement: selectedItem.skillRequirement || '',
      blockTimeBefore: selectedItem.blockTimeBefore || 0,
      blockTimeAfter: selectedItem.blockTimeAfter || 0,
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedItem) return;
    try {
      const response = await fetch(`/api/work-types/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      if (!response.ok) throw new Error('Failed to update work type');
      toast.showSuccess('Work type updated successfully');
      setEditMode(false);
      setDetailOpen(false);
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      estimatedDurationMinutes: 60,
      skillRequirement: '',
      blockTimeBefore: 0,
      blockTimeAfter: 0,
    });
  };

  const formatMinutes = (minutes: number | null) => {
    if (minutes === null || minutes === 0) return '-';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const exportData = items.map((item) => ({
    Name: item.name,
    'Duration (min)': item.estimatedDurationMinutes || '-',
    'Skill Required': item.skillRequirement || '-',
    'Block Before (min)': item.blockTimeBefore || '-',
    'Block After (min)': item.blockTimeAfter || '-',
  }));

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CategoryIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4">Work Types</Typography>
          </Box>
          <Box display="flex" gap={2} alignItems="center">
            <ExportToolbar data={exportData} filename="work-types" title="Work Types" />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              New Work Type
            </Button>
          </Box>
        </Box>

        {/* Search */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search work types..."
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
                      <Typography variant="body2" fontWeight="bold">{item.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={formatMinutes(item.estimatedDurationMinutes)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{item.skillRequirement || '-'}</TableCell>
                    <TableCell>{item.blockTimeBefore ? `${item.blockTimeBefore} min` : '-'}</TableCell>
                    <TableCell>{item.blockTimeAfter ? `${item.blockTimeAfter} min` : '-'}</TableCell>
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
                    <TableCell colSpan={6} align="center">No work types found</TableCell>
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
        <DialogTitle>Create New Work Type</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Estimated Duration (minutes)"
                type="number"
                value={formData.estimatedDurationMinutes}
                onChange={(e) => setFormData({ ...formData, estimatedDurationMinutes: parseInt(e.target.value) || 0 })}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Skill Requirement"
                value={formData.skillRequirement}
                onChange={(e) => setFormData({ ...formData, skillRequirement: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Block Time Before (minutes)"
                type="number"
                value={formData.blockTimeBefore}
                onChange={(e) => setFormData({ ...formData, blockTimeBefore: parseInt(e.target.value) || 0 })}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Block Time After (minutes)"
                type="number"
                value={formData.blockTimeAfter}
                onChange={(e) => setFormData({ ...formData, blockTimeAfter: parseInt(e.target.value) || 0 })}
                inputProps={{ min: 0 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={!formData.name}>
            Create Work Type
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail/Edit Dialog */}
      <Dialog open={detailOpen} onClose={() => { setDetailOpen(false); setEditMode(false); }} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{editMode ? 'Edit Work Type' : selectedItem?.name}</Typography>
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
                <TextField
                  fullWidth
                  label="Name *"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Estimated Duration (minutes)"
                  type="number"
                  value={editFormData.estimatedDurationMinutes}
                  onChange={(e) => setEditFormData({ ...editFormData, estimatedDurationMinutes: parseInt(e.target.value) || 0 })}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Skill Requirement"
                  value={editFormData.skillRequirement}
                  onChange={(e) => setEditFormData({ ...editFormData, skillRequirement: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Block Time Before (minutes)"
                  type="number"
                  value={editFormData.blockTimeBefore}
                  onChange={(e) => setEditFormData({ ...editFormData, blockTimeBefore: parseInt(e.target.value) || 0 })}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Block Time After (minutes)"
                  type="number"
                  value={editFormData.blockTimeAfter}
                  onChange={(e) => setEditFormData({ ...editFormData, blockTimeAfter: parseInt(e.target.value) || 0 })}
                  inputProps={{ min: 0 }}
                />
              </Grid>
            </Grid>
          ) : selectedItem ? (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Estimated Duration</Typography>
                <Typography variant="h5">{formatMinutes(selectedItem.estimatedDurationMinutes)}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Skill Requirement</Typography>
                <Typography variant="body1">{selectedItem.skillRequirement || 'None'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Block Time Before</Typography>
                <Typography variant="body1">
                  {selectedItem.blockTimeBefore ? `${selectedItem.blockTimeBefore} minutes` : 'None'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Block Time After</Typography>
                <Typography variant="body1">
                  {selectedItem.blockTimeAfter ? `${selectedItem.blockTimeAfter} minutes` : 'None'}
                </Typography>
              </Grid>
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
              <Button onClick={handleSaveEdit} variant="contained" startIcon={<SaveIcon />} disabled={!editFormData.name}>
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
