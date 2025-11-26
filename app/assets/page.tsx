'use client';

import { useState, useEffect } from 'react';
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
  TableHead,
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
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import InventoryIcon from '@mui/icons-material/Inventory';
import BuildIcon from '@mui/icons-material/Build';
import WarningIcon from '@mui/icons-material/Warning';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DashboardLayout from '@/components/DashboardLayout';

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

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState({
    totalAssets: 0,
    installedAssets: 0,
    purchasedAssets: 0,
    warrantyExpiringSoon: 0,
    totalValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
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

  useEffect(() => {
    fetchAssets();
    fetchAccounts();
    fetchProducts();
  }, [search, statusFilter]);

  const fetchAssets = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(`/api/assets?${params}`);
      const data = await response.json();
      setAssets(data.assets || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/clients');
      const data = await response.json();
      setAccounts(data.clients || data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data.products || data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
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
        fetchAssets();
        resetForm();
      }
    } catch (error) {
      console.error('Error creating asset:', error);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      await fetch(`/api/assets?id=${assetId}`, { method: 'DELETE' });
      fetchAssets();
    } catch (error) {
      console.error('Error deleting asset:', error);
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

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Assets</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            New Asset
          </Button>
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
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Asset Name</TableCell>
                <TableCell>Serial Number</TableCell>
                <TableCell>Account</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Warranty</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
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
                  <TableCell>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAsset(asset.id);
                        }}
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
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">{selectedAsset?.name}</Typography>
              <Typography variant="body2" color="textSecondary">
                {selectedAsset?.serialNumber || 'No Serial Number'}
              </Typography>
            </Box>
            <IconButton onClick={() => setDetailOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedAsset && (
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
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
