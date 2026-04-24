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
  Divider,
  Tab,
  Tabs,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  orderDate: string;
  effectiveDate: string | null;
  totalAmount: number;
  description: string | null;
  account: { id: string; name: string } | null;
  contract: { id: string; contractNumber: string } | null;
  lineItems: any[];
  _count: { lineItems: number };
}

const tableColumns: Column[] = [
  { id: 'orderNumber', label: 'Order Number' },
  { id: 'account', label: 'Account', sortable: false },
  { id: 'orderDate', label: 'Order Date' },
  { id: 'lineItems', label: 'Items', sortable: false },
  { id: 'totalAmount', label: 'Total' },
  { id: 'status', label: 'Status' },
  { id: 'actions', label: 'Actions', sortable: false },
];

export default function OrdersPage() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    draftOrders: 0,
    activatedOrders: 0,
    totalValue: 0,
  });
  const [tabValue, setTabValue] = useState(0);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    description: '',
    effectiveDate: '',
  });
  const [editSaving, setEditSaving] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    accountId: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    status: 'DRAFT',
    description: '',
    lineItems: [{ productId: '', quantity: 1, unitPrice: 0 }],
  });

  const [sortBy, setSortByLocal] = useState('createdAt');
  const [sortOrder, setSortOrderLocal] = useState<'asc' | 'desc'>('desc');

  const { data: orders, loading, error, pagination, setPage, setPageSize, setSort, refresh } = usePagination<Order>({
    url: '/api/orders',
    defaultSortBy: 'createdAt',
  });

  const toast = useToast();
  const { confirm } = useConfirmDialog();

  const handleSort = (col: string) => {
    const newOrder = sortBy === col && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortByLocal(col);
    setSortOrderLocal(newOrder);
    setSort(col, newOrder);
  };

  useEffect(() => {
    fetchStats();
    fetchAccounts();
    fetchProducts();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/orders');
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

  const handleCreateOrder = async () => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setDialogOpen(false);
        refresh();
        fetchStats();
        resetForm();
        toast.showSuccess('Order created successfully');
      } else {
        toast.showError('Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.showError('Error creating order');
    }
  };

  const handleActivateOrder = async (orderId: string) => {
    try {
      await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: 'ACTIVATED' }),
      });
      refresh();
      fetchStats();
      toast.showSuccess('Order activated successfully');
    } catch (error) {
      console.error('Error activating order:', error);
      toast.showError('Error activating order');
    }
  };

  const handleStartEdit = () => {
    if (!selectedOrder) return;
    setEditFormData({
      description: selectedOrder.description || '',
      effectiveDate: selectedOrder.effectiveDate ? selectedOrder.effectiveDate.split('T')[0] : '',
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedOrder) return;
    setEditSaving(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedOrder.id, ...editFormData }),
      });
      if (response.ok) {
        refresh();
        fetchStats();
        setEditMode(false);
        setDetailOpen(false);
        setSelectedOrder(null);
        toast.showSuccess('Order updated successfully');
      } else {
        toast.showError('Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.showError('Error updating order');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    const confirmed = await confirm({
      title: 'Delete Order',
      message: 'Are you sure you want to delete this order? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      await fetch(`/api/orders?id=${orderId}`, { method: 'DELETE' });
      refresh();
      fetchStats();
      setDetailOpen(false);
      toast.showSuccess('Order deleted successfully');
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.showError('Error deleting order');
    }
  };

  const resetForm = () => {
    setFormData({
      accountId: '',
      effectiveDate: new Date().toISOString().split('T')[0],
      status: 'DRAFT',
      description: '',
      lineItems: [{ productId: '', quantity: 1, unitPrice: 0 }],
    });
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, { productId: '', quantity: 1, unitPrice: 0 }],
    });
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const newLineItems = [...formData.lineItems];
    newLineItems[index] = { ...newLineItems[index], [field]: value };

    if (field === 'productId') {
      const product = products.find((p) => p.id === value);
      if (product) {
        newLineItems[index].unitPrice = product.price || 0;
      }
    }

    setFormData({ ...formData, lineItems: newLineItems });
  };

  const removeLineItem = (index: number) => {
    const newLineItems = formData.lineItems.filter((_, i) => i !== index);
    setFormData({ ...formData, lineItems: newLineItems });
  };

  const calculateTotal = () => {
    return formData.lineItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'default';
      case 'ACTIVATED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const filteredOrders = orders.filter((order) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = !search ||
      order.orderNumber.toLowerCase().includes(searchLower) ||
      order.account?.name.toLowerCase().includes(searchLower) ||
      order.description?.toLowerCase().includes(searchLower);

    let matchesTab = true;
    if (tabValue === 1) matchesTab = order.status === 'DRAFT';
    else if (tabValue === 2) matchesTab = order.status === 'ACTIVATED';
    else if (tabValue === 3) matchesTab = order.status === 'CANCELLED';

    return matchesSearch && matchesTab;
  });

  const exportData = filteredOrders.map((o) => ({
    'Order Number': o.orderNumber,
    Account: o.account?.name || '-',
    'Order Date': o.orderDate ? new Date(o.orderDate).toLocaleDateString() : '-',
    Items: o._count?.lineItems || 0,
    Total: formatCurrency(o.totalAmount || 0),
    Status: o.status,
  }));

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Orders</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ExportToolbar data={exportData} filename="orders" title="Orders Export" />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              New Order
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ShoppingCartIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Total Orders</Typography>
                </Box>
                <Typography variant="h4">{stats.totalOrders}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PendingIcon color="warning" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Draft Orders</Typography>
                </Box>
                <Typography variant="h4">{stats.draftOrders}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Activated</Typography>
                </Box>
                <Typography variant="h4">{stats.activatedOrders}</Typography>
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

        {/* Search and Tabs */}
        <Paper sx={{ mb: 2, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ width: 300 }}
            />
          </Box>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={`All (${stats.totalOrders})`} />
            <Tab label={`Draft (${stats.draftOrders})`} />
            <Tab label={`Activated (${stats.activatedOrders})`} />
          </Tabs>
        </Paper>

        {/* Orders Table */}
        {loading ? (
          <TableSkeleton rows={8} columns={7} />
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <SortableTableHead
                columns={tableColumns}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedOrder(order);
                      setEditMode(false);
                      setDetailOpen(true);
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {order.orderNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>{order.account?.name || '-'}</TableCell>
                    <TableCell>
                      {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>{order._count?.lineItems || 0} items</TableCell>
                    <TableCell>{formatCurrency(order.totalAmount || 0)}</TableCell>
                    <TableCell>
                      <Chip
                        label={order.status}
                        color={getStatusColor(order.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {order.status === 'DRAFT' && (
                        <>
                          <Tooltip title="Activate">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActivateOrder(order.id);
                              }}
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteOrder(order.id);
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No orders found
                    </TableCell>
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

      {/* Create Order Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Order</DialogTitle>
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
              <TextField
                fullWidth
                label="Effective Date"
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
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

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Line Items
          </Typography>

          {formData.lineItems.map((item, index) => (
            <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, md: 5 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Product</InputLabel>
                  <Select
                    value={item.productId}
                    onChange={(e) => updateLineItem(index, 'productId', e.target.value)}
                    label="Product"
                  >
                    {products.map((product: any) => (
                      <MenuItem key={product.id} value={product.id}>
                        {product.name} - {formatCurrency(product.price || 0)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Quantity"
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Unit Price"
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <IconButton color="error" onClick={() => removeLineItem(index)}>
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
          ))}

          <Button startIcon={<AddIcon />} onClick={addLineItem}>
            Add Line Item
          </Button>

          <Box sx={{ mt: 2, textAlign: 'right' }}>
            <Typography variant="h6">
              Total: {formatCurrency(calculateTotal())}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateOrder}
            variant="contained"
            disabled={!formData.accountId || formData.lineItems.every((i) => !i.productId)}
          >
            Create Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Order Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">{selectedOrder?.orderNumber}</Typography>
              <Typography variant="body2" color="textSecondary">
                {selectedOrder?.account?.name || 'No Account'}
              </Typography>
            </Box>
            <IconButton onClick={() => setDetailOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedOrder && !editMode && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={selectedOrder.status}
                    color={getStatusColor(selectedOrder.status) as any}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Order Date</Typography>
                <Typography variant="body1">
                  {selectedOrder.orderDate
                    ? new Date(selectedOrder.orderDate).toLocaleDateString()
                    : '-'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Effective Date</Typography>
                <Typography variant="body1">
                  {selectedOrder.effectiveDate
                    ? new Date(selectedOrder.effectiveDate).toLocaleDateString()
                    : '-'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Total Amount</Typography>
                <Typography variant="h6">{formatCurrency(selectedOrder.totalAmount || 0)}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Contract</Typography>
                <Typography variant="body1">
                  {selectedOrder.contract?.contractNumber || 'No Contract'}
                </Typography>
              </Grid>
              {selectedOrder.description && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="textSecondary">Description</Typography>
                  <Typography variant="body1" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                    {selectedOrder.description}
                  </Typography>
                </Grid>
              )}
              {selectedOrder.lineItems && selectedOrder.lineItems.length > 0 && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="textSecondary">Line Items</Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell align="right">Qty</TableCell>
                          <TableCell align="right">Unit Price</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrder.lineItems.map((item: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>{item.productName || item.description || '-'}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell align="right">{formatCurrency(item.totalPrice)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}
            </Grid>
          )}
          {selectedOrder && editMode && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Effective Date"
                  type="date"
                  value={editFormData.effectiveDate}
                  onChange={(e) => setEditFormData({ ...editFormData, effectiveDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
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
          )}
        </DialogContent>
        <DialogActions>
          {!editMode && (
            <>
              {selectedOrder && selectedOrder.status === 'DRAFT' && (
                <>
                  <Button
                    color="success"
                    variant="contained"
                    onClick={() => {
                      handleActivateOrder(selectedOrder.id);
                      setDetailOpen(false);
                    }}
                  >
                    Activate Order
                  </Button>
                  <Button
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteOrder(selectedOrder.id)}
                  >
                    Delete
                  </Button>
                </>
              )}
              <Button
                startIcon={<EditIcon />}
                onClick={handleStartEdit}
              >
                Edit
              </Button>
              <Button onClick={() => setDetailOpen(false)}>Close</Button>
            </>
          )}
          {editMode && (
            <>
              <Button
                startIcon={<CancelIcon />}
                onClick={() => setEditMode(false)}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveEdit}
                disabled={editSaving}
              >
                {editSaving ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
