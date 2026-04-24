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
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaidIcon from '@mui/icons-material/Paid';
import PendingIcon from '@mui/icons-material/Pending';
import WarningIcon from '@mui/icons-material/Warning';
import SendIcon from '@mui/icons-material/Send';
import PaymentIcon from '@mui/icons-material/Payment';
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

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  amountPaid: number;
  account: { id: string; name: string } | null;
  contact: { id: string; firstName: string; lastName: string; email: string } | null;
  lineItems: any[];
  payments: any[];
}

const tableColumns: Column[] = [
  { id: 'invoiceNumber', label: 'Invoice #' },
  { id: 'account', label: 'Account', sortable: false },
  { id: 'invoiceDate', label: 'Date' },
  { id: 'dueDate', label: 'Due Date' },
  { id: 'totalAmount', label: 'Total' },
  { id: 'amountPaid', label: 'Paid' },
  { id: 'status', label: 'Status' },
  { id: 'actions', label: 'Actions', sortable: false },
];

export default function InvoicesPage() {
  const [stats, setStats] = useState({
    totalInvoices: 0,
    draftInvoices: 0,
    sentInvoices: 0,
    paidInvoices: 0,
    overdueInvoices: 0,
    totalAmount: 0,
    totalPaid: 0,
    totalOutstanding: 0,
  });
  const [tabValue, setTabValue] = useState(0);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    dueDate: '',
    description: '',
    taxRate: 0,
  });
  const [editSaving, setEditSaving] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    accountId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: '',
    taxRate: 0,
    lineItems: [{ productId: '', description: '', quantity: 1, unitPrice: 0 }],
  });
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMethod: 'CREDIT_CARD',
    referenceNumber: '',
    notes: '',
  });

  const [sortBy, setSortByLocal] = useState('createdAt');
  const [sortOrder, setSortOrderLocal] = useState<'asc' | 'desc'>('desc');

  const { data: invoices, loading, error, pagination, setPage, setPageSize, setSort, refresh } = usePagination<Invoice>({
    url: '/api/invoices',
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
      const response = await fetch('/api/invoices');
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

  const handleCreateInvoice = async () => {
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setDialogOpen(false);
        refresh();
        fetchStats();
        resetForm();
        toast.showSuccess('Invoice created successfully');
      } else {
        toast.showError('Failed to create invoice');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.showError('Error creating invoice');
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      await fetch('/api/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: invoiceId, status: 'SENT' }),
      });
      refresh();
      fetchStats();
      toast.showSuccess('Invoice sent successfully');
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.showError('Error sending invoice');
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedInvoice) return;

    try {
      await fetch('/api/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedInvoice.id,
          payment: paymentData,
        }),
      });
      setPaymentDialogOpen(false);
      setSelectedInvoice(null);
      setPaymentData({ amount: 0, paymentMethod: 'CREDIT_CARD', referenceNumber: '', notes: '' });
      refresh();
      fetchStats();
      toast.showSuccess('Payment recorded successfully');
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.showError('Error recording payment');
    }
  };

  const handleStartEdit = () => {
    if (!selectedInvoice) return;
    setEditFormData({
      dueDate: selectedInvoice.dueDate ? selectedInvoice.dueDate.split('T')[0] : '',
      description: (selectedInvoice as any).description || '',
      taxRate: (selectedInvoice as any).taxRate || 0,
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedInvoice) return;
    setEditSaving(true);
    try {
      const response = await fetch('/api/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedInvoice.id, ...editFormData }),
      });
      if (response.ok) {
        refresh();
        fetchStats();
        setEditMode(false);
        setDetailOpen(false);
        setSelectedInvoice(null);
        toast.showSuccess('Invoice updated successfully');
      } else {
        toast.showError('Failed to update invoice');
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.showError('Error updating invoice');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    const confirmed = await confirm({
      title: 'Delete Invoice',
      message: 'Are you sure you want to delete this invoice? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      await fetch(`/api/invoices?id=${invoiceId}`, { method: 'DELETE' });
      refresh();
      fetchStats();
      setDetailOpen(false);
      toast.showSuccess('Invoice deleted successfully');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.showError('Error deleting invoice');
    }
  };

  const resetForm = () => {
    setFormData({
      accountId: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: '',
      taxRate: 0,
      lineItems: [{ productId: '', description: '', quantity: 1, unitPrice: 0 }],
    });
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, { productId: '', description: '', quantity: 1, unitPrice: 0 }],
    });
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const newLineItems = [...formData.lineItems];
    newLineItems[index] = { ...newLineItems[index], [field]: value };

    if (field === 'productId') {
      const product = products.find((p) => p.id === value);
      if (product) {
        newLineItems[index].unitPrice = product.price || 0;
        newLineItems[index].description = product.name;
      }
    }

    setFormData({ ...formData, lineItems: newLineItems });
  };

  const removeLineItem = (index: number) => {
    const newLineItems = formData.lineItems.filter((_, i) => i !== index);
    setFormData({ ...formData, lineItems: newLineItems });
  };

  const calculateSubtotal = () => {
    return formData.lineItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * (formData.taxRate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'default';
      case 'SENT':
        return 'info';
      case 'PAID':
        return 'success';
      case 'PARTIALLY_PAID':
        return 'warning';
      case 'OVERDUE':
        return 'error';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const filteredInvoices = invoices.filter((i) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = !search ||
      i.invoiceNumber.toLowerCase().includes(searchLower) ||
      i.account?.name.toLowerCase().includes(searchLower);

    let matchesTab = true;
    if (tabValue === 1) matchesTab = i.status === 'DRAFT';
    else if (tabValue === 2) matchesTab = i.status === 'SENT';
    else if (tabValue === 3) matchesTab = i.status === 'PAID';
    else if (tabValue === 4) matchesTab = i.status === 'OVERDUE';

    return matchesSearch && matchesTab;
  });

  const exportData = filteredInvoices.map((i) => ({
    'Invoice #': i.invoiceNumber,
    Account: i.account?.name || '-',
    Date: new Date(i.invoiceDate).toLocaleDateString(),
    'Due Date': new Date(i.dueDate).toLocaleDateString(),
    Total: formatCurrency(i.totalAmount || 0),
    Paid: formatCurrency(i.amountPaid || 0),
    Status: i.status,
  }));

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Invoices</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ExportToolbar data={exportData} filename="invoices" title="Invoices Export" />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              New Invoice
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ReceiptIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Total Invoiced</Typography>
                </Box>
                <Typography variant="h4">{formatCurrency(stats.totalAmount)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PaidIcon color="success" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Total Paid</Typography>
                </Box>
                <Typography variant="h4">{formatCurrency(stats.totalPaid)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PendingIcon color="warning" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Outstanding</Typography>
                </Box>
                <Typography variant="h4">{formatCurrency(stats.totalOutstanding)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <WarningIcon color="error" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Overdue</Typography>
                </Box>
                <Typography variant="h4">{stats.overdueInvoices}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Tabs */}
        <Paper sx={{ mb: 2, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ width: 300 }}
            />
          </Box>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={`All (${stats.totalInvoices})`} />
            <Tab label={`Draft (${stats.draftInvoices})`} />
            <Tab label={`Sent (${stats.sentInvoices})`} />
            <Tab label={`Paid (${stats.paidInvoices})`} />
            <Tab label={`Overdue (${stats.overdueInvoices})`} />
          </Tabs>
        </Paper>

        {/* Invoices Table */}
        {loading ? (
          <TableSkeleton rows={8} columns={8} />
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
                {filteredInvoices.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedInvoice(invoice);
                      setEditMode(false);
                      setDetailOpen(true);
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {invoice.invoiceNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>{invoice.account?.name || '-'}</TableCell>
                    <TableCell>
                      {new Date(invoice.invoiceDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{formatCurrency(invoice.totalAmount || 0)}</TableCell>
                    <TableCell>{formatCurrency(invoice.amountPaid || 0)}</TableCell>
                    <TableCell>
                      <Chip
                        label={invoice.status}
                        color={getStatusColor(invoice.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {invoice.status === 'DRAFT' && (
                        <Tooltip title="Send">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendInvoice(invoice.id);
                            }}
                          >
                            <SendIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {['SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status) && (
                        <Tooltip title="Record Payment">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInvoice(invoice);
                              setPaymentData({
                                ...paymentData,
                                amount: (invoice.totalAmount || 0) - (invoice.amountPaid || 0),
                              });
                              setPaymentDialogOpen(true);
                            }}
                          >
                            <PaymentIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {invoice.status === 'DRAFT' && (
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteInvoice(invoice.id);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredInvoices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No invoices found
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

      {/* Create Invoice Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Invoice</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 4 }}>
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
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Invoice Date"
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Due Date"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Tax Rate (%)"
                type="number"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Line Items
          </Typography>

          {formData.lineItems.map((item, index) => (
            <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Product</InputLabel>
                  <Select
                    value={item.productId}
                    onChange={(e) => updateLineItem(index, 'productId', e.target.value)}
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
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Description"
                  value={item.description}
                  onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Qty"
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Price"
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 1 }}>
                <IconButton color="error" onClick={() => removeLineItem(index)}>
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
          ))}

          <Button startIcon={<AddIcon />} onClick={addLineItem}>
            Add Line Item
          </Button>

          <Box sx={{ mt: 3, textAlign: 'right' }}>
            <Typography>Subtotal: {formatCurrency(calculateSubtotal())}</Typography>
            <Typography>Tax ({formData.taxRate}%): {formatCurrency(calculateTax())}</Typography>
            <Typography variant="h6">Total: {formatCurrency(calculateTotal())}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateInvoice}
            variant="contained"
            disabled={!formData.accountId || formData.lineItems.every((i) => !i.productId)}
          >
            Create Invoice
          </Button>
        </DialogActions>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Invoice: {selectedInvoice.invoiceNumber}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Outstanding: {formatCurrency((selectedInvoice.totalAmount || 0) - (selectedInvoice.amountPaid || 0))}
              </Typography>
            </Box>
          )}
          <TextField
            fullWidth
            label="Payment Amount"
            type="number"
            value={paymentData.amount}
            onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Payment Method</InputLabel>
            <Select
              value={paymentData.paymentMethod}
              onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
              label="Payment Method"
            >
              <MenuItem value="CREDIT_CARD">Credit Card</MenuItem>
              <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
              <MenuItem value="CHECK">Check</MenuItem>
              <MenuItem value="CASH">Cash</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Reference Number"
            value={paymentData.referenceNumber}
            onChange={(e) => setPaymentData({ ...paymentData, referenceNumber: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Notes"
            value={paymentData.notes}
            onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRecordPayment}
            variant="contained"
            disabled={!paymentData.amount}
          >
            Record Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invoice Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">{selectedInvoice?.invoiceNumber}</Typography>
              <Typography variant="body2" color="textSecondary">
                {selectedInvoice?.account?.name || 'No Account'}
              </Typography>
            </Box>
            <IconButton onClick={() => setDetailOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedInvoice && !editMode && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={selectedInvoice.status}
                    color={getStatusColor(selectedInvoice.status) as any}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Invoice Date</Typography>
                <Typography variant="body1">
                  {new Date(selectedInvoice.invoiceDate).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Due Date</Typography>
                <Typography variant="body1">
                  {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Total Amount</Typography>
                <Typography variant="h6">{formatCurrency(selectedInvoice.totalAmount || 0)}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Amount Paid</Typography>
                <Typography variant="h6" color="success.main">
                  {formatCurrency(selectedInvoice.amountPaid || 0)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Balance Due</Typography>
                <Typography variant="h6" color="error.main">
                  {formatCurrency((selectedInvoice.totalAmount || 0) - (selectedInvoice.amountPaid || 0))}
                </Typography>
              </Grid>
              {selectedInvoice.contact && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="textSecondary">Contact</Typography>
                  <Typography variant="body1">
                    {selectedInvoice.contact.firstName} {selectedInvoice.contact.lastName} ({selectedInvoice.contact.email})
                  </Typography>
                </Grid>
              )}
              {selectedInvoice.lineItems && selectedInvoice.lineItems.length > 0 && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="textSecondary">Line Items</Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Description</TableCell>
                          <TableCell align="right">Qty</TableCell>
                          <TableCell align="right">Unit Price</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedInvoice.lineItems.map((item: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>{item.description}</TableCell>
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
              {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="textSecondary">Payment History</Typography>
                  <Box sx={{ mt: 1 }}>
                    {selectedInvoice.payments.map((payment: any, idx: number) => (
                      <Paper key={idx} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="body2">
                              {formatCurrency(payment.amount)} - {payment.paymentMethod}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {new Date(payment.paymentDate).toLocaleDateString()}
                            </Typography>
                          </Box>
                          {payment.referenceNumber && (
                            <Chip label={payment.referenceNumber} size="small" variant="outlined" />
                          )}
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
          {selectedInvoice && editMode && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Due Date"
                  type="date"
                  value={editFormData.dueDate}
                  onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Tax Rate (%)"
                  type="number"
                  value={editFormData.taxRate}
                  onChange={(e) => setEditFormData({ ...editFormData, taxRate: parseFloat(e.target.value) || 0 })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          {!editMode && (
            <>
              {selectedInvoice && selectedInvoice.status === 'DRAFT' && (
                <Button
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDeleteInvoice(selectedInvoice.id)}
                >
                  Delete
                </Button>
              )}
              {selectedInvoice && ['SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(selectedInvoice.status) && (
                <Button
                  color="success"
                  variant="contained"
                  onClick={() => {
                    setPaymentData({
                      ...paymentData,
                      amount: (selectedInvoice.totalAmount || 0) - (selectedInvoice.amountPaid || 0),
                    });
                    setDetailOpen(false);
                    setPaymentDialogOpen(true);
                  }}
                >
                  Record Payment
                </Button>
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
