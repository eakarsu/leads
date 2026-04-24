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
  LinearProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import WarningIcon from '@mui/icons-material/Warning';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TimerIcon from '@mui/icons-material/Timer';
import SearchIcon from '@mui/icons-material/Search';
import DashboardLayout from '@/components/DashboardLayout';

interface ServiceContract {
  id: string;
  contractNumber: string;
  name: string;
  accountId: string;
  contactId: string | null;
  status: string;
  startDate: string;
  endDate: string;
  contractType: string;
  responseTimeHours: number | null;
  resolutionTimeHours: number | null;
  supportHours: string | null;
  contractValue: number;
  billingFrequency: string | null;
  autoRenew: boolean;
  renewalTermMonths: number | null;
  terms: string | null;
  specialConditions: string | null;
  account?: { id: string; name: string } | null;
  lineItems: any[];
  _count?: { lineItems: number };
  createdAt: string;
  updatedAt: string;
}

export default function ServiceContractsPage() {
  const [contracts, setContracts] = useState<ServiceContract[]>([]);
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
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ServiceContract | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    contractType: 'SUPPORT',
    startDate: '',
    endDate: '',
    responseTimeHours: 0,
    contractValue: 0,
  });
  const [editSaving, setEditSaving] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    accountId: '',
    name: '',
    contractType: 'SUPPORT',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    responseTimeHours: 4,
    resolutionTimeHours: 24,
    supportHours: '9-5 M-F',
    contractValue: 0,
    billingFrequency: 'MONTHLY',
    autoRenew: false,
    terms: '',
  });

  useEffect(() => {
    fetchContracts();
    fetchAccounts();
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await fetch('/api/service-contracts');
      const data = await response.json();
      setContracts(data.contracts || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching service contracts:', error);
    } finally {
      setLoading(false);
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
      const response = await fetch('/api/service-contracts', {
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
      console.error('Error creating service contract:', error);
    }
  };

  const handleActivateContract = async (contractId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await fetch('/api/service-contracts', {
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
    if (!confirm('Are you sure you want to delete this service contract?')) return;

    try {
      await fetch(`/api/service-contracts?id=${contractId}`, { method: 'DELETE' });
      fetchContracts();
      if (selectedContract?.id === contractId) {
        setDetailDialogOpen(false);
        setSelectedContract(null);
      }
    } catch (error) {
      console.error('Error deleting service contract:', error);
    }
  };

  const handleStartEdit = () => {
    if (!selectedContract) return;
    setEditFormData({
      name: selectedContract.name || '',
      contractType: selectedContract.contractType || 'SUPPORT',
      startDate: selectedContract.startDate ? new Date(selectedContract.startDate).toISOString().split('T')[0] : '',
      endDate: selectedContract.endDate ? new Date(selectedContract.endDate).toISOString().split('T')[0] : '',
      responseTimeHours: selectedContract.responseTimeHours || 0,
      contractValue: selectedContract.contractValue || 0,
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedContract) return;
    setEditSaving(true);
    try {
      const response = await fetch('/api/service-contracts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedContract.id, ...editFormData }),
      });
      if (response.ok) {
        setEditMode(false);
        setDetailDialogOpen(false);
        fetchContracts();
      }
    } catch (error) {
      console.error('Error updating service contract:', error);
    } finally {
      setEditSaving(false);
    }
  };

  const handleRowClick = (contract: ServiceContract) => {
    setSelectedContract(contract);
    setEditMode(false);
    setDetailDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      accountId: '',
      name: '',
      contractType: 'SUPPORT',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      responseTimeHours: 4,
      resolutionTimeHours: 24,
      supportHours: '9-5 M-F',
      contractValue: 0,
      billingFrequency: 'MONTHLY',
      autoRenew: false,
      terms: '',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'default';
      case 'ACTIVE':
        return 'success';
      case 'EXPIRED':
        return 'error';
      case 'CANCELLED':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getContractTypeLabel = (type: string) => {
    switch (type) {
      case 'WARRANTY':
        return 'Warranty';
      case 'SUPPORT':
        return 'Support';
      case 'MAINTENANCE':
        return 'Maintenance';
      case 'SLA':
        return 'SLA';
      default:
        return type;
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

  const filteredContracts = contracts
    .filter((contract) => {
      const searchLower = search.toLowerCase();
      const matchesSearch = !search ||
        contract.name.toLowerCase().includes(searchLower) ||
        contract.contractNumber.toLowerCase().includes(searchLower) ||
        contract.account?.name?.toLowerCase().includes(searchLower);

      let matchesTab = true;
      if (tabValue === 1) matchesTab = contract.status === 'DRAFT';
      else if (tabValue === 2) matchesTab = contract.status === 'ACTIVE';
      else if (tabValue === 3) matchesTab = contract.status === 'EXPIRED';
      else if (tabValue === 4) {
        const days = getDaysRemaining(contract.endDate);
        matchesTab = contract.status === 'ACTIVE' && days <= 30 && days > 0;
      }

      return matchesSearch && matchesTab;
    });

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SupportAgentIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4">Service Contracts</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            New Service Contract
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <SupportAgentIcon color="primary" sx={{ mr: 1 }} />
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

        {/* Search and Tabs */}
        <Paper sx={{ mb: 2, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search contracts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ width: 300 }}
            />
          </Box>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={`All (${stats.totalContracts})`} />
            <Tab label={`Draft (${stats.draftContracts})`} />
            <Tab label={`Active (${stats.activeContracts})`} />
            <Tab label={`Expired (${stats.expiredContracts})`} />
            <Tab label={`Expiring Soon (${stats.expiringThisMonth})`} />
          </Tabs>
        </Paper>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Contracts Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Contract</TableCell>
                <TableCell>Account</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>SLA Response</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
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
                      <Chip
                        label={getContractTypeLabel(contract.contractType)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {contract.responseTimeHours ? `${contract.responseTimeHours}h` : '-'}
                    </TableCell>
                    <TableCell>
                      {contract.startDate ? formatDate(contract.startDate) : '-'}
                    </TableCell>
                    <TableCell>
                      <Box>
                        {contract.endDate ? formatDate(contract.endDate) : '-'}
                        {contract.status === 'ACTIVE' && daysRemaining <= 30 && daysRemaining > 0 && (
                          <Typography variant="caption" color="warning.main" display="block">
                            {daysRemaining} days left
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{formatCurrency(contract.contractValue || 0)}</TableCell>
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
                      {contract.status === 'ACTIVE' && contract.autoRenew && (
                        <Tooltip title="Auto-Renew Enabled">
                          <AutorenewIcon color="info" fontSize="small" />
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredContracts.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No service contracts found
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
        onClose={() => { setDetailDialogOpen(false); setEditMode(false); }}
        maxWidth="md"
        fullWidth
      >
        {selectedContract && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <SupportAgentIcon color="primary" />
                  <Box>
                    <Typography variant="h6">{editMode ? 'Edit Contract' : selectedContract.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedContract.contractNumber}
                    </Typography>
                  </Box>
                </Box>
                <IconButton onClick={() => { setDetailDialogOpen(false); setEditMode(false); }}>
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
                      <Chip
                        label={getContractTypeLabel(selectedContract.contractType)}
                        variant="outlined"
                      />
                      {selectedContract.autoRenew && (
                        <Chip icon={<AutorenewIcon />} label="Auto-Renewal" color="info" variant="outlined" />
                      )}
                      {selectedContract.status === 'ACTIVE' && getDaysRemaining(selectedContract.endDate) <= 30 && getDaysRemaining(selectedContract.endDate) > 0 && (
                        <Chip icon={<WarningIcon />} label={`${getDaysRemaining(selectedContract.endDate)} days remaining`} color="warning" />
                      )}
                    </Box>
                  </Grid>

                  {/* Account & Value */}
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
                        Contract Value
                      </Typography>
                      <Typography variant="h5" color="primary">
                        {formatCurrency(selectedContract.contractValue || 0)}
                      </Typography>
                      {selectedContract.billingFrequency && (
                        <Typography variant="caption" color="text.secondary">
                          Billed {selectedContract.billingFrequency.toLowerCase()}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>

                  {/* SLA Details */}
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        <TimerIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Response Time
                      </Typography>
                      <Typography variant="h6">
                        {selectedContract.responseTimeHours ? `${selectedContract.responseTimeHours} hours` : 'N/A'}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        <TimerIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Resolution Time
                      </Typography>
                      <Typography variant="h6">
                        {selectedContract.resolutionTimeHours ? `${selectedContract.resolutionTimeHours} hours` : 'N/A'}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        <ScheduleIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Support Hours
                      </Typography>
                      <Typography variant="h6">
                        {selectedContract.supportHours || 'N/A'}
                      </Typography>
                    </Paper>
                  </Grid>

                  {/* Dates */}
                  <Grid size={{ xs: 12, md: 6 }}>
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

                  <Grid size={{ xs: 12, md: 6 }}>
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

                  {/* Terms */}
                  {selectedContract.terms && (
                    <Grid size={{ xs: 12 }}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Terms & Conditions
                        </Typography>
                        <Typography variant="body2">
                          {selectedContract.terms}
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
                        <Typography variant="caption" color="text.secondary">Created</Typography>
                        <Typography variant="body2">{formatDateTime(selectedContract.createdAt)}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              )}
              {selectedContract && editMode && (
                <Grid container spacing={2} sx={{ pt: 1 }}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Name"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Contract Type"
                      select
                      value={editFormData.contractType}
                      onChange={(e) => setEditFormData({ ...editFormData, contractType: e.target.value })}
                    >
                      <MenuItem value="WARRANTY">Warranty</MenuItem>
                      <MenuItem value="SUPPORT">Support</MenuItem>
                      <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                      <MenuItem value="SLA">SLA</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Response Time (hours)"
                      type="number"
                      value={editFormData.responseTimeHours}
                      onChange={(e) => setEditFormData({ ...editFormData, responseTimeHours: parseInt(e.target.value) || 0 })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Start Date"
                      type="date"
                      value={editFormData.startDate}
                      onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="End Date"
                      type="date"
                      value={editFormData.endDate}
                      onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Contract Value"
                      type="number"
                      value={editFormData.contractValue}
                      onChange={(e) => setEditFormData({ ...editFormData, contractValue: parseFloat(e.target.value) || 0 })}
                    />
                  </Grid>
                </Grid>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              {!editMode ? (
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
                  {selectedContract.status === 'ACTIVE' && (
                    <Button color="primary" startIcon={<AutorenewIcon />}>
                      Renew Contract
                    </Button>
                  )}
                  <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
                  <Button startIcon={<EditIcon />} onClick={handleStartEdit}>Edit</Button>
                </>
              ) : (
                <>
                  <Button startIcon={<CloseIcon />} onClick={() => setEditMode(false)}>Cancel</Button>
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
        <DialogTitle>Create New Service Contract</DialogTitle>
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
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Contract Type *</InputLabel>
                <Select
                  value={formData.contractType}
                  onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                  label="Contract Type *"
                >
                  <MenuItem value="WARRANTY">Warranty</MenuItem>
                  <MenuItem value="SUPPORT">Support</MenuItem>
                  <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                  <MenuItem value="SLA">SLA</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Billing Frequency</InputLabel>
                <Select
                  value={formData.billingFrequency}
                  onChange={(e) => setFormData({ ...formData, billingFrequency: e.target.value })}
                  label="Billing Frequency"
                >
                  <MenuItem value="MONTHLY">Monthly</MenuItem>
                  <MenuItem value="QUARTERLY">Quarterly</MenuItem>
                  <MenuItem value="ANNUALLY">Annually</MenuItem>
                </Select>
              </FormControl>
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
                label="Contract Value"
                type="number"
                value={formData.contractValue}
                onChange={(e) => setFormData({ ...formData, contractValue: parseFloat(e.target.value) || 0 })}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Response Time (hours)"
                type="number"
                value={formData.responseTimeHours}
                onChange={(e) => setFormData({ ...formData, responseTimeHours: parseInt(e.target.value) || 4 })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Resolution Time (hours)"
                type="number"
                value={formData.resolutionTimeHours}
                onChange={(e) => setFormData({ ...formData, resolutionTimeHours: parseInt(e.target.value) || 24 })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Support Hours"
                value={formData.supportHours}
                onChange={(e) => setFormData({ ...formData, supportHours: e.target.value })}
                placeholder="e.g., 24/7 or 9-5 M-F"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.autoRenew}
                    onChange={(e) => setFormData({ ...formData, autoRenew: e.target.checked })}
                  />
                }
                label="Auto-Renewal Enabled"
                sx={{ mt: 1 }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Terms & Conditions"
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
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
