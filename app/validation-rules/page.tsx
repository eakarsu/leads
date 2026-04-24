'use client';

import { useState, useMemo } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableRow, IconButton, Chip, Card,
  CardContent, MenuItem, Alert, FormControlLabel, Checkbox, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RuleIcon from '@mui/icons-material/Rule';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface ValidationRule {
  id: string;
  name: string;
  objectType: string;
  formula: string;
  errorMessage: string;
  isActive: boolean;
  createdAt: string;
}

const columns: Column[] = [
  { id: 'name', label: 'Name' },
  { id: 'objectType', label: 'Object Type' },
  { id: 'formula', label: 'Formula' },
  { id: 'errorMessage', label: 'Error Message' },
  { id: 'isActive', label: 'Active' },
  { id: 'actions', label: 'Actions', sortable: false, align: 'center' },
];

export default function ValidationRulesPage() {
  const toast = useToast();
  const { confirm } = useConfirmDialog();

  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedRule, setSelectedRule] = useState<ValidationRule | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    objectType: 'Lead',
    formula: '',
    errorMessage: '',
    isActive: true,
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    objectType: 'Lead',
    formula: '',
    errorMessage: '',
    isActive: true,
  });

  const {
    data: rules,
    loading,
    error,
    pagination,
    setPage,
    setPageSize,
    setSort,
    refresh,
  } = usePagination<ValidationRule>({
    url: '/api/validation-rules',
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
      const response = await fetch('/api/validation-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to create validation rule');
      setOpenDialog(false);
      setFormData({ name: '', objectType: 'Lead', formula: '', errorMessage: '', isActive: true });
      toast.showSuccess('Validation rule created successfully');
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleUpdate = async () => {
    if (!selectedRule) return;
    try {
      const response = await fetch(`/api/validation-rules/${selectedRule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      if (!response.ok) throw new Error('Failed to update validation rule');
      toast.showSuccess('Validation rule updated successfully');
      setEditMode(false);
      setOpenDetailDialog(false);
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Validation Rule',
      message: 'Are you sure you want to delete this validation rule? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/validation-rules/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete validation rule');
      toast.showSuccess('Validation rule deleted successfully');
      setOpenDetailDialog(false);
      setSelectedRule(null);
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleRowClick = (rule: ValidationRule) => {
    setSelectedRule(rule);
    setEditMode(false);
    setOpenDetailDialog(true);
  };

  const handleStartEdit = () => {
    if (!selectedRule) return;
    setEditFormData({
      name: selectedRule.name,
      objectType: selectedRule.objectType,
      formula: selectedRule.formula,
      errorMessage: selectedRule.errorMessage,
      isActive: selectedRule.isActive,
    });
    setEditMode(true);
  };

  const exportData = useMemo(() => {
    return rules.map((r) => ({
      Name: r.name,
      'Object Type': r.objectType,
      Formula: r.formula,
      'Error Message': r.errorMessage,
      Active: r.isActive ? 'Yes' : 'No',
      Created: new Date(r.createdAt).toLocaleDateString(),
    }));
  }, [rules]);

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <RuleIcon sx={{ fontSize: 32 }} />
            <Typography variant="h4">Validation Rules</Typography>
          </Box>
          <Box display="flex" gap={1} alignItems="center">
            <ExportToolbar data={exportData} filename="validation-rules" title="Validation Rules" />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
              New Rule
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
                    {rules.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography color="text.secondary">No validation rules found. Create your first rule!</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      rules.map((rule) => (
                        <TableRow key={rule.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(rule)}>
                          <TableCell>{rule.name}</TableCell>
                          <TableCell><Chip label={rule.objectType} size="small" variant="outlined" /></TableCell>
                          <TableCell>
                            <Tooltip title={rule.formula}>
                              <Typography variant="body2" noWrap sx={{ maxWidth: 200, fontFamily: 'monospace', fontSize: 12 }}>
                                {rule.formula}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={rule.errorMessage}>
                              <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                {rule.errorMessage}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={rule.isActive ? 'Active' : 'Inactive'}
                              size="small"
                              color={rule.isActive ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                            <IconButton size="small" onClick={() => handleRowClick(rule)} title="View">
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => { setSelectedRule(rule); handleStartEdit(); setOpenDetailDialog(true); }} title="Edit">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDelete(rule.id)} title="Delete" color="error">
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
          <DialogTitle>Create Validation Rule</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Rule Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
              <TextField
                select
                label="Object Type"
                value={formData.objectType}
                onChange={(e) => setFormData({ ...formData, objectType: e.target.value })}
                fullWidth
              >
                <MenuItem value="Lead">Lead</MenuItem>
                <MenuItem value="Contact">Contact</MenuItem>
                <MenuItem value="Opportunity">Opportunity</MenuItem>
                <MenuItem value="Case">Case</MenuItem>
                <MenuItem value="Account">Account</MenuItem>
              </TextField>
              <TextField
                label="Formula"
                value={formData.formula}
                onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                multiline
                rows={4}
                fullWidth
                required
                placeholder="ISBLANK(Email) && ISBLANK(Phone)"
                sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: 13 } }}
              />
              <TextField
                label="Error Message"
                value={formData.errorMessage}
                onChange={(e) => setFormData({ ...formData, errorMessage: e.target.value })}
                fullWidth
                required
                placeholder="Please provide either an email or phone number."
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} variant="contained" disabled={!formData.name || !formData.formula || !formData.errorMessage}>
              Create Rule
            </Button>
          </DialogActions>
        </Dialog>

        {/* Detail / Edit Dialog */}
        <Dialog open={openDetailDialog} onClose={() => { setOpenDetailDialog(false); setEditMode(false); }} maxWidth="sm" fullWidth>
          <DialogTitle>{editMode ? 'Edit Validation Rule' : 'Validation Rule Details'}</DialogTitle>
          <DialogContent>
            {selectedRule && !editMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box display="flex" gap={4}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                    <Typography variant="body1">{selectedRule.name}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Object Type</Typography>
                    <Chip label={selectedRule.objectType} size="small" variant="outlined" />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                    <Chip label={selectedRule.isActive ? 'Active' : 'Inactive'} size="small" color={selectedRule.isActive ? 'success' : 'default'} />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Formula</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 0.5 }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 13 }}>
                      {selectedRule.formula}
                    </Typography>
                  </Paper>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Error Message</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 0.5, bgcolor: 'error.50' }}>
                    <Typography variant="body2">{selectedRule.errorMessage}</Typography>
                  </Paper>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                  <Typography variant="body1">{new Date(selectedRule.createdAt).toLocaleString()}</Typography>
                </Box>
              </Box>
            )}

            {selectedRule && editMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Rule Name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  select
                  label="Object Type"
                  value={editFormData.objectType}
                  onChange={(e) => setEditFormData({ ...editFormData, objectType: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="Lead">Lead</MenuItem>
                  <MenuItem value="Contact">Contact</MenuItem>
                  <MenuItem value="Opportunity">Opportunity</MenuItem>
                  <MenuItem value="Case">Case</MenuItem>
                  <MenuItem value="Account">Account</MenuItem>
                </TextField>
                <TextField
                  label="Formula"
                  value={editFormData.formula}
                  onChange={(e) => setEditFormData({ ...editFormData, formula: e.target.value })}
                  multiline
                  rows={4}
                  fullWidth
                  required
                  sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: 13 } }}
                />
                <TextField
                  label="Error Message"
                  value={editFormData.errorMessage}
                  onChange={(e) => setEditFormData({ ...editFormData, errorMessage: e.target.value })}
                  fullWidth
                  required
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={editFormData.isActive}
                      onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                    />
                  }
                  label="Active"
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {editMode ? (
              <>
                <Button onClick={() => setEditMode(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleUpdate} disabled={!editFormData.name || !editFormData.formula || !editFormData.errorMessage}>Save</Button>
              </>
            ) : (
              <>
                <Button onClick={() => setOpenDetailDialog(false)}>Close</Button>
                <Button variant="contained" startIcon={<EditIcon />} onClick={handleStartEdit}>Edit</Button>
                <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => selectedRule && handleDelete(selectedRule.id)}>Delete</Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
