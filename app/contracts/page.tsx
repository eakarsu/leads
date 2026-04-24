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
  Tab,
  Tabs,
  FormControlLabel,
  Checkbox,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import WarningIcon from '@mui/icons-material/Warning';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CloseIcon from '@mui/icons-material/Close';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ScheduleIcon from '@mui/icons-material/Schedule';
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

interface Contract {
  id: string;
  contractNumber: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  contractTerm: number;
  totalValue: number;
  description: string | null;
  autoRenewal?: boolean;
  account: { id: string; name: string } | null;
  lineItems: any[];
  _count: { lineItems: number; renewals: number };
  createdAt?: string;
  updatedAt?: string;
}

const tableColumns: Column[] = [
  { id: 'name', label: 'Contract' },
  { id: 'account', label: 'Account', sortable: false },
  { id: 'startDate', label: 'Start Date' },
  { id: 'endDate', label: 'End Date' },
  { id: 'contractTerm', label: 'Term' },
  { id: 'totalValue', label: 'Value' },
  { id: 'status', label: 'Status' },
  { id: 'actions', label: 'Actions', sortable: false },
];

export default function ContractsPage() {
  const [stats, setStats] = useState({
    totalContracts: 0,
    draftContracts: 0,
    activeContracts: 0,
    expiredContracts: 0,
    totalValue: 0,
    expiringThisMonth: 0,
  });
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    contractTerm: 12,
    totalValue: 0,
    description: '',
    autoRenewal: false,
  });
  const [editSaving, setEditSaving] = useState(false);
  const [formData, setFormData] = useState({
    accountId: '',
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    contractTerm: 12,
    totalValue: 0,
    description: '',
    autoRenewal: false,
  });

  const [sortBy, setSortByLocal] = useState('createdAt');
  const [sortOrder, setSortOrderLocal] = useState<'asc' | 'desc'>('desc');

  const { data: contracts, loading, error, pagination, setPage, setPageSize, setSort, refresh } = usePagination<Contract>({
    url: '/api/contracts',
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
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/contracts');
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

  const handleCreateContract = async () => {
    try {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setDialogOpen(false);
        refresh();
        fetchStats();
        resetForm();
        toast.showSuccess('Contract created successfully');
      } else {
        toast.showError('Failed to create contract');
      }
    } catch (error) {
      console.error('Error creating contract:', error);
      toast.showError('Error creating contract');
    }
  };

  const handleActivateContract = async (contractId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await fetch('/api/contracts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: contractId, action: 'activate' }),
      });
      refresh();
      fetchStats();
      toast.showSuccess('Contract activated successfully');
    } catch (error) {
      console.error('Error activating contract:', error);
      toast.showError('Error activating contract');
    }
  };

  const handleDeleteContract = async (contractId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    const confirmed = await confirm({
      title: 'Delete Contract',
      message: 'Are you sure you want to delete this contract? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      await fetch(`/api/contracts?id=${contractId}`, { method: 'DELETE' });
      refresh();
      fetchStats();
      if (selectedContract?.id === contractId) {
        setDetailDialogOpen(false);
        setSelectedContract(null);
      }
      toast.showSuccess('Contract deleted successfully');
    } catch (error) {
      console.error('Error deleting contract:', error);
      toast.showError('Error deleting contract');
    }
  };

  const handleRowClick = (contract: Contract) => {
    setSelectedContract(contract);
    setEditMode(false);
    setDetailDialogOpen(true);
  };

  const handleStartEdit = () => {
    if (!selectedContract) return;
    setEditFormData({
      name: selectedContract.name || '',
      startDate: selectedContract.startDate ? selectedContract.startDate.split('T')[0] : '',
      endDate: selectedContract.endDate ? selectedContract.endDate.split('T')[0] : '',
      contractTerm: selectedContract.contractTerm || 12,
      totalValue: selectedContract.totalValue || 0,
      description: selectedContract.description || '',
      autoRenewal: selectedContract.autoRenewal || false,
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedContract) return;
    setEditSaving(true);
    try {
      const response = await fetch('/api/contracts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedContract.id, ...editFormData }),
      });
      if (response.ok) {
        refresh();
        fetchStats();
        setEditMode(false);
        setDetailDialogOpen(false);
        setSelectedContract(null);
        toast.showSuccess('Contract updated successfully');
      } else {
        toast.showError('Failed to update contract');
      }
    } catch (error) {
      console.error('Error updating contract:', error);
      toast.showError('Error updating contract');
    } finally {
      setEditSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      accountId: '',
      name: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      contractTerm: 12,
      totalValue: 0,
      description: '',
      autoRenewal: false,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'default';
      case 'IN_APPROVAL':
        return 'warning';
      case 'ACTIVATED':
        return 'success';
      case 'EXPIRED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredContracts = tabValue === 0
    ? contracts
    : contracts.filter((c) => {
        if (tabValue === 1) return c.status === 'DRAFT';
        if (tabValue === 2) return c.status === 'ACTIVATED';
        if (tabValue === 3) return c.status === 'EXPIRED';
        if (tabValue === 4) {
          const days = getDaysRemaining(c.endDate);
          return c.status === 'ACTIVATED' && days <= 30 && days > 0;
        }
        return true;
      });

  const exportData = filteredContracts.map((c) => ({
    'Contract Name': c.name,
    'Contract Number': c.contractNumber,
    Account: c.account?.name || '-',
    'Start Date': c.startDate ? formatDate(c.startDate) : '-',
    'End Date': c.endDate ? formatDate(c.endDate) : '-',
    Term: `${c.contractTerm} months`,
    Value: formatCurrency(c.totalValue || 0),
    Status: c.status,
  }));

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Contracts</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ExportToolbar data={exportData} filename="contracts" title="Contracts Export" />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              New Contract
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <DescriptionIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Total Contracts</Typography>
                </Box>
                <Typography variant="h4">{stats.totalContracts}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Active</Typography>
                </Box>
                <Typography variant="h4">{stats.activeContracts}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <WarningIcon color="warning" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Expiring Soon</Typography>
                </Box>
                <Typography variant="h4">{stats.expiringThisMonth}</Typography>
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

        {/* Tabs */}
        <Paper sx={{ mb: 2 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={`All (${stats.totalContracts})`} />
            <Tab label={`Draft (${stats.draftContracts})`} />
            <Tab label={`Active (${stats.activeContracts})`} />
            <Tab label={`Expired (${stats.expiredContracts})`} />
            <Tab label={`Expiring Soon (${stats.expiringThisMonth})`} />
          </Tabs>
        </Paper>

        {/* Contracts Table */}
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
                {filteredContracts.map((contract) => {
                  const daysRemaining = getDaysRemaining(contract.endDate);
                  return (
                    <TableRow
                      key={contract.id}
                      hover
                      onClick={() => handleRowClick(contract)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {contract.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {contract.contractNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>{contract.account?.name || '-'}</TableCell>
                      <TableCell>
                        {contract.startDate ? formatDate(contract.startDate) : '-'}
                      </TableCell>
                      <TableCell>
                        <Box>
                          {contract.endDate ? formatDate(contract.endDate) : '-'}
                          {contract.status === 'ACTIVATED' && daysRemaining <= 30 && daysRemaining > 0 && (
                            <Typography variant="caption" color="warning.main" display="block">
                              {daysRemaining} days left
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{contract.contractTerm} months</TableCell>
                      <TableCell>{formatCurrency(contract.totalValue || 0)}</TableCell>
                      <TableCell>
                        <Chip
                          label={contract.status}
                          color={getStatusColor(contract.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {contract.status === 'DRAFT' && (
                          <>
                            <Tooltip title="Activate">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={(e) => handleActivateContract(contract.id, e)}
                              >
                                <CheckCircleIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => handleDeleteContract(contract.id, e)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {contract.status === 'ACTIVATED' && (
                          <Tooltip title="Renew">
                            <IconButton size="small" color="primary" onClick={(e) => e.stopPropagation()}>
                              <AutorenewIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredContracts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No contracts found
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

      {/* Contract Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedContract && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <DescriptionIcon color="primary" />
                  <Box>
                    <Typography variant="h6">{selectedContract.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedContract.contractNumber}
                    </Typography>
                  </Box>
                </Box>
                <IconButton onClick={() => setDetailDialogOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              {selectedContract && !editMode && (
              <Grid container spacing={3}>
                {/* Status */}
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={selectedContract.status}
                      color={getStatusColor(selectedContract.status) as any}
                    />
                    {selectedContract.autoRenewal && (
                      <Chip icon={<AutorenewIcon />} label="Auto-Renewal" color="info" variant="outlined" />
                    )}
                    {selectedContract.status === 'ACTIVATED' && getDaysRemaining(selectedContract.endDate) <= 30 && getDaysRemaining(selectedContract.endDate) > 0 && (
                      <Chip icon={<WarningIcon />} label={`${getDaysRemaining(selectedContract.endDate)} days remaining`} color="warning" />
                    )}
                  </Box>
                </Grid>

                {/* Contract Details */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      <BusinessIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Account
                    </Typography>
                    <Typography variant="body1">
                      {selectedContract.account?.name || 'No account linked'}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      <AttachMoneyIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Total Value
                    </Typography>
                    <Typography variant="h5" color="primary">
                      {formatCurrency(selectedContract.totalValue || 0)}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      <CalendarTodayIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Start Date
                    </Typography>
                    <Typography variant="body1">
                      {selectedContract.startDate ? formatDate(selectedContract.startDate) : '-'}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      <CalendarTodayIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                      End Date
                    </Typography>
                    <Typography variant="body1">
                      {selectedContract.endDate ? formatDate(selectedContract.endDate) : '-'}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      <ScheduleIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Contract Term
                    </Typography>
                    <Typography variant="body1">
                      {selectedContract.contractTerm} months
                    </Typography>
                  </Paper>
                </Grid>

                {selectedContract.description && (
                  <Grid size={{ xs: 12 }}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Description
                      </Typography>
                      <Typography variant="body1">
                        {selectedContract.description}
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                {/* Additional Info */}
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Additional Information
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Contract ID</Typography>
                      <Typography variant="body2">{selectedContract.id}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Line Items</Typography>
                      <Typography variant="body2">{selectedContract._count?.lineItems || 0}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Renewals</Typography>
                      <Typography variant="body2">{selectedContract._count?.renewals || 0}</Typography>
                    </Box>
                    {selectedContract.createdAt && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">Created</Typography>
                        <Typography variant="body2">{formatDateTime(selectedContract.createdAt)}</Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Grid>
              )}
              {selectedContract && editMode && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Contract Name"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Start Date"
                      type="date"
                      value={editFormData.startDate}
                      onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="End Date"
                      type="date"
                      value={editFormData.endDate}
                      onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Contract Term (months)"
                      type="number"
                      value={editFormData.contractTerm}
                      onChange={(e) => setEditFormData({ ...editFormData, contractTerm: parseInt(e.target.value) || 0 })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Total Value"
                      type="number"
                      value={editFormData.totalValue}
                      onChange={(e) => setEditFormData({ ...editFormData, totalValue: parseFloat(e.target.value) || 0 })}
                      InputProps={{
                        startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={editFormData.autoRenewal}
                          onChange={(e) => setEditFormData({ ...editFormData, autoRenewal: e.target.checked })}
                        />
                      }
                      label="Auto-Renewal Enabled"
                      sx={{ mt: 1 }}
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
            <DialogActions sx={{ px: 3, py: 2 }}>
              {!editMode && (
                <>
                  {selectedContract.status === 'DRAFT' && (
                    <>
                      <Button
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={(e) => {
                          handleActivateContract(selectedContract.id, e);
                          setDetailDialogOpen(false);
                        }}
                      >
                        Activate
                      </Button>
                      <Button
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={(e) => handleDeleteContract(selectedContract.id, e)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                  {selectedContract.status === 'ACTIVATED' && (
                    <Button color="primary" startIcon={<AutorenewIcon />}>
                      Renew Contract
                    </Button>
                  )}
                  <Button
                    startIcon={<EditIcon />}
                    onClick={handleStartEdit}
                  >
                    Edit
                  </Button>
                  <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
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
          </>
        )}
      </Dialog>

      {/* Create Contract Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Contract</DialogTitle>
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
                label="Contract Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Start Date *"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="End Date *"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Contract Term (months)"
                type="number"
                value={formData.contractTerm}
                onChange={(e) => setFormData({ ...formData, contractTerm: parseInt(e.target.value) || 12 })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Total Value"
                type="number"
                value={formData.totalValue}
                onChange={(e) => setFormData({ ...formData, totalValue: parseFloat(e.target.value) || 0 })}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.autoRenewal}
                    onChange={(e) => setFormData({ ...formData, autoRenewal: e.target.checked })}
                  />
                }
                label="Auto-Renewal Enabled"
                sx={{ mt: 1 }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateContract}
            variant="contained"
            disabled={!formData.accountId || !formData.name}
          >
            Create Contract
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
