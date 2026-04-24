'use client';

import { useState, useMemo } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableRow, IconButton, Chip, Card,
  CardContent, Alert, FormControlLabel, Checkbox,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface DynamicDashboard {
  id: string;
  name: string;
  isDefault: boolean;
  layout: any;
  widgets: any;
  owner?: { name: string };
  createdAt: string;
}

const columns: Column[] = [
  { id: 'name', label: 'Name' },
  { id: 'isDefault', label: 'Default' },
  { id: 'owner', label: 'Owner', sortable: false },
  { id: 'createdAt', label: 'Created' },
  { id: 'actions', label: 'Actions', sortable: false, align: 'center' },
];

export default function DynamicDashboardsPage() {
  const toast = useToast();
  const { confirm } = useConfirmDialog();

  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState<DynamicDashboard | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    isDefault: false,
    layout: '',
    widgets: '',
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    isDefault: false,
    layout: '',
    widgets: '',
  });

  const {
    data: dashboards,
    loading,
    error,
    pagination,
    setPage,
    setPageSize,
    setSort,
    refresh,
  } = usePagination<DynamicDashboard>({
    url: '/api/dynamic-dashboards',
    defaultSortBy: sortBy,
    defaultSortOrder: sortOrder,
  });

  const handleSort = (col: string) => {
    const newOrder = sortBy === col && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(col);
    setSortOrder(newOrder);
    setSort(col, newOrder);
  };

  const parseJSON = (str: string) => {
    try {
      return JSON.parse(str);
    } catch {
      return str || null;
    }
  };

  const handleCreate = async () => {
    try {
      const payload = {
        name: formData.name,
        isDefault: formData.isDefault,
        layout: parseJSON(formData.layout),
        widgets: parseJSON(formData.widgets),
      };
      const response = await fetch('/api/dynamic-dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to create dashboard');
      setOpenDialog(false);
      setFormData({ name: '', isDefault: false, layout: '', widgets: '' });
      toast.showSuccess('Dashboard created successfully');
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleUpdate = async () => {
    if (!selectedDashboard) return;
    try {
      const payload = {
        name: editFormData.name,
        isDefault: editFormData.isDefault,
        layout: parseJSON(editFormData.layout),
        widgets: parseJSON(editFormData.widgets),
      };
      const response = await fetch(`/api/dynamic-dashboards/${selectedDashboard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to update dashboard');
      toast.showSuccess('Dashboard updated successfully');
      setEditMode(false);
      setOpenDetailDialog(false);
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Dashboard',
      message: 'Are you sure you want to delete this dashboard? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/dynamic-dashboards/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete dashboard');
      toast.showSuccess('Dashboard deleted successfully');
      setOpenDetailDialog(false);
      setSelectedDashboard(null);
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleRowClick = (dashboard: DynamicDashboard) => {
    setSelectedDashboard(dashboard);
    setEditMode(false);
    setOpenDetailDialog(true);
  };

  const handleStartEdit = () => {
    if (!selectedDashboard) return;
    setEditFormData({
      name: selectedDashboard.name,
      isDefault: selectedDashboard.isDefault,
      layout: selectedDashboard.layout ? JSON.stringify(selectedDashboard.layout, null, 2) : '',
      widgets: selectedDashboard.widgets ? JSON.stringify(selectedDashboard.widgets, null, 2) : '',
    });
    setEditMode(true);
  };

  const exportData = useMemo(() => {
    return dashboards.map((d) => ({
      Name: d.name,
      Default: d.isDefault ? 'Yes' : 'No',
      Owner: d.owner?.name || '---',
      Created: new Date(d.createdAt).toLocaleDateString(),
    }));
  }, [dashboards]);

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <DashboardIcon sx={{ fontSize: 32 }} />
            <Typography variant="h4">Dynamic Dashboards</Typography>
          </Box>
          <Box display="flex" gap={1} alignItems="center">
            <ExportToolbar data={exportData} filename="dynamic-dashboards" title="Dynamic Dashboards" />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
              New Dashboard
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Card>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={5} columns={5} />
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <SortableTableHead columns={columns} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  <TableBody>
                    {dashboards.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography color="text.secondary">No dashboards found. Create your first dashboard!</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      dashboards.map((dashboard) => (
                        <TableRow key={dashboard.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(dashboard)}>
                          <TableCell>{dashboard.name}</TableCell>
                          <TableCell>
                            {dashboard.isDefault ? (
                              <Chip label="Default" size="small" color="primary" />
                            ) : (
                              <Chip label="No" size="small" variant="outlined" />
                            )}
                          </TableCell>
                          <TableCell>{dashboard.owner?.name || '---'}</TableCell>
                          <TableCell>{new Date(dashboard.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                            <IconButton size="small" onClick={() => handleRowClick(dashboard)} title="View">
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => { setSelectedDashboard(dashboard); handleStartEdit(); setOpenDetailDialog(true); }} title="Edit">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDelete(dashboard.id)} title="Delete" color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
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
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create Dynamic Dashboard</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Dashboard Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  />
                }
                label="Set as default dashboard"
              />
              <TextField
                label="Layout (JSON)"
                value={formData.layout}
                onChange={(e) => setFormData({ ...formData, layout: e.target.value })}
                multiline
                rows={6}
                fullWidth
                placeholder='{"columns": 3, "rows": 4}'
                sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: 13 } }}
              />
              <TextField
                label="Widgets (JSON)"
                value={formData.widgets}
                onChange={(e) => setFormData({ ...formData, widgets: e.target.value })}
                multiline
                rows={6}
                fullWidth
                placeholder='[{"type": "chart", "title": "Sales", "position": {"x": 0, "y": 0}}]'
                sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: 13 } }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} variant="contained" disabled={!formData.name}>
              Create Dashboard
            </Button>
          </DialogActions>
        </Dialog>

        {/* Detail / Edit Dialog */}
        <Dialog open={openDetailDialog} onClose={() => { setOpenDetailDialog(false); setEditMode(false); }} maxWidth="md" fullWidth>
          <DialogTitle>{editMode ? 'Edit Dashboard' : 'Dashboard Details'}</DialogTitle>
          <DialogContent>
            {selectedDashboard && !editMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box display="flex" gap={4}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                    <Typography variant="body1">{selectedDashboard.name}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Default</Typography>
                    {selectedDashboard.isDefault ? (
                      <Chip label="Default" size="small" color="primary" />
                    ) : (
                      <Typography variant="body1">No</Typography>
                    )}
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Owner</Typography>
                    <Typography variant="body1">{selectedDashboard.owner?.name || '---'}</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Layout</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 0.5, maxHeight: 250, overflow: 'auto' }}>
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 12 }}>
                      {selectedDashboard.layout ? JSON.stringify(selectedDashboard.layout, null, 2) : 'No layout defined.'}
                    </Typography>
                  </Paper>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Widgets</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 0.5, maxHeight: 250, overflow: 'auto' }}>
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 12 }}>
                      {selectedDashboard.widgets ? JSON.stringify(selectedDashboard.widgets, null, 2) : 'No widgets defined.'}
                    </Typography>
                  </Paper>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                  <Typography variant="body1">{new Date(selectedDashboard.createdAt).toLocaleString()}</Typography>
                </Box>
              </Box>
            )}

            {selectedDashboard && editMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Dashboard Name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  fullWidth
                  required
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={editFormData.isDefault}
                      onChange={(e) => setEditFormData({ ...editFormData, isDefault: e.target.checked })}
                    />
                  }
                  label="Set as default dashboard"
                />
                <TextField
                  label="Layout (JSON)"
                  value={editFormData.layout}
                  onChange={(e) => setEditFormData({ ...editFormData, layout: e.target.value })}
                  multiline
                  rows={6}
                  fullWidth
                  sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: 13 } }}
                />
                <TextField
                  label="Widgets (JSON)"
                  value={editFormData.widgets}
                  onChange={(e) => setEditFormData({ ...editFormData, widgets: e.target.value })}
                  multiline
                  rows={6}
                  fullWidth
                  sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: 13 } }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {editMode ? (
              <>
                <Button onClick={() => setEditMode(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleUpdate} disabled={!editFormData.name}>Save</Button>
              </>
            ) : (
              <>
                <Button onClick={() => setOpenDetailDialog(false)}>Close</Button>
                <Button variant="contained" startIcon={<EditIcon />} onClick={handleStartEdit}>Edit</Button>
                <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => selectedDashboard && handleDelete(selectedDashboard.id)}>Delete</Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
