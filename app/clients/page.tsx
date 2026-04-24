'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';
import { usePagination } from '@/lib/usePagination';
import { clientFormSchema, validateForm } from '@/lib/validation';

interface Client {
  id: string;
  name: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  website?: string;
  contactPhone?: string;
  notes?: string;
  _count: {
    campaigns: number;
    leads: number;
  };
}

const columns: Column[] = [
  { id: 'name', label: 'Company Name', sortable: true },
  { id: 'industry', label: 'Industry', sortable: true },
  { id: 'contactName', label: 'Contact Person', sortable: true },
  { id: 'contactEmail', label: 'Email', sortable: true },
  { id: 'campaigns', label: 'Campaigns', sortable: false, align: 'center' },
  { id: 'leads', label: 'Leads', sortable: false, align: 'center' },
];

const emptyFormData = {
  name: '',
  industry: '',
  website: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  notes: '',
};

export default function ClientsPage() {
  const { showSuccess, showError } = useToast();
  const { confirm } = useConfirmDialog();

  // Sort state (tracked locally so SortableTableHead can read current values)
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination hook
  const {
    data,
    loading,
    error,
    pagination,
    setPage,
    setPageSize,
    setSort,
    refresh,
  } = usePagination<Client>({
    url: '/api/clients',
    defaultSortBy: 'name',
    defaultSortOrder: 'asc',
  });

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Form state
  const [formData, setFormData] = useState(emptyFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Sort handler
  const handleSort = (columnId: string) => {
    const isAsc = sortBy === columnId && sortOrder === 'asc';
    const newOrder = isAsc ? 'desc' : 'asc';
    setSortBy(columnId);
    setSortOrder(newOrder);
    setSort(columnId, newOrder);
  };

  // Export data
  const exportData = data.map((c) => ({
    Name: c.name,
    Industry: c.industry,
    Contact: c.contactName,
    Email: c.contactEmail,
    Campaigns: c._count?.campaigns || 0,
    Leads: c._count?.leads || 0,
  }));

  // Form field change handler
  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // --- Create ---
  const handleOpenCreate = () => {
    setFormData(emptyFormData);
    setFormErrors({});
    setCreateDialogOpen(true);
  };

  const handleCreateClient = async () => {
    const validation = validateForm(clientFormSchema, formData);
    if (!validation.success) {
      setFormErrors(validation.errors);
      return;
    }

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to create client');
      }

      setCreateDialogOpen(false);
      setFormData(emptyFormData);
      setFormErrors({});
      showSuccess('Client created successfully');
      refresh();
    } catch (err: any) {
      showError(err.message);
    }
  };

  // --- Detail / Edit ---
  const handleRowClick = (client: Client) => {
    setSelectedClient(client);
    setEditMode(false);
    setDetailDialogOpen(true);
  };

  const handleStartEdit = () => {
    if (!selectedClient) return;
    setFormData({
      name: selectedClient.name || '',
      industry: selectedClient.industry || '',
      website: (selectedClient as any).website || '',
      contactName: selectedClient.contactName || '',
      contactEmail: selectedClient.contactEmail || '',
      contactPhone: (selectedClient as any).contactPhone || '',
      notes: (selectedClient as any).notes || '',
    });
    setFormErrors({});
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setFormErrors({});
  };

  const handleSaveEdit = async () => {
    if (!selectedClient) return;

    const validation = validateForm(clientFormSchema, formData);
    if (!validation.success) {
      setFormErrors(validation.errors);
      return;
    }

    try {
      const response = await fetch(`/api/clients/${selectedClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to update client');
      }

      setDetailDialogOpen(false);
      setEditMode(false);
      setFormErrors({});
      showSuccess('Client updated successfully');
      refresh();
    } catch (err: any) {
      showError(err.message);
    }
  };

  // --- Delete ---
  const handleDelete = async () => {
    if (!selectedClient) return;

    const confirmed = await confirm({
      title: 'Delete Client',
      message: `Are you sure you want to delete "${selectedClient.name}"? This action cannot be undone.`,
      severity: 'error',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/clients/${selectedClient.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to delete client');
      }

      setDetailDialogOpen(false);
      setSelectedClient(null);
      showSuccess('Client deleted successfully');
      refresh();
    } catch (err: any) {
      showError(err.message);
    }
  };

  // --- Form fields renderer ---
  const renderFormFields = () => (
    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Company Name"
        value={formData.name}
        onChange={(e) => handleFieldChange('name', e.target.value)}
        fullWidth
        required
        error={!!formErrors.name}
        helperText={formErrors.name}
      />
      <TextField
        label="Industry"
        value={formData.industry}
        onChange={(e) => handleFieldChange('industry', e.target.value)}
        fullWidth
        required
        placeholder="e.g., SaaS, Manufacturing, Healthcare"
        error={!!formErrors.industry}
        helperText={formErrors.industry}
      />
      <TextField
        label="Website"
        value={formData.website}
        onChange={(e) => handleFieldChange('website', e.target.value)}
        fullWidth
        placeholder="https://example.com"
        error={!!formErrors.website}
        helperText={formErrors.website}
      />
      <TextField
        label="Contact Person Name"
        value={formData.contactName}
        onChange={(e) => handleFieldChange('contactName', e.target.value)}
        fullWidth
        required
        error={!!formErrors.contactName}
        helperText={formErrors.contactName}
      />
      <TextField
        label="Contact Email"
        type="email"
        value={formData.contactEmail}
        onChange={(e) => handleFieldChange('contactEmail', e.target.value)}
        fullWidth
        required
        error={!!formErrors.contactEmail}
        helperText={formErrors.contactEmail}
      />
      <TextField
        label="Contact Phone"
        value={formData.contactPhone}
        onChange={(e) => handleFieldChange('contactPhone', e.target.value)}
        fullWidth
        error={!!formErrors.contactPhone}
        helperText={formErrors.contactPhone}
      />
      <TextField
        label="Notes"
        value={formData.notes}
        onChange={(e) => handleFieldChange('notes', e.target.value)}
        multiline
        rows={3}
        fullWidth
        error={!!formErrors.notes}
        helperText={formErrors.notes}
      />
    </Box>
  );

  return (
    <DashboardLayout>
      <Box>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Clients</Typography>
          <Box display="flex" gap={2} alignItems="center">
            <ExportToolbar data={exportData} filename="clients" title="Clients" />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
            >
              New Client
            </Button>
          </Box>
        </Box>

        {/* Table */}
        <Card>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={5} columns={6} />
            ) : error ? (
              <Typography color="error" sx={{ p: 2 }}>
                {error}
              </Typography>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <SortableTableHead
                    columns={columns}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <TableBody>
                    {data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography color="text.secondary" sx={{ py: 4 }}>
                            No clients found. Create your first client!
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.map((client) => (
                        <TableRow
                          key={client.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => handleRowClick(client)}
                        >
                          <TableCell>{client.name}</TableCell>
                          <TableCell>{client.industry}</TableCell>
                          <TableCell>{client.contactName}</TableCell>
                          <TableCell>{client.contactEmail}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={client._count?.campaigns || 0}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={client._count?.leads || 0}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        <PaginationControls
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />

        {/* Create Client Dialog */}
        <Dialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Create New Client</DialogTitle>
          <DialogContent>{renderFormFields()}</DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateClient} variant="contained">
              Create Client
            </Button>
          </DialogActions>
        </Dialog>

        {/* Detail / Edit Client Dialog */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => {
            setDetailDialogOpen(false);
            setEditMode(false);
            setFormErrors({});
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editMode ? 'Edit Client' : 'Client Details'}
          </DialogTitle>
          <DialogContent>
            {editMode ? (
              renderFormFields()
            ) : selectedClient ? (
              <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Company Name
                  </Typography>
                  <Typography variant="body1">{selectedClient.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Industry
                  </Typography>
                  <Typography variant="body1">{selectedClient.industry}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Contact Person
                  </Typography>
                  <Typography variant="body1">{selectedClient.contactName}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Contact Email
                  </Typography>
                  <Typography variant="body1">{selectedClient.contactEmail}</Typography>
                </Box>
                <Box display="flex" gap={4}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Campaigns
                    </Typography>
                    <Typography variant="body1">
                      {selectedClient._count?.campaigns || 0}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Leads
                    </Typography>
                    <Typography variant="body1">
                      {selectedClient._count?.leads || 0}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ) : null}
          </DialogContent>
          <DialogActions>
            {editMode ? (
              <>
                <Button onClick={handleCancelEdit}>Cancel</Button>
                <Button onClick={handleSaveEdit} variant="contained">
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleDelete}
                  color="error"
                  startIcon={<DeleteIcon />}
                >
                  Delete
                </Button>
                <Button
                  onClick={handleStartEdit}
                  variant="outlined"
                  startIcon={<EditIcon />}
                >
                  Edit
                </Button>
                <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
