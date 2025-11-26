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
import DashboardLayout from '@/components/DashboardLayout';

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

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState({
    totalContracts: 0,
    draftContracts: 0,
    activeContracts: 0,
    expiredContracts: 0,
    totalValue: 0,
    expiringThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
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

  useEffect(() => {
    fetchContracts();
    fetchAccounts();
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await fetch('/api/contracts');
      const data = await response.json();
      setContracts(data.contracts || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching contracts:', error);
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

  const handleCreateContract = async () => {
    try {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setDialogOpen(false);
        fetchContracts();
        resetForm();
      }
    } catch (error) {
      console.error('Error creating contract:', error);
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
      fetchContracts();
    } catch (error) {
      console.error('Error activating contract:', error);
    }
  };

  const handleDeleteContract = async (contractId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('Are you sure you want to delete this contract?')) return;

    try {
      await fetch(`/api/contracts?id=${contractId}`, { method: 'DELETE' });
      fetchContracts();
      if (selectedContract?.id === contractId) {
        setDetailDialogOpen(false);
        setSelectedContract(null);
      }
    } catch (error) {
      console.error('Error deleting contract:', error);
    }
  };

  const handleRowClick = (contract: Contract) => {
    setSelectedContract(contract);
    setDetailDialogOpen(true);
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

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Contracts</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            New Contract
          </Button>
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
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Contract</TableCell>
                <TableCell>Account</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Term</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
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
        </TableContainer>
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
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
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
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
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
