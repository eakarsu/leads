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

interface MaintenancePlan {
  id: string;
  title: string;
  frequency: string;
  nextSuggestedDate: string | null;
  workType: { id: string; name: string } | null;
  asset: { id: string; name: string } | null;
  territory: { id: string; name: string } | null;
  createdAt: string;
}

const columns: Column[] = [
  { id: 'title', label: 'Title' },
  { id: 'workType', label: 'Work Type', sortable: false },
  { id: 'asset', label: 'Asset', sortable: false },
  { id: 'frequency', label: 'Frequency' },
  { id: 'nextSuggestedDate', label: 'Next Service' },
  { id: 'territory', label: 'Territory', sortable: false },
  { id: 'actions', label: 'Actions', sortable: false },
];

const defaultFormData = {
  title: '',
  workTypeId: '',
  assetId: '',
  frequency: 'MONTHLY',
  nextSuggestedDate: '',
  territoryId: '',
};

export default function MaintenancePlansPage() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MaintenancePlan | null>(null);
  const [workTypes, setWorkTypes] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [territories, setTerritories] = useState<any[]>([]);
  const [formData, setFormData] = useState({ ...defaultFormData });
  const [editFormData, setEditFormData] = useState({ ...defaultFormData });

  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: items, loading, pagination, setPage, setPageSize, setSort, refresh } = usePagination<MaintenancePlan>({
    url: '/api/maintenance-plans',
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
    fetchWorkTypes();
    fetchAssets();
    fetchTerritories();
  }, []);

  const fetchWorkTypes = async () => {
    try {
      const res = await fetch('/api/work-types');
      const data = await res.json();
      setWorkTypes(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Error fetching work types:', error);
    }
  };

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/field-service-assets');
      const data = await res.json();
      setAssets(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
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
        nextSuggestedDate: formData.nextSuggestedDate || null,
      };
      const res = await fetch('/api/maintenance-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setDialogOpen(false);
        refresh();
        setFormData({ ...defaultFormData });
        toast.showSuccess('Maintenance plan created successfully');
      } else {
        toast.showError('Failed to create maintenance plan');
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      toast.showError('Error creating maintenance plan');
    }
  };

  const handleEdit = (item: MaintenancePlan) => {
    setSelectedItem(item);
    setEditFormData({
      title: item.title || '',
      workTypeId: item.workType?.id || '',
      assetId: item.asset?.id || '',
      frequency: item.frequency || 'MONTHLY',
      nextSuggestedDate: item.nextSuggestedDate ? new Date(item.nextSuggestedDate).toISOString().slice(0, 10) : '',
      territoryId: item.territory?.id || '',
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    try {
      const payload = {
        ...editFormData,
        nextSuggestedDate: editFormData.nextSuggestedDate || null,
      };
      const res = await fetch(`/api/maintenance-plans/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setEditDialogOpen(false);
        refresh();
        toast.showSuccess('Maintenance plan updated successfully');
      } else {
        toast.showError('Failed to update maintenance plan');
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.showError('Error updating maintenance plan');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Maintenance Plan',
      message: 'Are you sure you want to delete this maintenance plan? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/maintenance-plans/${id}`, { method: 'DELETE' });
      if (res.ok) {
        refresh();
        toast.showSuccess('Maintenance plan deleted successfully');
      } else {
        toast.showError('Failed to delete maintenance plan');
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.showError('Error deleting maintenance plan');
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'DAILY': return 'error';
      case 'WEEKLY': return 'warning';
      case 'BIWEEKLY': return 'warning';
      case 'MONTHLY': return 'info';
      case 'QUARTERLY': return 'primary';
      case 'SEMI_ANNUALLY': return 'secondary';
      case 'ANNUALLY': return 'success';
      default: return 'default';
    }
  };

  const filteredItems = items.filter((item) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      item.title?.toLowerCase().includes(s) ||
      item.workType?.name?.toLowerCase().includes(s) ||
      item.asset?.name?.toLowerCase().includes(s) ||
      item.territory?.name?.toLowerCase().includes(s)
    );
  });

  const exportData = filteredItems.map((item) => ({
    'Title': item.title,
    'Work Type': item.workType?.name || '-',
    'Asset': item.asset?.name || '-',
    'Frequency': item.frequency,
    'Next Service': item.nextSuggestedDate ? new Date(item.nextSuggestedDate).toLocaleDateString() : '-',
    'Territory': item.territory?.name || '-',
  }));

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Maintenance Plans</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ExportToolbar data={exportData} filename="maintenance-plans" title="Maintenance Plans Export" />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              New Plan
            </Button>
          </Box>
        </Box>

        <Paper sx={{ mb: 2, p: 2 }}>
          <TextField
            size="small"
            placeholder="Search maintenance plans..."
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
                      <Typography variant="body2" fontWeight="bold">{item.title}</Typography>
                    </TableCell>
                    <TableCell>{item.workType?.name || '-'}</TableCell>
                    <TableCell>{item.asset?.name || '-'}</TableCell>
                    <TableCell>
                      <Chip label={item.frequency.replace(/_/g, ' ')} color={getFrequencyColor(item.frequency) as any} size="small" />
                    </TableCell>
                    <TableCell>
                      {item.nextSuggestedDate ? new Date(item.nextSuggestedDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>{item.territory?.name || '-'}</TableCell>
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
                    <TableCell colSpan={7} align="center">No maintenance plans found</TableCell>
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
        <DialogTitle>Create Maintenance Plan</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Title *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                <InputLabel>Asset</InputLabel>
                <Select
                  value={formData.assetId}
                  onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                  label="Asset"
                >
                  <MenuItem value="">None</MenuItem>
                  {assets.map((a: any) => (
                    <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Frequency</InputLabel>
                <Select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  label="Frequency"
                >
                  <MenuItem value="DAILY">Daily</MenuItem>
                  <MenuItem value="WEEKLY">Weekly</MenuItem>
                  <MenuItem value="BIWEEKLY">Biweekly</MenuItem>
                  <MenuItem value="MONTHLY">Monthly</MenuItem>
                  <MenuItem value="QUARTERLY">Quarterly</MenuItem>
                  <MenuItem value="SEMI_ANNUALLY">Semi-Annually</MenuItem>
                  <MenuItem value="ANNUALLY">Annually</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Next Suggested Date"
                type="date"
                value={formData.nextSuggestedDate}
                onChange={(e) => setFormData({ ...formData, nextSuggestedDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
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
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={!formData.title}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Maintenance Plan</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Title *"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
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
                <InputLabel>Asset</InputLabel>
                <Select
                  value={editFormData.assetId}
                  onChange={(e) => setEditFormData({ ...editFormData, assetId: e.target.value })}
                  label="Asset"
                >
                  <MenuItem value="">None</MenuItem>
                  {assets.map((a: any) => (
                    <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Frequency</InputLabel>
                <Select
                  value={editFormData.frequency}
                  onChange={(e) => setEditFormData({ ...editFormData, frequency: e.target.value })}
                  label="Frequency"
                >
                  <MenuItem value="DAILY">Daily</MenuItem>
                  <MenuItem value="WEEKLY">Weekly</MenuItem>
                  <MenuItem value="BIWEEKLY">Biweekly</MenuItem>
                  <MenuItem value="MONTHLY">Monthly</MenuItem>
                  <MenuItem value="QUARTERLY">Quarterly</MenuItem>
                  <MenuItem value="SEMI_ANNUALLY">Semi-Annually</MenuItem>
                  <MenuItem value="ANNUALLY">Annually</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Next Suggested Date"
                type="date"
                value={editFormData.nextSuggestedDate}
                onChange={(e) => setEditFormData({ ...editFormData, nextSuggestedDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
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
          </Grid>
        </DialogContent>
        <DialogActions>
          {selectedItem && (
            <Button color="error" onClick={() => handleDelete(selectedItem.id)} sx={{ mr: 'auto' }}>
              Delete
            </Button>
          )}
          <Button onClick={() => setEditDialogOpen(false)} startIcon={<CancelIcon />}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained" startIcon={<SaveIcon />} disabled={!editFormData.title}>Save</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
