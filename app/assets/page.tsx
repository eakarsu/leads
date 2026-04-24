'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  IconButton,
  Chip,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import InventoryIcon from '@mui/icons-material/Inventory';
import BuildIcon from '@mui/icons-material/Build';
import WarningIcon from '@mui/icons-material/Warning';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface Asset {
  id: string;
  name: string;
  serialNumber: string | null;
  status: string;
  quantity: number;
  price: number;
  purchaseDate: string | null;
  installDate: string | null;
  warrantyEndDate: string | null;
  description: string | null;
  account: { id: string; name: string } | null;
  contact: { id: string; firstName: string; lastName: string } | null;
  product: { id: string; name: string; productCode: string } | null;
  parent: { id: string; name: string } | null;
  children: any[];
  _count: { cases: number; entitlements: number; children: number };
}

const columns: Column[] = [
  { id: 'name', label: 'Asset Name' },
  { id: 'serialNumber', label: 'Serial Number' },
  { id: 'account', label: 'Account', sortable: false },
  { id: 'product', label: 'Product', sortable: false },
  { id: 'quantity', label: 'Qty' },
  { id: 'price', label: 'Value' },
  { id: 'warrantyEndDate', label: 'Warranty' },
  { id: 'status', label: 'Status' },
  { id: 'actions', label: 'Actions', sortable: false },
];

export default function AssetsPage() {
  const toast = useToast();
  const { confirm } = useConfirmDialog();
  const [stats, setStats] = useState({
    totalAssets: 0,
    installedAssets: 0,
    purchasedAssets: 0,
    warrantyExpiringSoon: 0,
    totalValue: 0,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    serialNumber: '',
    description: '',
    status: '',
    quantity: 1,
    price: 0,
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [formData, setFormData] = useState({
    name: '',
    accountId: '',
    productId: '',
    serialNumber: '',
    status: 'PURCHASED',
    quantity: 1,
    price: 0,
    purchaseDate: '',
    installDate: '',
    warrantyStartDate: '',
    warrantyEndDate: '',
    description: '',
  });

  const extraParams: Record<string, string> = {};
  if (search) extraParams.search = search;
  if (statusFilter) extraParams.status = statusFilter;

  const {
    data: assets,
    loading,
    error,
    pagination,
    setPage,
    setPageSize,
    setSort,
    refresh,
  } = usePagination<Asset>({
    url: '/api/assets',
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
    extraParams,
  });

  useEffect(() => {
    fetchAccounts();
    fetchProducts();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/assets');
      const data = await response.json();
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/clients');
      const data = await response.json();
      setAccounts(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSort = (columnId: string) => {
    const newOrder = sortBy === columnId && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(columnId);
    setSortOrder(newOrder);
    setSort(columnId, newOrder);
  };

  const handleCreateAsset = async () => {
    try {
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setDialogOpen(false);
        toast.showSuccess('Asset created successfully');
        refresh();
        fetchStats();
        resetForm();
      }
    } catch (error) {
      toast.showError('Error creating asset');
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    const confirmed = await confirm({
      title: 'Delete Asset',
      message: 'Are you sure you want to delete this asset? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      await fetch(`/api/assets?id=${assetId}`, { method: 'DELETE' });
      toast.showSuccess('Asset deleted successfully');
      refresh();
      fetchStats();
    } catch (error) {
      toast.showError('Error deleting asset');
    }
  };

  const handleStartEdit = () => {
    if (!selectedAsset) return;
    setEditFormData({
      name: selectedAsset.name,
      serialNumber: selectedAsset.serialNumber || '',
      description: selectedAsset.description || '',
      status: selectedAsset.status,
      quantity: selectedAsset.quantity,
      price: selectedAsset.price || 0,
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedAsset) return;
    try {
      const response = await fetch(`/api/assets/${selectedAsset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      if (!response.ok) throw new Error('Failed to update asset');
      toast.showSuccess('Asset updated successfully');
      setEditMode(false);
      setDetailOpen(false);
      refresh();
      fetchStats();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      accountId: '',
      productId: '',
      serialNumber: '',
      status: 'PURCHASED',
      quantity: 1,
      price: 0,
      purchaseDate: '',
      installDate: '',
      warrantyStartDate: '',
      warrantyEndDate: '',
      description: '',
    });
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    setFormData({
      ...formData,
      productId,
      name: product?.name || formData.name,
      price: product?.price || formData.price,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'INSTALLED':
        return 'success';
      case 'PURCHASED':
        return 'info';
      case 'SHIPPED':
        return 'warning';
      case 'OBSOLETE':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const isWarrantyExpiringSoon = (warrantyEndDate: string | null) => {
    if (!warrantyEndDate) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(warrantyEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const exportData = assets.map((a) => ({
    Name: a.name,
    'Serial Number': a.serialNumber || '-',
    Account: a.account?.name || '-',
    Product: a.product?.name || '-',
    Qty: a.quantity,
    Value: formatCurrency((a.price || 0) * a.quantity),
    Warranty: a.warrantyEndDate ? new Date(a.warrantyEndDate).toLocaleDateString() : '-',
    Status: a.status,
  }));

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Assets</Typography>
          <Box display="flex" gap={2} alignItems="center">
            <ExportToolbar data={exportData} filename="assets" title="Assets" />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              New Asset
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <InventoryIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Total Assets</Typography>
                </Box>
                <Typography variant="h4">{stats.totalAssets}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <BuildIcon color="success" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Installed</Typography>
                </Box>
                <Typography variant="h4">{stats.installedAssets}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <WarningIcon color="warning" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Warranty Expiring</Typography>
                </Box>
                <Typography variant="h4">{stats.warrantyExpiringSoon}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AttachMoneyIcon color="info" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Total Value</Typography>
                </Box>
                <Typography variant="h4">{formatCurrency(stats.totalValue)}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search assets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="PURCHASED">Purchased</MenuItem>
                  <MenuItem value="SHIPPED">Shipped</MenuItem>
                  <MenuItem value="INSTALLED">Installed</MenuItem>
                  <MenuItem value="REGISTERED">Registered</MenuItem>
                  <MenuItem value="OBSOLETE">Obsolete</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Assets Table */}
        {loading ? (
          <TableSkeleton rows={5} columns={9} />
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
                {assets.map((asset) => (
                  <TableRow
                    key={asset.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedAsset(asset);
                      setDetailOpen(true);
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {asset.name}
                      </Typography>
                      {asset._count.children > 0 && (
                        <Typography variant="caption" color="textSecondary">
                          {asset._count.children} child assets
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{asset.serialNumber || '-'}</TableCell>
                    <TableCell>{asset.account?.name || '-'}</TableCell>
                    <TableCell>
                      {asset.product ? (
                        <>
                          {asset.product.name}
                          <br />
                          <Typography variant="caption" color="textSecondary">
                            {asset.product.productCode}
                          </Typography>
                        </>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{asset.quantity}</TableCell>
                    <TableCell>{formatCurrency((asset.price || 0) * asset.quantity)}</TableCell>
                    <TableCell>
                      {asset.warrantyEndDate ? (
                        <Box>
                          {new Date(asset.warrantyEndDate).toLocaleDateString()}
                          {isWarrantyExpiringSoon(asset.warrantyEndDate) && (
                            <Chip
                              label="Expiring Soon"
                              color="warning"
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={asset.status}
                        color={getStatusColor(asset.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteAsset(asset.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {assets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No assets found
                    </TableCell>
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

      {/* Create Asset Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Asset</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Account</InputLabel>
                <Select
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  label="Account"
                >
                  {accounts.map((account: any) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Product</InputLabel>
                <Select
                  value={formData.productId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  label="Product"
                >
                  {products.map((product: any) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Asset Name"
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
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="PURCHASED">Purchased</MenuItem>
                  <MenuItem value="SHIPPED">Shipped</MenuItem>
                  <MenuItem value="INSTALLED">Installed</MenuItem>
                  <MenuItem value="REGISTERED">Registered</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Purchase Date"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
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
                label="Warranty Start Date"
                type="date"
                value={formData.warrantyStartDate}
                onChange={(e) => setFormData({ ...formData, warrantyStartDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Warranty End Date"
                type="date"
                value={formData.warrantyEndDate}
                onChange={(e) => setFormData({ ...formData, warrantyEndDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateAsset}
            variant="contained"
            disabled={!formData.name || !formData.accountId}
          >
            Create Asset
          </Button>
        </DialogActions>
      </Dialog>

      {/* Asset Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => { setDetailOpen(false); setEditMode(false); }} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">{selectedAsset?.name}</Typography>
              <Typography variant="body2" color="textSecondary">
                {selectedAsset?.serialNumber || 'No Serial Number'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {!editMode && (
                <Tooltip title="Edit">
                  <IconButton onClick={handleStartEdit}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              )}
              <IconButton onClick={() => { setDetailOpen(false); setEditMode(false); }}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedAsset && editMode ? (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Asset Name"
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
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    label="Status"
                  >
                    <MenuItem value="PURCHASED">Purchased</MenuItem>
                    <MenuItem value="SHIPPED">Shipped</MenuItem>
                    <MenuItem value="INSTALLED">Installed</MenuItem>
                    <MenuItem value="REGISTERED">Registered</MenuItem>
                    <MenuItem value="OBSOLETE">Obsolete</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={editFormData.quantity}
                  onChange={(e) => setEditFormData({ ...editFormData, quantity: parseInt(e.target.value) || 1 })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={editFormData.price}
                  onChange={(e) => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) || 0 })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          ) : selectedAsset ? (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={selectedAsset.status}
                    color={getStatusColor(selectedAsset.status) as any}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Quantity</Typography>
                <Typography variant="body1">{selectedAsset.quantity}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Value</Typography>
                <Typography variant="body1">
                  {formatCurrency((selectedAsset.price || 0) * selectedAsset.quantity)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Account</Typography>
                <Typography variant="body1">{selectedAsset.account?.name || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Contact</Typography>
                <Typography variant="body1">
                  {selectedAsset.contact
                    ? `${selectedAsset.contact.firstName} ${selectedAsset.contact.lastName}`
                    : '-'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Product</Typography>
                <Typography variant="body1">
                  {selectedAsset.product ? (
                    <>
                      {selectedAsset.product.name}
                      <Typography variant="caption" color="textSecondary" display="block">
                        {selectedAsset.product.productCode}
                      </Typography>
                    </>
                  ) : (
                    '-'
                  )}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Parent Asset</Typography>
                <Typography variant="body1">{selectedAsset.parent?.name || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Purchase Date</Typography>
                <Typography variant="body1">
                  {selectedAsset.purchaseDate
                    ? new Date(selectedAsset.purchaseDate).toLocaleDateString()
                    : '-'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Install Date</Typography>
                <Typography variant="body1">
                  {selectedAsset.installDate
                    ? new Date(selectedAsset.installDate).toLocaleDateString()
                    : '-'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Warranty End Date</Typography>
                <Typography variant="body1">
                  {selectedAsset.warrantyEndDate
                    ? new Date(selectedAsset.warrantyEndDate).toLocaleDateString()
                    : '-'}
                  {selectedAsset.warrantyEndDate && isWarrantyExpiringSoon(selectedAsset.warrantyEndDate) && (
                    <Chip label="Expiring Soon" color="warning" size="small" sx={{ ml: 1 }} />
                  )}
                </Typography>
              </Grid>
              {selectedAsset.description && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="textSecondary">Description</Typography>
                  <Typography variant="body1" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                    {selectedAsset.description}
                  </Typography>
                </Grid>
              )}
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Chip label={`${selectedAsset._count.cases} Cases`} variant="outlined" />
                  <Chip label={`${selectedAsset._count.entitlements} Entitlements`} variant="outlined" />
                  <Chip label={`${selectedAsset._count.children} Child Assets`} variant="outlined" />
                </Box>
              </Grid>
            </Grid>
          ) : null}
        </DialogContent>
        <DialogActions>
          {editMode ? (
            <>
              <Button onClick={() => setEditMode(false)}>Cancel</Button>
              <Button
                onClick={handleSaveEdit}
                variant="contained"
                disabled={!editFormData.name}
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
