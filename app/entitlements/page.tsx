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
  Tab,
  Tabs,
  LinearProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import TimerIcon from '@mui/icons-material/Timer';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface Entitlement {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string | null;
  totalCases: number;
  remainingCases: number;
  perIncident: boolean;
  account: { id: string; name: string } | null;
  contact: { id: string; firstName: string; lastName: string } | null;
  asset: { id: string; name: string } | null;
  process: { id: string; name: string } | null;
}

interface EntitlementProcess {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  milestones: any[];
}

const entitlementColumns: Column[] = [
  { id: 'name', label: 'Name' },
  { id: 'account', label: 'Account', sortable: false },
  { id: 'process', label: 'Process', sortable: false },
  { id: 'endDate', label: 'Valid Until' },
  { id: 'casesUsed', label: 'Cases Used', sortable: false },
  { id: 'status', label: 'Status' },
  { id: 'actions', label: 'Actions', sortable: false },
];

const processColumns: Column[] = [
  { id: 'name', label: 'Process Name' },
  { id: 'description', label: 'Description', sortable: false },
  { id: 'milestones', label: 'Milestones', sortable: false },
  { id: 'isActive', label: 'Status' },
  { id: 'actions', label: 'Actions', sortable: false },
];

export default function EntitlementsPage() {
  const toast = useToast();
  const { confirm } = useConfirmDialog();
  const [processes, setProcesses] = useState<EntitlementProcess[]>([]);
  const [stats, setStats] = useState({
    totalEntitlements: 0,
    activeEntitlements: 0,
    expiringSoon: 0,
    totalCasesRemaining: 0,
  });
  const [tabValue, setTabValue] = useState(0);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEntitlement, setSelectedEntitlement] = useState<Entitlement | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    status: '',
    description: '',
    startDate: '',
    endDate: '',
    remainingCases: 0,
  });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [formData, setFormData] = useState({
    name: '',
    accountId: '',
    processId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    totalCases: 10,
    perIncident: false,
  });
  const [processFormData, setProcessFormData] = useState({
    name: '',
    description: '',
    milestones: [{ name: '', targetMinutes: 60 }],
  });

  const {
    data: entitlements,
    loading,
    error,
    pagination,
    setPage,
    setPageSize,
    setSort,
    refresh,
  } = usePagination<Entitlement>({
    url: '/api/entitlements',
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  });

  useEffect(() => {
    fetchProcesses();
    fetchAccounts();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/entitlements');
      const data = await response.json();
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchProcesses = async () => {
    try {
      const response = await fetch('/api/entitlements?type=processes');
      const data = await response.json();
      setProcesses(data.processes || []);
    } catch (error) {
      console.error('Error fetching processes:', error);
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

  const handleSort = (columnId: string) => {
    const newOrder = sortBy === columnId && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(columnId);
    setSortOrder(newOrder);
    setSort(columnId, newOrder);
  };

  const handleCreateEntitlement = async () => {
    try {
      const response = await fetch('/api/entitlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          remainingCases: formData.totalCases,
        }),
      });

      if (response.ok) {
        setDialogOpen(false);
        toast.showSuccess('Entitlement created successfully');
        refresh();
        fetchStats();
        resetForm();
      }
    } catch (error) {
      toast.showError('Error creating entitlement');
    }
  };

  const handleCreateProcess = async () => {
    try {
      const response = await fetch('/api/entitlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'process',
          ...processFormData,
        }),
      });

      if (response.ok) {
        setProcessDialogOpen(false);
        toast.showSuccess('Process created successfully');
        fetchProcesses();
        setProcessFormData({ name: '', description: '', milestones: [{ name: '', targetMinutes: 60 }] });
      }
    } catch (error) {
      toast.showError('Error creating process');
    }
  };

  const handleDeleteEntitlement = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Entitlement',
      message: 'Are you sure you want to delete this entitlement? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      await fetch(`/api/entitlements?id=${id}`, { method: 'DELETE' });
      toast.showSuccess('Entitlement deleted successfully');
      refresh();
      fetchStats();
    } catch (error) {
      toast.showError('Error deleting entitlement');
    }
  };

  const handleDeleteProcess = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Process',
      message: 'Are you sure you want to delete this process? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      await fetch(`/api/entitlements?id=${id}&type=process`, { method: 'DELETE' });
      toast.showSuccess('Process deleted successfully');
      fetchProcesses();
    } catch (error) {
      toast.showError('Error deleting process');
    }
  };

  const handleStartEdit = () => {
    if (!selectedEntitlement) return;
    setEditFormData({
      name: selectedEntitlement.name,
      status: selectedEntitlement.status,
      description: '',
      startDate: selectedEntitlement.startDate ? selectedEntitlement.startDate.split('T')[0] : '',
      endDate: selectedEntitlement.endDate ? selectedEntitlement.endDate.split('T')[0] : '',
      remainingCases: selectedEntitlement.remainingCases,
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedEntitlement) return;
    try {
      const res = await fetch(`/api/entitlements/${selectedEntitlement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.showSuccess('Entitlement updated successfully');
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
      processId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      totalCases: 10,
      perIncident: false,
    });
  };

  const addMilestone = () => {
    setProcessFormData({
      ...processFormData,
      milestones: [...processFormData.milestones, { name: '', targetMinutes: 60 }],
    });
  };

  const updateMilestone = (index: number, field: string, value: any) => {
    const newMilestones = [...processFormData.milestones];
    newMilestones[index] = { ...newMilestones[index], [field]: value };
    setProcessFormData({ ...processFormData, milestones: newMilestones });
  };

  const removeMilestone = (index: number) => {
    const newMilestones = processFormData.milestones.filter((_, i) => i !== index);
    setProcessFormData({ ...processFormData, milestones: newMilestones });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'EXPIRED':
        return 'error';
      case 'INACTIVE':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getCaseUsagePercent = (total: number, remaining: number) => {
    if (total === 0) return 0;
    return ((total - remaining) / total) * 100;
  };

  const filteredEntitlements = useMemo(() => {
    const searchLower = search.toLowerCase();
    return entitlements.filter((entitlement) =>
      !search ||
      entitlement.name.toLowerCase().includes(searchLower) ||
      entitlement.account?.name.toLowerCase().includes(searchLower) ||
      entitlement.process?.name.toLowerCase().includes(searchLower)
    );
  }, [entitlements, search]);

  const exportData = filteredEntitlements.map((e) => ({
    Name: e.name,
    Account: e.account?.name || '-',
    Process: e.process?.name || '-',
    'Valid Until': e.endDate ? new Date(e.endDate).toLocaleDateString() : 'No expiry',
    'Cases Used': `${e.totalCases - e.remainingCases}/${e.totalCases}`,
    Status: e.status,
  }));

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Entitlements & SLAs</Typography>
          <Box display="flex" gap={2} alignItems="center">
            <ExportToolbar data={exportData} filename="entitlements" title="Entitlements" />
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setProcessDialogOpen(true)}
            >
              New Process
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              New Entitlement
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <VerifiedUserIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Total Entitlements</Typography>
                </Box>
                <Typography variant="h4">{stats.totalEntitlements}</Typography>
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
                <Typography variant="h4">{stats.activeEntitlements}</Typography>
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
                <Typography variant="h4">{stats.expiringSoon}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TimerIcon color="info" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Cases Remaining</Typography>
                </Box>
                <Typography variant="h4">{stats.totalCasesRemaining}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 2, p: 2 }}>
          {tabValue === 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <TextField
                size="small"
                placeholder="Search entitlements..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ width: 300 }}
              />
            </Box>
          )}
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="Entitlements" />
            <Tab label="Entitlement Processes" />
          </Tabs>
        </Paper>

        {/* Entitlements Tab */}
        {tabValue === 0 && (
          <>
            {loading ? (
              <TableSkeleton rows={5} columns={7} />
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <SortableTableHead
                    columns={entitlementColumns}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <TableBody>
                    {filteredEntitlements.map((entitlement) => (
                      <TableRow
                        key={entitlement.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => {
                          setSelectedEntitlement(entitlement);
                          setDetailOpen(true);
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {entitlement.name}
                          </Typography>
                          {entitlement.perIncident && (
                            <Chip label="Per Incident" size="small" sx={{ mt: 0.5 }} />
                          )}
                        </TableCell>
                        <TableCell>{entitlement.account?.name || '-'}</TableCell>
                        <TableCell>{entitlement.process?.name || '-'}</TableCell>
                        <TableCell>
                          {entitlement.endDate
                            ? new Date(entitlement.endDate).toLocaleDateString()
                            : 'No expiry'}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={getCaseUsagePercent(entitlement.totalCases, entitlement.remainingCases)}
                                color={entitlement.remainingCases < 3 ? 'error' : 'primary'}
                              />
                            </Box>
                            <Typography variant="body2">
                              {entitlement.totalCases - entitlement.remainingCases}/{entitlement.totalCases}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={entitlement.status}
                            color={getStatusColor(entitlement.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteEntitlement(entitlement.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredEntitlements.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          No entitlements found
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
          </>
        )}

        {/* Processes Tab */}
        {tabValue === 1 && (
          <TableContainer component={Paper}>
            <Table>
              <SortableTableHead
                columns={processColumns}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
              <TableBody>
                {processes.map((process) => (
                  <TableRow key={process.id} hover sx={{ cursor: 'pointer' }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {process.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{process.description || '-'}</TableCell>
                    <TableCell>
                      {process.milestones.map((m: any) => (
                        <Chip
                          key={m.id}
                          label={`${m.name} (${m.targetMinutes}m)`}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={process.isActive ? 'Active' : 'Inactive'}
                        color={process.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteProcess(process.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {processes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No processes found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Create Entitlement Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Entitlement</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
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
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Entitlement Process</InputLabel>
            <Select
              value={formData.processId}
              onChange={(e) => setFormData({ ...formData, processId: e.target.value })}
              label="Entitlement Process"
            >
              <MenuItem value="">None</MenuItem>
              {processes.map((process) => (
                <MenuItem key={process.id} value={process.id}>
                  {process.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          <TextField
            fullWidth
            label="Total Cases Allowed"
            type="number"
            value={formData.totalCases}
            onChange={(e) => setFormData({ ...formData, totalCases: parseInt(e.target.value) || 0 })}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.perIncident}
                onChange={(e) => setFormData({ ...formData, perIncident: e.target.checked })}
              />
            }
            label="Per Incident (charge per case)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateEntitlement}
            variant="contained"
            disabled={!formData.name || !formData.accountId}
          >
            Create Entitlement
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Process Dialog */}
      <Dialog open={processDialogOpen} onClose={() => setProcessDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Entitlement Process</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Process Name"
            value={processFormData.name}
            onChange={(e) => setProcessFormData({ ...processFormData, name: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            value={processFormData.description}
            onChange={(e) => setProcessFormData({ ...processFormData, description: e.target.value })}
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />
          <Typography variant="subtitle2" gutterBottom>
            Milestones
          </Typography>
          {processFormData.milestones.map((milestone, index) => (
            <Grid container spacing={2} key={index} sx={{ mb: 1 }}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Milestone Name"
                  value={milestone.name}
                  onChange={(e) => updateMilestone(index, 'name', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Target (minutes)"
                  type="number"
                  value={milestone.targetMinutes}
                  onChange={(e) => updateMilestone(index, 'targetMinutes', parseInt(e.target.value) || 60)}
                />
              </Grid>
              <Grid size={{ xs: 2 }}>
                <IconButton color="error" onClick={() => removeMilestone(index)}>
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
          ))}
          <Button startIcon={<AddIcon />} onClick={addMilestone}>
            Add Milestone
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProcessDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateProcess}
            variant="contained"
            disabled={!processFormData.name}
          >
            Create Process
          </Button>
        </DialogActions>
      </Dialog>

      {/* Entitlement Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => { setDetailOpen(false); setEditMode(false); }} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">
                {editMode ? 'Edit Entitlement' : selectedEntitlement?.name}
              </Typography>
              {!editMode && (
                <Typography variant="body2" color="textSecondary">
                  {selectedEntitlement?.perIncident ? 'Per Incident' : 'Standard'} Entitlement
                </Typography>
              )}
            </Box>
            <IconButton onClick={() => { setDetailOpen(false); setEditMode(false); }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedEntitlement && !editMode && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={selectedEntitlement.status}
                    color={getStatusColor(selectedEntitlement.status) as any}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Start Date</Typography>
                <Typography variant="body1">
                  {new Date(selectedEntitlement.startDate).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">End Date</Typography>
                <Typography variant="body1">
                  {selectedEntitlement.endDate
                    ? new Date(selectedEntitlement.endDate).toLocaleDateString()
                    : 'No expiry'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Account</Typography>
                <Typography variant="body1">{selectedEntitlement.account?.name || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Contact</Typography>
                <Typography variant="body1">
                  {selectedEntitlement.contact
                    ? `${selectedEntitlement.contact.firstName} ${selectedEntitlement.contact.lastName}`
                    : '-'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Entitlement Process</Typography>
                <Typography variant="body1">{selectedEntitlement.process?.name || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Asset</Typography>
                <Typography variant="body1">{selectedEntitlement.asset?.name || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="textSecondary">Case Usage</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Box sx={{ width: '100%', mr: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={getCaseUsagePercent(selectedEntitlement.totalCases, selectedEntitlement.remainingCases)}
                      color={selectedEntitlement.remainingCases < 3 ? 'error' : 'primary'}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Box>
                  <Typography variant="body1" sx={{ minWidth: 80 }}>
                    {selectedEntitlement.totalCases - selectedEntitlement.remainingCases} / {selectedEntitlement.totalCases}
                  </Typography>
                </Box>
                <Typography variant="caption" color="textSecondary">
                  {selectedEntitlement.remainingCases} cases remaining
                </Typography>
              </Grid>
            </Grid>
          )}
          {selectedEntitlement && editMode && (
            <Box sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="EXPIRED">Expired</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                multiline
                rows={3}
                sx={{ mb: 2 }}
              />
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={editFormData.startDate}
                    onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={editFormData.endDate}
                    onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
              <TextField
                fullWidth
                label="Remaining Cases"
                type="number"
                value={editFormData.remainingCases}
                onChange={(e) => setEditFormData({ ...editFormData, remainingCases: parseInt(e.target.value) || 0 })}
                sx={{ mb: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {editMode ? (
            <>
              <Button onClick={() => setEditMode(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit} variant="contained" disabled={!editFormData.name}>
                Save
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => { setDetailOpen(false); setEditMode(false); }}>Close</Button>
              <Button onClick={handleStartEdit} variant="outlined" startIcon={<EditIcon />}>
                Edit
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
