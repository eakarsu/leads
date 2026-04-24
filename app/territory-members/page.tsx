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
import GroupsIcon from '@mui/icons-material/Groups';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface TerritoryMember {
  id: string;
  resourceId: string;
  territoryId: string;
  membershipType: string;
  effectiveStart: string | null;
  effectiveEnd: string | null;
  resource?: { id: string; name: string } | null;
  territory?: { id: string; name: string } | null;
}

const columns: Column[] = [
  { id: 'resource', label: 'Resource', sortable: false },
  { id: 'territory', label: 'Territory', sortable: false },
  { id: 'membershipType', label: 'Type' },
  { id: 'effectiveStart', label: 'Start Date' },
  { id: 'effectiveEnd', label: 'End Date' },
  { id: 'actions', label: 'Actions', sortable: false },
];

export default function TerritoryMembersPage() {
  const toast = useToast();
  const { confirm } = useConfirmDialog();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TerritoryMember | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [resources, setResources] = useState<any[]>([]);
  const [territories, setTerritories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [formData, setFormData] = useState({
    resourceId: '',
    territoryId: '',
    membershipType: 'PRIMARY',
    effectiveStart: '',
    effectiveEnd: '',
  });

  const [editFormData, setEditFormData] = useState({
    resourceId: '',
    territoryId: '',
    membershipType: 'PRIMARY',
    effectiveStart: '',
    effectiveEnd: '',
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
  } = usePagination<TerritoryMember>({
    url: '/api/territory-members',
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
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
        effectiveStart: formData.effectiveStart || null,
        effectiveEnd: formData.effectiveEnd || null,
      };
      const response = await fetch('/api/territory-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to create territory member');
      setDialogOpen(false);
      toast.showSuccess('Territory member added successfully');
      refresh();
      resetForm();
    } catch (err: any) {
      toast.showError(err.message || 'Error creating territory member');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Territory Member',
      message: 'Are you sure you want to remove this territory membership? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      await fetch(`/api/territory-members/${id}`, { method: 'DELETE' });
      toast.showSuccess('Territory member removed successfully');
      refresh();
    } catch (err) {
      toast.showError('Error deleting territory member');
    }
  };

  const handleStartEdit = () => {
    if (!selectedItem) return;
    setEditFormData({
      resourceId: selectedItem.resourceId,
      territoryId: selectedItem.territoryId,
      membershipType: selectedItem.membershipType,
      effectiveStart: selectedItem.effectiveStart ? new Date(selectedItem.effectiveStart).toISOString().split('T')[0] : '',
      effectiveEnd: selectedItem.effectiveEnd ? new Date(selectedItem.effectiveEnd).toISOString().split('T')[0] : '',
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedItem) return;
    try {
      const payload = {
        ...editFormData,
        effectiveStart: editFormData.effectiveStart || null,
        effectiveEnd: editFormData.effectiveEnd || null,
      };
      const response = await fetch(`/api/territory-members/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to update territory member');
      toast.showSuccess('Territory member updated successfully');
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
      territoryId: '',
      membershipType: 'PRIMARY',
      effectiveStart: '',
      effectiveEnd: '',
    });
  };

  const getMembershipColor = (type: string) => {
    switch (type) {
      case 'PRIMARY': return 'primary';
      case 'SECONDARY': return 'info';
      case 'RELOCATION': return 'warning';
      default: return 'default';
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  const exportData = items.map((item) => ({
    Resource: item.resource?.name || '-',
    Territory: item.territory?.name || '-',
    Type: item.membershipType,
    'Start Date': formatDate(item.effectiveStart),
    'End Date': formatDate(item.effectiveEnd),
  }));

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <GroupsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4">Territory Members</Typography>
          </Box>
          <Box display="flex" gap={2} alignItems="center">
            <ExportToolbar data={exportData} filename="territory-members" title="Territory Members" />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              Add Member
            </Button>
          </Box>
        </Box>

        {/* Search */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search territory members..."
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
                    <TableCell>{item.territory?.name || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.membershipType}
                        color={getMembershipColor(item.membershipType) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(item.effectiveStart)}</TableCell>
                    <TableCell>{formatDate(item.effectiveEnd)}</TableCell>
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
                    <TableCell colSpan={6} align="center">No territory members found</TableCell>
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
        <DialogTitle>Add Territory Member</DialogTitle>
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
                <InputLabel>Territory *</InputLabel>
                <Select
                  value={formData.territoryId}
                  onChange={(e) => setFormData({ ...formData, territoryId: e.target.value })}
                  label="Territory *"
                >
                  {territories.map((t: any) => (
                    <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Membership Type</InputLabel>
                <Select
                  value={formData.membershipType}
                  onChange={(e) => setFormData({ ...formData, membershipType: e.target.value })}
                  label="Membership Type"
                >
                  <MenuItem value="PRIMARY">Primary</MenuItem>
                  <MenuItem value="SECONDARY">Secondary</MenuItem>
                  <MenuItem value="RELOCATION">Relocation</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Effective Start"
                type="date"
                value={formData.effectiveStart}
                onChange={(e) => setFormData({ ...formData, effectiveStart: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Effective End"
                type="date"
                value={formData.effectiveEnd}
                onChange={(e) => setFormData({ ...formData, effectiveEnd: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={!formData.resourceId || !formData.territoryId}
          >
            Add Member
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail/Edit Dialog */}
      <Dialog open={detailOpen} onClose={() => { setDetailOpen(false); setEditMode(false); }} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{editMode ? 'Edit Territory Member' : 'Territory Member Details'}</Typography>
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
                  <InputLabel>Territory *</InputLabel>
                  <Select
                    value={editFormData.territoryId}
                    onChange={(e) => setEditFormData({ ...editFormData, territoryId: e.target.value })}
                    label="Territory *"
                  >
                    {territories.map((t: any) => (
                      <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>Membership Type</InputLabel>
                  <Select
                    value={editFormData.membershipType}
                    onChange={(e) => setEditFormData({ ...editFormData, membershipType: e.target.value })}
                    label="Membership Type"
                  >
                    <MenuItem value="PRIMARY">Primary</MenuItem>
                    <MenuItem value="SECONDARY">Secondary</MenuItem>
                    <MenuItem value="RELOCATION">Relocation</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Effective Start"
                  type="date"
                  value={editFormData.effectiveStart}
                  onChange={(e) => setEditFormData({ ...editFormData, effectiveStart: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Effective End"
                  type="date"
                  value={editFormData.effectiveEnd}
                  onChange={(e) => setEditFormData({ ...editFormData, effectiveEnd: e.target.value })}
                  InputLabelProps={{ shrink: true }}
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
                <Typography variant="caption" color="textSecondary">Territory</Typography>
                <Typography variant="body1" fontWeight="bold">{selectedItem.territory?.name || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="textSecondary">Membership Type</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={selectedItem.membershipType}
                    color={getMembershipColor(selectedItem.membershipType) as any}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Effective Start</Typography>
                <Typography variant="body1">{formatDate(selectedItem.effectiveStart)}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Effective End</Typography>
                <Typography variant="body1">{formatDate(selectedItem.effectiveEnd)}</Typography>
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
              <Button
                onClick={handleSaveEdit}
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={!editFormData.resourceId || !editFormData.territoryId}
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
