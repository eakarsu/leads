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
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface ServiceCrew {
  id: string;
  name: string;
  crewSize: number;
  leadId: string | null;
  territoryId: string | null;
  specialization: string | null;
  lead?: { id: string; name: string } | null;
  territory?: { id: string; name: string } | null;
}

const columns: Column[] = [
  { id: 'name', label: 'Name' },
  { id: 'crewSize', label: 'Crew Size' },
  { id: 'lead', label: 'Lead', sortable: false },
  { id: 'territory', label: 'Territory', sortable: false },
  { id: 'specialization', label: 'Specialization' },
  { id: 'actions', label: 'Actions', sortable: false },
];

export default function ServiceCrewsPage() {
  const toast = useToast();
  const { confirm } = useConfirmDialog();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ServiceCrew | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [resources, setResources] = useState<any[]>([]);
  const [territories, setTerritories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [formData, setFormData] = useState({
    name: '',
    crewSize: 2,
    leadId: '',
    territoryId: '',
    specialization: '',
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    crewSize: 2,
    leadId: '',
    territoryId: '',
    specialization: '',
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
  } = usePagination<ServiceCrew>({
    url: '/api/service-crews',
    defaultSortBy: 'name',
    defaultSortOrder: 'asc',
    extraParams,
  });

  useEffect(() => {
    fetchResources();
    fetchTerritories();
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
      const payload = {
        ...formData,
        leadId: formData.leadId || null,
        territoryId: formData.territoryId || null,
      };
      const response = await fetch('/api/service-crews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to create service crew');
      setDialogOpen(false);
      toast.showSuccess('Service crew created successfully');
      refresh();
      resetForm();
    } catch (err: any) {
      toast.showError(err.message || 'Error creating service crew');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Service Crew',
      message: 'Are you sure you want to delete this service crew? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      await fetch(`/api/service-crews/${id}`, { method: 'DELETE' });
      toast.showSuccess('Service crew deleted successfully');
      refresh();
    } catch (err) {
      toast.showError('Error deleting service crew');
    }
  };

  const handleStartEdit = () => {
    if (!selectedItem) return;
    setEditFormData({
      name: selectedItem.name,
      crewSize: selectedItem.crewSize,
      leadId: selectedItem.leadId || '',
      territoryId: selectedItem.territoryId || '',
      specialization: selectedItem.specialization || '',
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedItem) return;
    try {
      const payload = {
        ...editFormData,
        leadId: editFormData.leadId || null,
        territoryId: editFormData.territoryId || null,
      };
      const response = await fetch(`/api/service-crews/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to update service crew');
      toast.showSuccess('Service crew updated successfully');
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
      crewSize: 2,
      leadId: '',
      territoryId: '',
      specialization: '',
    });
  };

  const exportData = items.map((item) => ({
    Name: item.name,
    'Crew Size': item.crewSize,
    Lead: item.lead?.name || '-',
    Territory: item.territory?.name || '-',
    Specialization: item.specialization || '-',
  }));

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <GroupWorkIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4">Service Crews</Typography>
          </Box>
          <Box display="flex" gap={2} alignItems="center">
            <ExportToolbar data={exportData} filename="service-crews" title="Service Crews" />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              New Crew
            </Button>
          </Box>
        </Box>

        {/* Search */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search service crews..."
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
                      <Chip label={item.crewSize} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{item.lead?.name || '-'}</TableCell>
                    <TableCell>{item.territory?.name || '-'}</TableCell>
                    <TableCell>{item.specialization || '-'}</TableCell>
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
                    <TableCell colSpan={6} align="center">No service crews found</TableCell>
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
        <DialogTitle>Create New Service Crew</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Crew Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Crew Size"
                type="number"
                value={formData.crewSize}
                onChange={(e) => setFormData({ ...formData, crewSize: parseInt(e.target.value) || 2 })}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Crew Lead</InputLabel>
                <Select
                  value={formData.leadId}
                  onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                  label="Crew Lead"
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
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Specialization"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={!formData.name}>
            Create Crew
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail/Edit Dialog */}
      <Dialog open={detailOpen} onClose={() => { setDetailOpen(false); setEditMode(false); }} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{editMode ? 'Edit Service Crew' : selectedItem?.name}</Typography>
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
                  label="Crew Name *"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Crew Size"
                  type="number"
                  value={editFormData.crewSize}
                  onChange={(e) => setEditFormData({ ...editFormData, crewSize: parseInt(e.target.value) || 2 })}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Crew Lead</InputLabel>
                  <Select
                    value={editFormData.leadId}
                    onChange={(e) => setEditFormData({ ...editFormData, leadId: e.target.value })}
                    label="Crew Lead"
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
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Specialization"
                  value={editFormData.specialization}
                  onChange={(e) => setEditFormData({ ...editFormData, specialization: e.target.value })}
                />
              </Grid>
            </Grid>
          ) : selectedItem ? (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Crew Size</Typography>
                <Typography variant="h5">{selectedItem.crewSize}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Specialization</Typography>
                <Typography variant="body1">{selectedItem.specialization || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Crew Lead</Typography>
                <Typography variant="body1" fontWeight="bold">{selectedItem.lead?.name || 'Unassigned'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Territory</Typography>
                <Typography variant="body1">{selectedItem.territory?.name || 'Unassigned'}</Typography>
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
