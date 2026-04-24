'use client';

import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableRow, IconButton, Chip, Grid, Card,
  CardContent, FormControl, InputLabel, Select, MenuItem, Tooltip,
  FormControlLabel, Checkbox, Rating,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import EngineeringIcon from '@mui/icons-material/Engineering';
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

interface ServiceResource {
  id: string;
  name: string;
  resourceType: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  territoryId: string | null;
  efficiencyRating: number | null;
  territory?: { id: string; name: string } | null;
  _count?: { skills: number; absences: number };
}

const columns: Column[] = [
  { id: 'name', label: 'Name' },
  { id: 'resourceType', label: 'Type' },
  { id: 'email', label: 'Email' },
  { id: 'territory', label: 'Territory', sortable: false },
  { id: 'skills', label: 'Skills', sortable: false },
  { id: 'efficiencyRating', label: 'Efficiency' },
  { id: 'isActive', label: 'Active' },
  { id: 'actions', label: 'Actions', sortable: false },
];

export default function ServiceResourcesPage() {
  const toast = useToast();
  const { confirm } = useConfirmDialog();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ServiceResource | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [territories, setTerritories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [formData, setFormData] = useState({
    name: '',
    resourceType: 'TECHNICIAN',
    email: '',
    phone: '',
    territoryId: '',
    efficiencyRating: 3,
    isActive: true,
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    resourceType: 'TECHNICIAN',
    email: '',
    phone: '',
    territoryId: '',
    efficiencyRating: 3,
    isActive: true,
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
  } = usePagination<ServiceResource>({
    url: '/api/service-resources',
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
      const payload = { ...formData, territoryId: formData.territoryId || null };
      const response = await fetch('/api/service-resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to create resource');
      setDialogOpen(false);
      toast.showSuccess('Service resource created successfully');
      refresh();
      resetForm();
    } catch (err: any) {
      toast.showError(err.message || 'Error creating resource');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Service Resource',
      message: 'Are you sure you want to delete this service resource? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      await fetch(`/api/service-resources/${id}`, { method: 'DELETE' });
      toast.showSuccess('Service resource deleted successfully');
      refresh();
    } catch (err) {
      toast.showError('Error deleting service resource');
    }
  };

  const handleStartEdit = () => {
    if (!selectedItem) return;
    setEditFormData({
      name: selectedItem.name,
      resourceType: selectedItem.resourceType,
      email: selectedItem.email || '',
      phone: selectedItem.phone || '',
      territoryId: selectedItem.territoryId || '',
      efficiencyRating: selectedItem.efficiencyRating || 3,
      isActive: selectedItem.isActive,
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedItem) return;
    try {
      const payload = { ...editFormData, territoryId: editFormData.territoryId || null };
      const response = await fetch(`/api/service-resources/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to update resource');
      toast.showSuccess('Service resource updated successfully');
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
      resourceType: 'TECHNICIAN',
      email: '',
      phone: '',
      territoryId: '',
      efficiencyRating: 3,
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
    Type: item.resourceType,
    Email: item.email || '-',
    Phone: item.phone || '-',
    Territory: item.territory?.name || '-',
    Efficiency: item.efficiencyRating || '-',
    Active: item.isActive ? 'Yes' : 'No',
  }));

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EngineeringIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4">Service Resources</Typography>
          </Box>
          <Box display="flex" gap={2} alignItems="center">
            <ExportToolbar data={exportData} filename="service-resources" title="Service Resources" />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              New Resource
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <EngineeringIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Total Resources</Typography>
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
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
                      <Typography variant="body2" fontWeight="bold">{item.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={item.resourceType} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{item.email || '-'}</TableCell>
                    <TableCell>{item.territory?.name || '-'}</TableCell>
                    <TableCell>
                      <Chip label={item._count?.skills || 0} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Rating value={item.efficiencyRating || 0} readOnly size="small" precision={0.5} />
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
                    <TableCell colSpan={8} align="center">No service resources found</TableCell>
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
        <DialogTitle>Create New Service Resource</DialogTitle>
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
                <InputLabel>Resource Type</InputLabel>
                <Select
                  value={formData.resourceType}
                  onChange={(e) => setFormData({ ...formData, resourceType: e.target.value })}
                  label="Resource Type"
                >
                  <MenuItem value="TECHNICIAN">Technician</MenuItem>
                  <MenuItem value="DISPATCHER">Dispatcher</MenuItem>
                  <MenuItem value="CREW_MEMBER">Crew Member</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
              <TextField
                fullWidth
                label="Efficiency Rating (1-5)"
                type="number"
                value={formData.efficiencyRating}
                onChange={(e) => setFormData({ ...formData, efficiencyRating: Math.min(5, Math.max(1, parseInt(e.target.value) || 1)) })}
                inputProps={{ min: 1, max: 5 }}
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
            Create Resource
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail/Edit Dialog */}
      <Dialog open={detailOpen} onClose={() => { setDetailOpen(false); setEditMode(false); }} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{editMode ? 'Edit Resource' : selectedItem?.name}</Typography>
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
                  <InputLabel>Resource Type</InputLabel>
                  <Select
                    value={editFormData.resourceType}
                    onChange={(e) => setEditFormData({ ...editFormData, resourceType: e.target.value })}
                    label="Resource Type"
                  >
                    <MenuItem value="TECHNICIAN">Technician</MenuItem>
                    <MenuItem value="DISPATCHER">Dispatcher</MenuItem>
                    <MenuItem value="CREW_MEMBER">Crew Member</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
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
                <TextField
                  fullWidth
                  label="Efficiency Rating (1-5)"
                  type="number"
                  value={editFormData.efficiencyRating}
                  onChange={(e) => setEditFormData({ ...editFormData, efficiencyRating: Math.min(5, Math.max(1, parseInt(e.target.value) || 1)) })}
                  inputProps={{ min: 1, max: 5 }}
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
                  <Chip label={selectedItem.resourceType} variant="outlined" />
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
                <Typography variant="caption" color="textSecondary">Efficiency Rating</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Rating value={selectedItem.efficiencyRating || 0} readOnly precision={0.5} />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Email</Typography>
                <Typography variant="body1">{selectedItem.email || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Phone</Typography>
                <Typography variant="body1">{selectedItem.phone || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Territory</Typography>
                <Typography variant="body1">{selectedItem.territory?.name || 'Unassigned'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Skills Count</Typography>
                <Typography variant="body1">{selectedItem._count?.skills || 0}</Typography>
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
