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
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SendIcon from '@mui/icons-material/Send';
import StarIcon from '@mui/icons-material/Star';
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

interface Quote {
  id: string;
  quoteNumber: string;
  name: string;
  status: string;
  expirationDate: string;
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  isPrimary: boolean;
  account: { id: string; name: string } | null;
  lineItems: any[];
  _count: { lineItems: number };
  createdAt: string;
}

const tableColumns: Column[] = [
  { id: 'name', label: 'Quote' },
  { id: 'account', label: 'Account', sortable: false },
  { id: 'lineItems', label: 'Items', sortable: false },
  { id: 'grandTotal', label: 'Total' },
  { id: 'expirationDate', label: 'Expires' },
  { id: 'status', label: 'Status' },
  { id: 'actions', label: 'Actions', sortable: false },
];

export default function QuotesPage() {
  const [stats, setStats] = useState({
    totalQuotes: 0,
    draftQuotes: 0,
    pendingQuotes: 0,
    approvedQuotes: 0,
    acceptedQuotes: 0,
    totalValue: 0,
  });
  const [tabValue, setTabValue] = useState(0);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    expirationDate: '',
    discount: 0,
    tax: 0,
  });
  const [editSaving, setEditSaving] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    accountId: '',
    name: '',
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: '',
    discount: 0,
    tax: 0,
    lineItems: [{ productId: '', productName: '', quantity: 1, unitPrice: 0 }],
  });

  const [sortBy, setSortByLocal] = useState('createdAt');
  const [sortOrder, setSortOrderLocal] = useState<'asc' | 'desc'>('desc');

  const { data: quotes, loading, error, pagination, setPage, setPageSize, setSort, refresh } = usePagination<Quote>({
    url: '/api/quotes',
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
      const response = await fetch('/api/quotes');
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

  const handleCreateQuote = async () => {
    try {
      const lineItemsWithTotals = formData.lineItems.map(item => ({
        ...item,
        listPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
      }));

      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          lineItems: lineItemsWithTotals,
        }),
      });

      if (response.ok) {
        setDialogOpen(false);
        refresh();
        fetchStats();
        resetForm();
        toast.showSuccess('Quote created successfully');
      } else {
        toast.showError('Failed to create quote');
      }
    } catch (error) {
      console.error('Error creating quote:', error);
      toast.showError('Error creating quote');
    }
  };

  const handleApproveQuote = async (quoteId: string) => {
    try {
      await fetch('/api/quotes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: quoteId, status: 'APPROVED' }),
      });
      refresh();
      fetchStats();
      toast.showSuccess('Quote approved successfully');
    } catch (error) {
      console.error('Error approving quote:', error);
      toast.showError('Error approving quote');
    }
  };

  const handleStartEdit = () => {
    if (!selectedQuote) return;
    setEditFormData({
      name: selectedQuote.name || '',
      expirationDate: selectedQuote.expirationDate ? selectedQuote.expirationDate.split('T')[0] : '',
      discount: selectedQuote.discount || 0,
      tax: selectedQuote.tax || 0,
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedQuote) return;
    setEditSaving(true);
    try {
      const response = await fetch(`/api/quotes/${selectedQuote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      if (response.ok) {
        refresh();
        fetchStats();
        setEditMode(false);
        setDetailOpen(false);
        setSelectedQuote(null);
        toast.showSuccess('Quote updated successfully');
      } else {
        toast.showError('Failed to update quote');
      }
    } catch (error) {
      console.error('Error updating quote:', error);
      toast.showError('Error updating quote');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    const confirmed = await confirm({
      title: 'Delete Quote',
      message: 'Are you sure you want to delete this quote? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      await fetch(`/api/quotes?id=${quoteId}`, { method: 'DELETE' });
      refresh();
      fetchStats();
      setDetailOpen(false);
      toast.showSuccess('Quote deleted successfully');
    } catch (error) {
      console.error('Error deleting quote:', error);
      toast.showError('Error deleting quote');
    }
  };

  const resetForm = () => {
    setFormData({
      accountId: '',
      name: '',
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: '',
      discount: 0,
      tax: 0,
      lineItems: [{ productId: '', productName: '', quantity: 1, unitPrice: 0 }],
    });
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, { productId: '', productName: '', quantity: 1, unitPrice: 0 }],
    });
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const newLineItems = [...formData.lineItems];
    newLineItems[index] = { ...newLineItems[index], [field]: value };

    if (field === 'productId') {
      const product = products.find((p) => p.id === value);
      if (product) {
        newLineItems[index].unitPrice = product.unitPrice || product.price || 0;
        newLineItems[index].productName = product.name;
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

  const calculateTotal = () => {
    return calculateSubtotal() - formData.discount + formData.tax;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'default';
      case 'NEEDS_REVIEW':
        return 'warning';
      case 'APPROVED':
        return 'info';
      case 'PRESENTED':
        return 'secondary';
      case 'ACCEPTED':
        return 'success';
      case 'REJECTED':
      case 'DENIED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  const isExpiringSoon = (expirationDate: string) => {
    const expDate = new Date(expirationDate);
    const now = new Date();
    const daysUntilExpiry = (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  const filteredQuotes = quotes.filter((q) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = !search ||
      q.name.toLowerCase().includes(searchLower) ||
      q.quoteNumber.toLowerCase().includes(searchLower) ||
      q.account?.name.toLowerCase().includes(searchLower);

    let matchesTab = true;
    if (tabValue === 1) matchesTab = q.status === 'DRAFT';
    else if (tabValue === 2) matchesTab = ['NEEDS_REVIEW', 'IN_REVIEW'].includes(q.status);
    else if (tabValue === 3) matchesTab = q.status === 'APPROVED';
    else if (tabValue === 4) matchesTab = q.status === 'ACCEPTED';

    return matchesSearch && matchesTab;
  });

  const exportData = filteredQuotes.map((q) => ({
    Name: q.name,
    'Quote Number': q.quoteNumber,
    Account: q.account?.name || '-',
    Items: q._count?.lineItems || 0,
    Total: formatCurrency(q.grandTotal),
    Expires: q.expirationDate ? new Date(q.expirationDate).toLocaleDateString() : '-',
    Status: q.status,
  }));

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Quotes</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ExportToolbar data={exportData} filename="quotes" title="Quotes Export" />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              New Quote
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <RequestQuoteIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Total Quotes</Typography>
                </Box>
                <Typography variant="h4">{stats.totalQuotes}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PendingIcon color="warning" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Pending Review</Typography>
                </Box>
                <Typography variant="h4">{stats.pendingQuotes}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ThumbUpIcon color="success" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Accepted</Typography>
                </Box>
                <Typography variant="h4">{stats.acceptedQuotes}</Typography>
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
              placeholder="Search quotes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ width: 300 }}
            />
          </Box>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={`All (${stats.totalQuotes})`} />
            <Tab label={`Draft (${stats.draftQuotes})`} />
            <Tab label={`Pending (${stats.pendingQuotes})`} />
            <Tab label={`Approved (${stats.approvedQuotes})`} />
            <Tab label={`Accepted (${stats.acceptedQuotes})`} />
          </Tabs>
        </Paper>

        {/* Quotes Table */}
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
                {filteredQuotes.map((quote) => (
                  <TableRow
                    key={quote.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedQuote(quote);
                      setEditMode(false);
                      setDetailOpen(true);
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {quote.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {quote.quoteNumber}
                          </Typography>
                        </Box>
                        {quote.isPrimary && (
                          <Tooltip title="Primary Quote">
                            <StarIcon color="primary" fontSize="small" />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{quote.account?.name || '-'}</TableCell>
                    <TableCell>{quote._count?.lineItems || 0} items</TableCell>
                    <TableCell>
                      <Typography fontWeight="medium">
                        {formatCurrency(quote.grandTotal)}
                      </Typography>
                      {quote.discount > 0 && (
                        <Typography variant="caption" color="success.main">
                          -{formatCurrency(quote.discount)} discount
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box>
                        {quote.expirationDate ? new Date(quote.expirationDate).toLocaleDateString() : '-'}
                        {isExpiringSoon(quote.expirationDate) && (
                          <Typography variant="caption" color="warning.main" display="block">
                            Expiring soon
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={quote.status.replace('_', ' ')}
                        color={getStatusColor(quote.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Download PDF">
                        <IconButton
                          size="small"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <PictureAsPdfIcon />
                        </IconButton>
                      </Tooltip>
                      {quote.status === 'DRAFT' && (
                        <>
                          <Tooltip title="Send for Review">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApproveQuote(quote.id);
                              }}
                            >
                              <SendIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteQuote(quote.id);
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {quote.status === 'NEEDS_REVIEW' && (
                        <Tooltip title="Approve">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApproveQuote(quote.id);
                            }}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredQuotes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No quotes found
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

      {/* Create Quote Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Quote</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Account *</InputLabel>
                <Select
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  label="Account *"
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
                label="Quote Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Expiration Date *"
                type="date"
                value={formData.expirationDate}
                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
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
                        {product.name} - {formatCurrency(product.unitPrice || product.price || 0)}
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
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography>,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                  <Typography sx={{ mr: 1 }}>{formatCurrency(item.quantity * item.unitPrice)}</Typography>
                  <IconButton color="error" size="small" onClick={() => removeLineItem(index)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Grid>
            </Grid>
          ))}

          <Button startIcon={<AddIcon />} onClick={addLineItem} sx={{ mb: 2 }}>
            Add Line Item
          </Button>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Discount"
                type="number"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography>,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Tax"
                type="number"
                value={formData.tax}
                onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography>,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ textAlign: 'right', pt: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  Subtotal: {formatCurrency(calculateSubtotal())}
                </Typography>
                <Typography variant="h6">
                  Total: {formatCurrency(calculateTotal())}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateQuote}
            variant="contained"
            disabled={!formData.accountId || !formData.name || formData.lineItems.every(i => !i.productId)}
          >
            Create Quote
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quote Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">{selectedQuote?.name}</Typography>
                {selectedQuote?.isPrimary && (
                  <Tooltip title="Primary Quote">
                    <StarIcon color="primary" />
                  </Tooltip>
                )}
              </Box>
              <Typography variant="body2" color="textSecondary">
                {selectedQuote?.quoteNumber}
              </Typography>
            </Box>
            <IconButton onClick={() => setDetailOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedQuote && !editMode && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={selectedQuote.status.replace('_', ' ')}
                    color={getStatusColor(selectedQuote.status) as any}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Account</Typography>
                <Typography variant="body1">{selectedQuote.account?.name || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Expiration Date</Typography>
                <Typography variant="body1">
                  {selectedQuote.expirationDate
                    ? new Date(selectedQuote.expirationDate).toLocaleDateString()
                    : '-'}
                  {isExpiringSoon(selectedQuote.expirationDate) && (
                    <Chip label="Expiring Soon" color="warning" size="small" sx={{ ml: 1 }} />
                  )}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Subtotal</Typography>
                <Typography variant="body1">{formatCurrency(selectedQuote.subtotal)}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Discount</Typography>
                <Typography variant="body1" color="success.main">
                  -{formatCurrency(selectedQuote.discount)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Tax</Typography>
                <Typography variant="body1">{formatCurrency(selectedQuote.tax)}</Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="textSecondary">Grand Total</Typography>
                <Typography variant="h5">{formatCurrency(selectedQuote.grandTotal)}</Typography>
              </Grid>
              {selectedQuote.lineItems && selectedQuote.lineItems.length > 0 && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="textSecondary">Line Items</Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell align="right">Qty</TableCell>
                          <TableCell align="right">List Price</TableCell>
                          <TableCell align="right">Unit Price</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedQuote.lineItems.map((item: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>{item.productName || item.product?.name || '-'}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">{formatCurrency(item.listPrice)}</TableCell>
                            <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell align="right">{formatCurrency(item.totalPrice)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Created</Typography>
                <Typography variant="body2">
                  {new Date(selectedQuote.createdAt).toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          )}
          {selectedQuote && editMode && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Quote Name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Expiration Date"
                  type="date"
                  value={editFormData.expirationDate}
                  onChange={(e) => setEditFormData({ ...editFormData, expirationDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Discount"
                  type="number"
                  value={editFormData.discount}
                  onChange={(e) => setEditFormData({ ...editFormData, discount: parseFloat(e.target.value) || 0 })}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography>,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Tax"
                  type="number"
                  value={editFormData.tax}
                  onChange={(e) => setEditFormData({ ...editFormData, tax: parseFloat(e.target.value) || 0 })}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography>,
                  }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          {!editMode && (
            <>
              {selectedQuote && selectedQuote.status === 'DRAFT' && (
                <>
                  <Button
                    color="info"
                    variant="contained"
                    onClick={() => {
                      handleApproveQuote(selectedQuote.id);
                      setDetailOpen(false);
                    }}
                  >
                    Send for Review
                  </Button>
                  <Button
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteQuote(selectedQuote.id)}
                  >
                    Delete
                  </Button>
                </>
              )}
              {selectedQuote && selectedQuote.status === 'NEEDS_REVIEW' && (
                <Button
                  color="success"
                  variant="contained"
                  onClick={() => {
                    handleApproveQuote(selectedQuote.id);
                    setDetailOpen(false);
                  }}
                >
                  Approve
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
