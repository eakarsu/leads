'use client';

import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableRow, IconButton, Chip, Grid, Card,
  CardContent, FormControl, InputLabel, Select, MenuItem, Tooltip,
  FormControlLabel, Checkbox,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import MapIcon from '@mui/icons-material/Map';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface ServiceTerritory {
  id: string;
  name: string;
  type: string;
  parentId: string | null;
  description: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  isActive: boolean;
  parent?: { id: string; name: string } | null;
  _count?: { children: number; members: number };
}

const columns: Column[] = [
  { id: 'name', label: 'Name' },
  { id: 'type', label: 'Type' },
  { id: 'parent', label: 'Parent', sortable: false },
  { id: 'city', label: 'City/State' },
  { id: 'isActive', label: 'Active' },
  { id: 'actions', label: 'Actions', sortable: false },
];

export default function ServiceTerritoriesPage() {
  const toast = useToast();
  const { confirm } = useConfirmDialog();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ServiceTerritory | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [territories, setTerritories] = useState<ServiceTerritory[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [formData, setFormData] = useState({
    name: '',
    type: 'PRIMARY',
    parentId: '',
    description: '',
    city: '',
    state: '',
    country: '',
    isActive: true,
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    type: 'PRIMARY',
    parentId: '',
    description: '',
    city: '',
    state: '',
    country: '',
    isActive: true,
  });

  const extraParams: Record<string, string> = {};
  if (search) extraParams.search = search;

  const {
    data: items,
    loading,
    error,
    pagination,
    setPage,
    setPageSize,
    setSort,
    refresh,
  } = usePagination<ServiceTerritory>({
    url: '/api/service-territories',
    defaultSortBy: 'name',
    defaultSortOrder: 'asc',
    extraParams,
  });

  useEffect(() => {
    fetchTerritories();
  }, []);

  const fetchTerritories = async () => {
    try {
      const response = await fetch('/api/service-territories?pageSize=200');
      const data = await response.json();
      setTerritories(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Error fetching territories:', err);
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
      const payload = { ...formData, parentId: formData.parentId || null };
      const response = await fetch('/api/service-territories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to create territory');
      setDialogOpen(false);
      toast.showSuccess('Service territory created successfully');
      refresh();
      fetchTerritories();
      resetForm();
    } catch (err: any) {
      toast.showError(err.message || 'Error creating territory');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Service Territory',
      message: 'Are you sure you want to delete this service territory? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      await fetch(`/api/service-territories/${id}`, { method: 'DELETE' });
      toast.showSuccess('Service territory deleted successfully');
      refresh();
      fetchTerritories();
    } catch (err) {
      toast.showError('Error deleting service territory');
    }
  };

  const handleStartEdit = () => {
    if (!selectedItem) return;
    setEditFormData({
      name: selectedItem.name,
      type: selectedItem.type,
      parentId: selectedItem.parentId || '',
      description: selectedItem.description || '',
      city: selectedItem.city || '',
      state: selectedItem.state || '',
      country: selectedItem.country || '',
      isActive: selectedItem.isActive,
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedItem) return;
    try {
      const payload = { ...editFormData, parentId: editFormData.parentId || null };
      const response = await fetch(`/api/service-territories/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to update territory');
      toast.showSuccess('Service territory updated successfully');
      setEditMode(false);
      setDetailOpen(false);
      refresh();
      fetchTerritories();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'PRIMARY',
      parentId: '',
      description: '',
      city: '',
      state: '',
      country: '',
      isActive: true,
    });
  };

  const stats = {
    total: pagination.totalItems,
    active: items.filter((i) => i.isActive).length,
    inactive: items.filter((i) => !i.isActive).length,
  };

  const exportData = items.map((item) => ({
    Name: item.name,
    Type: item.type,
    Parent: item.parent?.name || '-',
    City: item.city || '-',
    State: item.state || '-',
    Country: item.country || '-',
    Active: item.isActive ? 'Yes' : 'No',
  }));

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <MapIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4">Service Territories</Typography>
          </Box>
          <Box display="flex" gap={2} alignItems="center">
            <ExportToolbar data={exportData} filename="service-territories" title="Service Territories" />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              New Territory
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <MapIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Total Territories</Typography>
                </Box>
                <Typography variant="h4">{stats.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Active</Typography>
                </Box>
                <Typography variant="h4">{stats.active}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <BlockIcon color="error" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Inactive</Typography>
                </Box>
                <Typography variant="h4">{stats.inactive}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search territories..."
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
                      <Chip label={item.type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{item.parent?.name || '-'}</TableCell>
                    <TableCell>
                      {item.city || item.state
                        ? `${item.city || ''}${item.city && item.state ? ', ' : ''}${item.state || ''}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.isActive ? 'Active' : 'Inactive'}
                        color={item.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => { setSelectedItem(item); setDetailOpen(true); handleStartEdit(); }}
                        >
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
                    <TableCell colSpan={6} align="center">No service territories found</TableCell>
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
        <DialogTitle>Create New Service Territory</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  label="Type"
                >
                  <MenuItem value="PRIMARY">Primary</MenuItem>
                  <MenuItem value="SECONDARY">Secondary</MenuItem>
                  <MenuItem value="RELOCATION">Relocation</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Parent Territory</InputLabel>
                <Select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  label="Parent Territory"
                >
                  <MenuItem value="">None</MenuItem>
                  {territories.map((t) => (
                    <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
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
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={!formData.name}>
            Create Territory
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail/Edit Dialog */}
      <Dialog open={detailOpen} onClose={() => { setDetailOpen(false); setEditMode(false); }} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{editMode ? 'Edit Territory' : selectedItem?.name}</Typography>
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
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Name *"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={editFormData.type}
                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                    label="Type"
                  >
                    <MenuItem value="PRIMARY">Primary</MenuItem>
                    <MenuItem value="SECONDARY">Secondary</MenuItem>
                    <MenuItem value="RELOCATION">Relocation</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Parent Territory</InputLabel>
                  <Select
                    value={editFormData.parentId}
                    onChange={(e) => setEditFormData({ ...editFormData, parentId: e.target.value })}
                    label="Parent Territory"
                  >
                    <MenuItem value="">None</MenuItem>
                    {territories.filter((t) => t.id !== selectedItem.id).map((t) => (
                      <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Country"
                  value={editFormData.country}
                  onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={editFormData.isActive}
                      onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                    />
                  }
                  label="Active"
                />
              </Grid>
            </Grid>
          ) : selectedItem ? (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Type</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip label={selectedItem.type} variant="outlined" />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={selectedItem.isActive ? 'Active' : 'Inactive'}
                    color={selectedItem.isActive ? 'success' : 'default'}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Parent Territory</Typography>
                <Typography variant="body1">{selectedItem.parent?.name || 'None'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">City</Typography>
                <Typography variant="body1">{selectedItem.city || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">State</Typography>
                <Typography variant="body1">{selectedItem.state || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Country</Typography>
                <Typography variant="body1">{selectedItem.country || '-'}</Typography>
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
