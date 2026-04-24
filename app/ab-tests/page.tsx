'use client';

import { useState, useMemo } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableRow, IconButton, Chip, Card,
  CardContent, MenuItem, Alert, Slider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ScienceIcon from '@mui/icons-material/Science';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface ABTest {
  id: string;
  name: string;
  testType: string;
  status: string;
  splitPercent: number;
  winnerCriteria: string;
  variantA: any;
  variantB: any;
  createdAt: string;
}

const columns: Column[] = [
  { id: 'name', label: 'Name' },
  { id: 'testType', label: 'Type' },
  { id: 'status', label: 'Status' },
  { id: 'splitPercent', label: 'Split %' },
  { id: 'winnerCriteria', label: 'Winner Criteria' },
  { id: 'actions', label: 'Actions', sortable: false, align: 'center' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'RUNNING': return 'success';
    case 'COMPLETED': return 'info';
    case 'PAUSED': return 'warning';
    default: return 'default';
  }
};

export default function ABTestsPage() {
  const toast = useToast();
  const { confirm } = useConfirmDialog();

  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    testType: 'EMAIL',
    status: 'DRAFT',
    splitPercent: 50,
    winnerCriteria: 'OPEN_RATE',
    variantA: '',
    variantB: '',
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    testType: 'EMAIL',
    status: 'DRAFT',
    splitPercent: 50,
    winnerCriteria: 'OPEN_RATE',
    variantA: '',
    variantB: '',
  });

  const {
    data: tests,
    loading,
    error,
    pagination,
    setPage,
    setPageSize,
    setSort,
    refresh,
  } = usePagination<ABTest>({
    url: '/api/ab-tests',
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
      return str;
    }
  };

  const handleCreate = async () => {
    try {
      const payload = {
        ...formData,
        variantA: parseJSON(formData.variantA),
        variantB: parseJSON(formData.variantB),
      };
      const response = await fetch('/api/ab-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to create A/B test');
      setOpenDialog(false);
      setFormData({ name: '', testType: 'EMAIL', status: 'DRAFT', splitPercent: 50, winnerCriteria: 'OPEN_RATE', variantA: '', variantB: '' });
      toast.showSuccess('A/B test created successfully');
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleUpdate = async () => {
    if (!selectedTest) return;
    try {
      const payload = {
        ...editFormData,
        variantA: parseJSON(editFormData.variantA),
        variantB: parseJSON(editFormData.variantB),
      };
      const response = await fetch(`/api/ab-tests/${selectedTest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to update A/B test');
      toast.showSuccess('A/B test updated successfully');
      setEditMode(false);
      setOpenDetailDialog(false);
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete A/B Test',
      message: 'Are you sure you want to delete this A/B test? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/ab-tests/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete A/B test');
      toast.showSuccess('A/B test deleted successfully');
      setOpenDetailDialog(false);
      setSelectedTest(null);
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleRowClick = (test: ABTest) => {
    setSelectedTest(test);
    setEditMode(false);
    setOpenDetailDialog(true);
  };

  const handleStartEdit = () => {
    if (!selectedTest) return;
    setEditFormData({
      name: selectedTest.name,
      testType: selectedTest.testType,
      status: selectedTest.status,
      splitPercent: selectedTest.splitPercent,
      winnerCriteria: selectedTest.winnerCriteria,
      variantA: typeof selectedTest.variantA === 'string' ? selectedTest.variantA : JSON.stringify(selectedTest.variantA, null, 2),
      variantB: typeof selectedTest.variantB === 'string' ? selectedTest.variantB : JSON.stringify(selectedTest.variantB, null, 2),
    });
    setEditMode(true);
  };

  const exportData = useMemo(() => {
    return tests.map((t) => ({
      Name: t.name,
      Type: t.testType,
      Status: t.status,
      'Split %': t.splitPercent,
      'Winner Criteria': t.winnerCriteria,
      Created: new Date(t.createdAt).toLocaleDateString(),
    }));
  }, [tests]);

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <ScienceIcon sx={{ fontSize: 32 }} />
            <Typography variant="h4">A/B Tests</Typography>
          </Box>
          <Box display="flex" gap={1} alignItems="center">
            <ExportToolbar data={exportData} filename="ab-tests" title="A/B Tests" />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
              New A/B Test
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
                    {tests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography color="text.secondary">No A/B tests found. Create your first test!</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      tests.map((test) => (
                        <TableRow key={test.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(test)}>
                          <TableCell>{test.name}</TableCell>
                          <TableCell><Chip label={test.testType} size="small" variant="outlined" /></TableCell>
                          <TableCell>
                            <Chip label={test.status} size="small" color={getStatusColor(test.status) as any} />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2">{test.splitPercent}%</Typography>
                              <Typography variant="body2" color="text.secondary">/ {100 - test.splitPercent}%</Typography>
                            </Box>
                          </TableCell>
                          <TableCell><Chip label={test.winnerCriteria.replace('_', ' ')} size="small" /></TableCell>
                          <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                            <IconButton size="small" onClick={() => handleRowClick(test)} title="View">
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => { setSelectedTest(test); handleStartEdit(); setOpenDetailDialog(true); }} title="Edit">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDelete(test.id)} title="Delete" color="error">
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
          <DialogTitle>Create A/B Test</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Test Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
              <TextField
                select
                label="Test Type"
                value={formData.testType}
                onChange={(e) => setFormData({ ...formData, testType: e.target.value })}
                fullWidth
              >
                <MenuItem value="EMAIL">Email</MenuItem>
                <MenuItem value="LANDING_PAGE">Landing Page</MenuItem>
                <MenuItem value="SUBJECT_LINE">Subject Line</MenuItem>
              </TextField>
              <TextField
                select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                fullWidth
              >
                <MenuItem value="DRAFT">Draft</MenuItem>
                <MenuItem value="RUNNING">Running</MenuItem>
                <MenuItem value="PAUSED">Paused</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
              </TextField>
              <Box>
                <Typography variant="subtitle2" gutterBottom>Split Percentage (Variant A : Variant B)</Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="body2">{formData.splitPercent}%</Typography>
                  <Slider
                    value={formData.splitPercent}
                    onChange={(_, val) => setFormData({ ...formData, splitPercent: val as number })}
                    min={10}
                    max={90}
                    step={5}
                    sx={{ flex: 1 }}
                  />
                  <Typography variant="body2">{100 - formData.splitPercent}%</Typography>
                </Box>
              </Box>
              <TextField
                select
                label="Winner Criteria"
                value={formData.winnerCriteria}
                onChange={(e) => setFormData({ ...formData, winnerCriteria: e.target.value })}
                fullWidth
              >
                <MenuItem value="OPEN_RATE">Open Rate</MenuItem>
                <MenuItem value="CLICK_RATE">Click Rate</MenuItem>
                <MenuItem value="CONVERSION">Conversion</MenuItem>
              </TextField>
              <TextField
                label="Variant A (JSON)"
                value={formData.variantA}
                onChange={(e) => setFormData({ ...formData, variantA: e.target.value })}
                multiline
                rows={4}
                fullWidth
                placeholder='{"subject": "Try our product", "body": "..."}'
              />
              <TextField
                label="Variant B (JSON)"
                value={formData.variantB}
                onChange={(e) => setFormData({ ...formData, variantB: e.target.value })}
                multiline
                rows={4}
                fullWidth
                placeholder='{"subject": "Discover our product", "body": "..."}'
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} variant="contained" disabled={!formData.name}>
              Create Test
            </Button>
          </DialogActions>
        </Dialog>

        {/* Detail / Edit Dialog */}
        <Dialog open={openDetailDialog} onClose={() => { setOpenDetailDialog(false); setEditMode(false); }} maxWidth="md" fullWidth>
          <DialogTitle>{editMode ? 'Edit A/B Test' : 'A/B Test Details'}</DialogTitle>
          <DialogContent>
            {selectedTest && !editMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box display="flex" gap={4} flexWrap="wrap">
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                    <Typography variant="body1">{selectedTest.name}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                    <Chip label={selectedTest.testType} size="small" variant="outlined" />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                    <Chip label={selectedTest.status} size="small" color={getStatusColor(selectedTest.status) as any} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Split</Typography>
                    <Typography variant="body1">{selectedTest.splitPercent}% / {100 - selectedTest.splitPercent}%</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Winner Criteria</Typography>
                    <Chip label={selectedTest.winnerCriteria.replace('_', ' ')} size="small" />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Variant A</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 0.5, bgcolor: 'success.50' }}>
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 12 }}>
                      {typeof selectedTest.variantA === 'string' ? selectedTest.variantA : JSON.stringify(selectedTest.variantA, null, 2)}
                    </Typography>
                  </Paper>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Variant B</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 0.5, bgcolor: 'info.50' }}>
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 12 }}>
                      {typeof selectedTest.variantB === 'string' ? selectedTest.variantB : JSON.stringify(selectedTest.variantB, null, 2)}
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            )}

            {selectedTest && editMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Test Name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  select
                  label="Test Type"
                  value={editFormData.testType}
                  onChange={(e) => setEditFormData({ ...editFormData, testType: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="EMAIL">Email</MenuItem>
                  <MenuItem value="LANDING_PAGE">Landing Page</MenuItem>
                  <MenuItem value="SUBJECT_LINE">Subject Line</MenuItem>
                </TextField>
                <TextField
                  select
                  label="Status"
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="RUNNING">Running</MenuItem>
                  <MenuItem value="PAUSED">Paused</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                </TextField>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Split Percentage</Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="body2">{editFormData.splitPercent}%</Typography>
                    <Slider
                      value={editFormData.splitPercent}
                      onChange={(_, val) => setEditFormData({ ...editFormData, splitPercent: val as number })}
                      min={10}
                      max={90}
                      step={5}
                      sx={{ flex: 1 }}
                    />
                    <Typography variant="body2">{100 - editFormData.splitPercent}%</Typography>
                  </Box>
                </Box>
                <TextField
                  select
                  label="Winner Criteria"
                  value={editFormData.winnerCriteria}
                  onChange={(e) => setEditFormData({ ...editFormData, winnerCriteria: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="OPEN_RATE">Open Rate</MenuItem>
                  <MenuItem value="CLICK_RATE">Click Rate</MenuItem>
                  <MenuItem value="CONVERSION">Conversion</MenuItem>
                </TextField>
                <TextField
                  label="Variant A (JSON)"
                  value={editFormData.variantA}
                  onChange={(e) => setEditFormData({ ...editFormData, variantA: e.target.value })}
                  multiline
                  rows={4}
                  fullWidth
                />
                <TextField
                  label="Variant B (JSON)"
                  value={editFormData.variantB}
                  onChange={(e) => setEditFormData({ ...editFormData, variantB: e.target.value })}
                  multiline
                  rows={4}
                  fullWidth
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
                <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => selectedTest && handleDelete(selectedTest.id)}>Delete</Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
