'use client';

import { useState, useMemo } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableRow, IconButton, Chip, Card,
  CardContent, MenuItem, Alert, Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface CadenceStep {
  id?: string;
  stepOrder: number;
  stepType: string;
  subject: string;
  body: string;
  waitDays: number;
}

interface SalesCadence {
  id: string;
  name: string;
  status: string;
  type: string;
  steps: CadenceStep[];
  _count?: { enrollments: number };
  createdAt: string;
}

const columns: Column[] = [
  { id: 'name', label: 'Name' },
  { id: 'status', label: 'Status' },
  { id: 'type', label: 'Type' },
  { id: 'steps', label: 'Steps', sortable: false },
  { id: 'enrollments', label: 'Enrollments', sortable: false },
  { id: 'actions', label: 'Actions', sortable: false, align: 'center' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE': return 'success';
    case 'PAUSED': return 'warning';
    case 'ARCHIVED': return 'error';
    default: return 'default';
  }
};

export default function SalesCadencesPage() {
  const toast = useToast();
  const { confirm } = useConfirmDialog();

  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCadence, setSelectedCadence] = useState<SalesCadence | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    status: 'DRAFT',
    type: 'OUTBOUND',
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    status: 'DRAFT',
    type: 'OUTBOUND',
  });

  const [stepForm, setStepForm] = useState<CadenceStep>({
    stepOrder: 1,
    stepType: 'EMAIL',
    subject: '',
    body: '',
    waitDays: 0,
  });

  const {
    data: cadences,
    loading,
    error,
    pagination,
    setPage,
    setPageSize,
    setSort,
    refresh,
  } = usePagination<SalesCadence>({
    url: '/api/sales-cadences',
    defaultSortBy: sortBy,
    defaultSortOrder: sortOrder,
  });

  const handleSort = (col: string) => {
    const newOrder = sortBy === col && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(col);
    setSortOrder(newOrder);
    setSort(col, newOrder);
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/sales-cadences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to create sales cadence');
      setOpenDialog(false);
      setFormData({ name: '', status: 'DRAFT', type: 'OUTBOUND' });
      toast.showSuccess('Sales cadence created successfully');
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleUpdate = async () => {
    if (!selectedCadence) return;
    try {
      const response = await fetch(`/api/sales-cadences/${selectedCadence.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      if (!response.ok) throw new Error('Failed to update sales cadence');
      toast.showSuccess('Sales cadence updated successfully');
      setEditMode(false);
      setOpenDetailDialog(false);
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Sales Cadence',
      message: 'Are you sure you want to delete this sales cadence? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/sales-cadences/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete sales cadence');
      toast.showSuccess('Sales cadence deleted successfully');
      setOpenDetailDialog(false);
      setSelectedCadence(null);
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleAddStep = async () => {
    if (!selectedCadence) return;
    try {
      const response = await fetch(`/api/sales-cadences/${selectedCadence.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addStep: stepForm,
        }),
      });
      if (!response.ok) throw new Error('Failed to add step');
      toast.showSuccess('Step added successfully');
      setStepForm({ stepOrder: 1, stepType: 'EMAIL', subject: '', body: '', waitDays: 0 });
      // Refresh the cadence detail
      const detailRes = await fetch(`/api/sales-cadences/${selectedCadence.id}`);
      if (detailRes.ok) {
        const updated = await detailRes.json();
        setSelectedCadence(updated);
      }
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleRowClick = (cadence: SalesCadence) => {
    setSelectedCadence(cadence);
    setEditMode(false);
    setOpenDetailDialog(true);
  };

  const handleStartEdit = () => {
    if (!selectedCadence) return;
    setEditFormData({
      name: selectedCadence.name,
      status: selectedCadence.status,
      type: selectedCadence.type,
    });
    setEditMode(true);
  };

  const exportData = useMemo(() => {
    return cadences.map((c) => ({
      Name: c.name,
      Status: c.status,
      Type: c.type,
      Steps: c.steps?.length || 0,
      Enrollments: c._count?.enrollments || 0,
      Created: new Date(c.createdAt).toLocaleDateString(),
    }));
  }, [cadences]);

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Sales Cadences</Typography>
          <Box display="flex" gap={1} alignItems="center">
            <ExportToolbar data={exportData} filename="sales-cadences" title="Sales Cadences" />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
              New Cadence
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Card>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={5} columns={6} />
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <SortableTableHead columns={columns} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                  <TableBody>
                    {cadences.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography color="text.secondary">No sales cadences found. Create your first cadence!</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      cadences.map((cadence) => (
                        <TableRow key={cadence.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(cadence)}>
                          <TableCell>{cadence.name}</TableCell>
                          <TableCell>
                            <Chip label={cadence.status} size="small" color={getStatusColor(cadence.status) as any} />
                          </TableCell>
                          <TableCell><Chip label={cadence.type} size="small" variant="outlined" /></TableCell>
                          <TableCell>{cadence.steps?.length || 0}</TableCell>
                          <TableCell>{cadence._count?.enrollments || 0}</TableCell>
                          <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                            <IconButton size="small" onClick={() => handleRowClick(cadence)} title="View">
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => { setSelectedCadence(cadence); handleStartEdit(); setOpenDetailDialog(true); }} title="Edit">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDelete(cadence.id)} title="Delete" color="error">
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
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Sales Cadence</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Cadence Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
              <TextField
                select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                fullWidth
              >
                <MenuItem value="DRAFT">Draft</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="PAUSED">Paused</MenuItem>
                <MenuItem value="ARCHIVED">Archived</MenuItem>
              </TextField>
              <TextField
                select
                label="Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                fullWidth
              >
                <MenuItem value="OUTBOUND">Outbound</MenuItem>
                <MenuItem value="INBOUND">Inbound</MenuItem>
                <MenuItem value="EVENT_BASED">Event Based</MenuItem>
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} variant="contained" disabled={!formData.name}>
              Create Cadence
            </Button>
          </DialogActions>
        </Dialog>

        {/* Detail / Edit Dialog */}
        <Dialog open={openDetailDialog} onClose={() => { setOpenDetailDialog(false); setEditMode(false); }} maxWidth="md" fullWidth>
          <DialogTitle>{editMode ? 'Edit Sales Cadence' : 'Sales Cadence Details'}</DialogTitle>
          <DialogContent>
            {selectedCadence && !editMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                  <Typography variant="body1">{selectedCadence.name}</Typography>
                </Box>
                <Box display="flex" gap={4}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                    <Chip label={selectedCadence.status} size="small" color={getStatusColor(selectedCadence.status) as any} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                    <Chip label={selectedCadence.type} size="small" variant="outlined" />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Enrollments</Typography>
                    <Typography variant="body1">{selectedCadence._count?.enrollments || 0}</Typography>
                  </Box>
                </Box>

                <Divider />
                <Typography variant="h6">Steps ({selectedCadence.steps?.length || 0})</Typography>

                {selectedCadence.steps && selectedCadence.steps.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <SortableTableHead
                        columns={[
                          { id: 'stepOrder', label: 'Order', sortable: false },
                          { id: 'stepType', label: 'Type', sortable: false },
                          { id: 'subject', label: 'Subject', sortable: false },
                          { id: 'waitDays', label: 'Wait Days', sortable: false },
                        ]}
                        sortBy=""
                        sortOrder="asc"
                        onSort={() => {}}
                      />
                      <TableBody>
                        {selectedCadence.steps.map((step, idx) => (
                          <TableRow key={step.id || idx}>
                            <TableCell>{step.stepOrder}</TableCell>
                            <TableCell><Chip label={step.stepType} size="small" /></TableCell>
                            <TableCell>{step.subject || '---'}</TableCell>
                            <TableCell>{step.waitDays}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="text.secondary">No steps defined yet.</Typography>
                )}

                <Divider />
                <Typography variant="h6">Add Step</Typography>
                <Box display="flex" gap={2} flexWrap="wrap">
                  <TextField
                    label="Step Order"
                    type="number"
                    value={stepForm.stepOrder}
                    onChange={(e) => setStepForm({ ...stepForm, stepOrder: parseInt(e.target.value) || 1 })}
                    sx={{ width: 120 }}
                  />
                  <TextField
                    select
                    label="Step Type"
                    value={stepForm.stepType}
                    onChange={(e) => setStepForm({ ...stepForm, stepType: e.target.value })}
                    sx={{ width: 160 }}
                  >
                    <MenuItem value="EMAIL">Email</MenuItem>
                    <MenuItem value="CALL">Call</MenuItem>
                    <MenuItem value="LINKEDIN">LinkedIn</MenuItem>
                    <MenuItem value="WAIT">Wait</MenuItem>
                    <MenuItem value="CUSTOM">Custom</MenuItem>
                  </TextField>
                  <TextField
                    label="Subject"
                    value={stepForm.subject}
                    onChange={(e) => setStepForm({ ...stepForm, subject: e.target.value })}
                    sx={{ flex: 1, minWidth: 200 }}
                  />
                  <TextField
                    label="Wait Days"
                    type="number"
                    value={stepForm.waitDays}
                    onChange={(e) => setStepForm({ ...stepForm, waitDays: parseInt(e.target.value) || 0 })}
                    sx={{ width: 120 }}
                  />
                </Box>
                <TextField
                  label="Body"
                  value={stepForm.body}
                  onChange={(e) => setStepForm({ ...stepForm, body: e.target.value })}
                  multiline
                  rows={3}
                  fullWidth
                />
                <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddStep} disabled={!stepForm.subject}>
                  Add Step
                </Button>
              </Box>
            )}

            {selectedCadence && editMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Cadence Name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  select
                  label="Status"
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="PAUSED">Paused</MenuItem>
                  <MenuItem value="ARCHIVED">Archived</MenuItem>
                </TextField>
                <TextField
                  select
                  label="Type"
                  value={editFormData.type}
                  onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="OUTBOUND">Outbound</MenuItem>
                  <MenuItem value="INBOUND">Inbound</MenuItem>
                  <MenuItem value="EVENT_BASED">Event Based</MenuItem>
                </TextField>
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
                <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => selectedCadence && handleDelete(selectedCadence.id)}>Delete</Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
