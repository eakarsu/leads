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

interface FieldServiceAsset {
  id: string;
  name: string;
  serialNumber: string | null;
  accountName: string | null;
  productName: string | null;
  installDate: string | null;
  warrantyEnd: string | null;
  lastServiceDate: string | null;
  address: string | null;
  territory: { id: string; name: string } | null;
  createdAt: string;
}

const columns: Column[] = [
  { id: 'name', label: 'Name' },
  { id: 'serialNumber', label: 'Serial#' },
  { id: 'accountName', label: 'Account' },
  { id: 'productName', label: 'Product' },
  { id: 'territory', label: 'Territory', sortable: false },
  { id: 'installDate', label: 'Install Date' },
  { id: 'warrantyEnd', label: 'Warranty End' },
  { id: 'lastServiceDate', label: 'Last Service' },
  { id: 'actions', label: 'Actions', sortable: false },
];

const defaultFormData = {
  name: '',
  serialNumber: '',
  accountName: '',
  productName: '',
  territoryId: '',
  installDate: '',
  warrantyEnd: '',
  address: '',
  lastServiceDate: '',
};

export default function FieldServiceAssetsPage() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FieldServiceAsset | null>(null);
  const [territories, setTerritories] = useState<any[]>([]);
  const [formData, setFormData] = useState({ ...defaultFormData });
  const [editFormData, setEditFormData] = useState({ ...defaultFormData });

  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: items, loading, pagination, setPage, setPageSize, setSort, refresh } = usePagination<FieldServiceAsset>({
    url: '/api/field-service-assets',
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
    fetchTerritories();
  }, []);

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
        installDate: formData.installDate || null,
        warrantyEnd: formData.warrantyEnd || null,
        lastServiceDate: formData.lastServiceDate || null,
      };
      const res = await fetch('/api/field-service-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setDialogOpen(false);
        refresh();
        setFormData({ ...defaultFormData });
        toast.showSuccess('Field service asset created successfully');
      } else {
        toast.showError('Failed to create asset');
      }
    } catch (error) {
      console.error('Error creating asset:', error);
      toast.showError('Error creating asset');
    }
  };

  const handleEdit = (item: FieldServiceAsset) => {
    setSelectedItem(item);
    setEditFormData({
      name: item.name || '',
      serialNumber: item.serialNumber || '',
      accountName: item.accountName || '',
      productName: item.productName || '',
      territoryId: item.territory?.id || '',
      installDate: item.installDate ? new Date(item.installDate).toISOString().slice(0, 10) : '',
      warrantyEnd: item.warrantyEnd ? new Date(item.warrantyEnd).toISOString().slice(0, 10) : '',
      address: item.address || '',
      lastServiceDate: item.lastServiceDate ? new Date(item.lastServiceDate).toISOString().slice(0, 10) : '',
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    try {
      const payload = {
        ...editFormData,
        installDate: editFormData.installDate || null,
        warrantyEnd: editFormData.warrantyEnd || null,
        lastServiceDate: editFormData.lastServiceDate || null,
      };
      const res = await fetch(`/api/field-service-assets/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setEditDialogOpen(false);
        refresh();
        toast.showSuccess('Asset updated successfully');
      } else {
        toast.showError('Failed to update asset');
      }
    } catch (error) {
      console.error('Error updating asset:', error);
      toast.showError('Error updating asset');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Field Service Asset',
      message: 'Are you sure you want to delete this asset? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/field-service-assets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        refresh();
        toast.showSuccess('Asset deleted successfully');
      } else {
        toast.showError('Failed to delete asset');
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast.showError('Error deleting asset');
    }
  };

  const isWarrantyExpired = (warrantyEnd: string | null) => {
    if (!warrantyEnd) return false;
    return new Date(warrantyEnd) < new Date();
  };

  const filteredItems = items.filter((item) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      item.name?.toLowerCase().includes(s) ||
      item.serialNumber?.toLowerCase().includes(s) ||
      item.accountName?.toLowerCase().includes(s) ||
      item.productName?.toLowerCase().includes(s) ||
      item.territory?.name?.toLowerCase().includes(s)
    );
  });

  const exportData = filteredItems.map((item) => ({
    'Name': item.name,
    'Serial#': item.serialNumber || '-',
    'Account': item.accountName || '-',
    'Product': item.productName || '-',
    'Territory': item.territory?.name || '-',
    'Install Date': item.installDate ? new Date(item.installDate).toLocaleDateString() : '-',
    'Warranty End': item.warrantyEnd ? new Date(item.warrantyEnd).toLocaleDateString() : '-',
    'Last Service': item.lastServiceDate ? new Date(item.lastServiceDate).toLocaleDateString() : '-',
  }));

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Field Service Assets</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ExportToolbar data={exportData} filename="field-service-assets" title="Field Service Assets Export" />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              New Asset
            </Button>
          </Box>
        </Box>

        <Paper sx={{ mb: 2, p: 2 }}>
          <TextField
            size="small"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 300 }}
          />
        </Paper>

        {loading ? (
          <TableSkeleton rows={8} columns={9} />
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
                    <TableCell>{item.serialNumber || '-'}</TableCell>
                    <TableCell>{item.accountName || '-'}</TableCell>
                    <TableCell>{item.productName || '-'}</TableCell>
                    <TableCell>{item.territory?.name || '-'}</TableCell>
                    <TableCell>{item.installDate ? new Date(item.installDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      {item.warrantyEnd ? (
                        <Chip
                          label={new Date(item.warrantyEnd).toLocaleDateString()}
                          color={isWarrantyExpired(item.warrantyEnd) ? 'error' : 'success'}
                          size="small"
                          variant={isWarrantyExpired(item.warrantyEnd) ? 'filled' : 'outlined'}
                        />
                      ) : '-'}
                    </TableCell>
                    <TableCell>{item.lastServiceDate ? new Date(item.lastServiceDate).toLocaleDateString() : '-'}</TableCell>
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
                    <TableCell colSpan={9} align="center">No field service assets found</TableCell>
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
        <DialogTitle>Create Field Service Asset</DialogTitle>
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
              <TextField
                fullWidth
                label="Serial Number"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Account Name"
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Product Name"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
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
                label="Install Date"
                type="date"
                value={formData.installDate}
                onChange={(e) => setFormData({ ...formData, installDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Warranty End"
                type="date"
                value={formData.warrantyEnd}
                onChange={(e) => setFormData({ ...formData, warrantyEnd: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Last Service Date"
                type="date"
                value={formData.lastServiceDate}
                onChange={(e) => setFormData({ ...formData, lastServiceDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                multiline
                rows={2}
              />
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
        <DialogTitle>Edit Field Service Asset</DialogTitle>
        <DialogContent>
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
              <TextField
                fullWidth
                label="Serial Number"
                value={editFormData.serialNumber}
                onChange={(e) => setEditFormData({ ...editFormData, serialNumber: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Account Name"
                value={editFormData.accountName}
                onChange={(e) => setEditFormData({ ...editFormData, accountName: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Product Name"
                value={editFormData.productName}
                onChange={(e) => setEditFormData({ ...editFormData, productName: e.target.value })}
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
                label="Install Date"
                type="date"
                value={editFormData.installDate}
                onChange={(e) => setEditFormData({ ...editFormData, installDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Warranty End"
                type="date"
                value={editFormData.warrantyEnd}
                onChange={(e) => setEditFormData({ ...editFormData, warrantyEnd: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Last Service Date"
                type="date"
                value={editFormData.lastServiceDate}
                onChange={(e) => setEditFormData({ ...editFormData, lastServiceDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Address"
                value={editFormData.address}
                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                multiline
                rows={2}
              />
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
