'use client';

import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableRow, IconButton, Chip, Grid, Card,
  CardContent, FormControl, InputLabel, Select, MenuItem, Tooltip,
  Switch, FormControlLabel,
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

interface SchedulingPolicy {
  id: string;
  name: string;
  policyType: string;
  travelTimeOptimization: boolean;
  skillMatching: boolean;
  priorityWeight: number;
  territoryPreference: string;
  maxTravelDistance: number | null;
  sameDayPolicy: string;
  emergencyOverride: boolean;
  createdAt: string;
}

const columns: Column[] = [
  { id: 'name', label: 'Name' },
  { id: 'policyType', label: 'Type' },
  { id: 'travelTimeOptimization', label: 'Travel Optimization' },
  { id: 'skillMatching', label: 'Skill Matching' },
  { id: 'priorityWeight', label: 'Priority Weight' },
  { id: 'maxTravelDistance', label: 'Max Travel' },
  { id: 'emergencyOverride', label: 'Emergency Override' },
  { id: 'actions', label: 'Actions', sortable: false },
];

const defaultFormData = {
  name: '',
  policyType: 'STANDARD',
  travelTimeOptimization: true,
  skillMatching: true,
  priorityWeight: 50,
  territoryPreference: 'PRIMARY',
  maxTravelDistance: '',
  sameDayPolicy: 'ALLOW',
  emergencyOverride: false,
};

export default function SchedulingPoliciesPage() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SchedulingPolicy | null>(null);
  const [formData, setFormData] = useState<any>({ ...defaultFormData });
  const [editFormData, setEditFormData] = useState<any>({ ...defaultFormData });

  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: items, loading, pagination, setPage, setPageSize, setSort, refresh } = usePagination<SchedulingPolicy>({
    url: '/api/scheduling-policies',
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

  const handleCreate = async () => {
    try {
      const payload = {
        ...formData,
        priorityWeight: Number(formData.priorityWeight),
        maxTravelDistance: formData.maxTravelDistance ? Number(formData.maxTravelDistance) : null,
      };
      const res = await fetch('/api/scheduling-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setDialogOpen(false);
        refresh();
        setFormData({ ...defaultFormData });
        toast.showSuccess('Scheduling policy created successfully');
      } else {
        toast.showError('Failed to create scheduling policy');
      }
    } catch (error) {
      console.error('Error creating policy:', error);
      toast.showError('Error creating scheduling policy');
    }
  };

  const handleEdit = (item: SchedulingPolicy) => {
    setSelectedItem(item);
    setEditFormData({
      name: item.name || '',
      policyType: item.policyType || 'STANDARD',
      travelTimeOptimization: item.travelTimeOptimization ?? true,
      skillMatching: item.skillMatching ?? true,
      priorityWeight: item.priorityWeight ?? 50,
      territoryPreference: item.territoryPreference || 'PRIMARY',
      maxTravelDistance: item.maxTravelDistance?.toString() || '',
      sameDayPolicy: item.sameDayPolicy || 'ALLOW',
      emergencyOverride: item.emergencyOverride ?? false,
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    try {
      const payload = {
        ...editFormData,
        priorityWeight: Number(editFormData.priorityWeight),
        maxTravelDistance: editFormData.maxTravelDistance ? Number(editFormData.maxTravelDistance) : null,
      };
      const res = await fetch(`/api/scheduling-policies/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setEditDialogOpen(false);
        refresh();
        toast.showSuccess('Scheduling policy updated successfully');
      } else {
        toast.showError('Failed to update scheduling policy');
      }
    } catch (error) {
      console.error('Error updating policy:', error);
      toast.showError('Error updating scheduling policy');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Scheduling Policy',
      message: 'Are you sure you want to delete this scheduling policy? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/scheduling-policies/${id}`, { method: 'DELETE' });
      if (res.ok) {
        refresh();
        toast.showSuccess('Scheduling policy deleted successfully');
      } else {
        toast.showError('Failed to delete scheduling policy');
      }
    } catch (error) {
      console.error('Error deleting policy:', error);
      toast.showError('Error deleting scheduling policy');
    }
  };

  const getPolicyTypeColor = (type: string) => {
    switch (type) {
      case 'STANDARD': return 'default';
      case 'EMERGENCY': return 'error';
      case 'HIGH_PRIORITY': return 'warning';
      default: return 'default';
    }
  };

  const filteredItems = items.filter((item) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      item.name?.toLowerCase().includes(s) ||
      item.policyType?.toLowerCase().includes(s)
    );
  });

  const exportData = filteredItems.map((item) => ({
    'Name': item.name,
    'Type': item.policyType,
    'Travel Optimization': item.travelTimeOptimization ? 'Yes' : 'No',
    'Skill Matching': item.skillMatching ? 'Yes' : 'No',
    'Priority Weight': item.priorityWeight,
    'Max Travel Distance': item.maxTravelDistance ?? '-',
    'Emergency Override': item.emergencyOverride ? 'Yes' : 'No',
  }));

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Scheduling Policies</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ExportToolbar data={exportData} filename="scheduling-policies" title="Scheduling Policies Export" />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              New Policy
            </Button>
          </Box>
        </Box>

        <Paper sx={{ mb: 2, p: 2 }}>
          <TextField
            size="small"
            placeholder="Search policies..."
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
                      <Typography variant="body2" fontWeight="bold">{item.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={item.policyType.replace(/_/g, ' ')} color={getPolicyTypeColor(item.policyType) as any} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.travelTimeOptimization ? 'Enabled' : 'Disabled'}
                        color={item.travelTimeOptimization ? 'success' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.skillMatching ? 'Enabled' : 'Disabled'}
                        color={item.skillMatching ? 'success' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{item.priorityWeight}</TableCell>
                    <TableCell>{item.maxTravelDistance ? `${item.maxTravelDistance} km` : '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.emergencyOverride ? 'Yes' : 'No'}
                        color={item.emergencyOverride ? 'warning' : 'default'}
                        size="small"
                        variant="outlined"
                      />
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
                    <TableCell colSpan={8} align="center">No scheduling policies found</TableCell>
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
        <DialogTitle>Create Scheduling Policy</DialogTitle>
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
              <FormControl fullWidth>
                <InputLabel>Policy Type</InputLabel>
                <Select
                  value={formData.policyType}
                  onChange={(e) => setFormData({ ...formData, policyType: e.target.value })}
                  label="Policy Type"
                >
                  <MenuItem value="STANDARD">Standard</MenuItem>
                  <MenuItem value="EMERGENCY">Emergency</MenuItem>
                  <MenuItem value="HIGH_PRIORITY">High Priority</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Priority Weight (0-100)"
                type="number"
                value={formData.priorityWeight}
                onChange={(e) => setFormData({ ...formData, priorityWeight: e.target.value })}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.travelTimeOptimization}
                    onChange={(e) => setFormData({ ...formData, travelTimeOptimization: e.target.checked })}
                  />
                }
                label="Travel Time Optimization"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.skillMatching}
                    onChange={(e) => setFormData({ ...formData, skillMatching: e.target.checked })}
                  />
                }
                label="Skill Matching"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.emergencyOverride}
                    onChange={(e) => setFormData({ ...formData, emergencyOverride: e.target.checked })}
                  />
                }
                label="Emergency Override"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Territory Preference</InputLabel>
                <Select
                  value={formData.territoryPreference}
                  onChange={(e) => setFormData({ ...formData, territoryPreference: e.target.value })}
                  label="Territory Preference"
                >
                  <MenuItem value="PRIMARY">Primary</MenuItem>
                  <MenuItem value="ANY">Any</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Max Travel Distance (km)"
                type="number"
                value={formData.maxTravelDistance}
                onChange={(e) => setFormData({ ...formData, maxTravelDistance: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Same Day Policy</InputLabel>
                <Select
                  value={formData.sameDayPolicy}
                  onChange={(e) => setFormData({ ...formData, sameDayPolicy: e.target.value })}
                  label="Same Day Policy"
                >
                  <MenuItem value="ALLOW">Allow</MenuItem>
                  <MenuItem value="PREFER">Prefer</MenuItem>
                  <MenuItem value="REQUIRE">Require</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={!formData.name}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Scheduling Policy</DialogTitle>
        <DialogContent>
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
              <FormControl fullWidth>
                <InputLabel>Policy Type</InputLabel>
                <Select
                  value={editFormData.policyType}
                  onChange={(e) => setEditFormData({ ...editFormData, policyType: e.target.value })}
                  label="Policy Type"
                >
                  <MenuItem value="STANDARD">Standard</MenuItem>
                  <MenuItem value="EMERGENCY">Emergency</MenuItem>
                  <MenuItem value="HIGH_PRIORITY">High Priority</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Priority Weight (0-100)"
                type="number"
                value={editFormData.priorityWeight}
                onChange={(e) => setEditFormData({ ...editFormData, priorityWeight: e.target.value })}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editFormData.travelTimeOptimization}
                    onChange={(e) => setEditFormData({ ...editFormData, travelTimeOptimization: e.target.checked })}
                  />
                }
                label="Travel Time Optimization"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editFormData.skillMatching}
                    onChange={(e) => setEditFormData({ ...editFormData, skillMatching: e.target.checked })}
                  />
                }
                label="Skill Matching"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editFormData.emergencyOverride}
                    onChange={(e) => setEditFormData({ ...editFormData, emergencyOverride: e.target.checked })}
                  />
                }
                label="Emergency Override"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Territory Preference</InputLabel>
                <Select
                  value={editFormData.territoryPreference}
                  onChange={(e) => setEditFormData({ ...editFormData, territoryPreference: e.target.value })}
                  label="Territory Preference"
                >
                  <MenuItem value="PRIMARY">Primary</MenuItem>
                  <MenuItem value="ANY">Any</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Max Travel Distance (km)"
                type="number"
                value={editFormData.maxTravelDistance}
                onChange={(e) => setEditFormData({ ...editFormData, maxTravelDistance: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Same Day Policy</InputLabel>
                <Select
                  value={editFormData.sameDayPolicy}
                  onChange={(e) => setEditFormData({ ...editFormData, sameDayPolicy: e.target.value })}
                  label="Same Day Policy"
                >
                  <MenuItem value="ALLOW">Allow</MenuItem>
                  <MenuItem value="PREFER">Prefer</MenuItem>
                  <MenuItem value="REQUIRE">Require</MenuItem>
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
          <Button onClick={handleUpdate} variant="contained" startIcon={<SaveIcon />} disabled={!editFormData.name}>Save</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
