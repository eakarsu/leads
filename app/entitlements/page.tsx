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
  LinearProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import TimerIcon from '@mui/icons-material/Timer';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DashboardLayout from '@/components/DashboardLayout';

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

export default function EntitlementsPage() {
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [processes, setProcesses] = useState<EntitlementProcess[]>([]);
  const [stats, setStats] = useState({
    totalEntitlements: 0,
    activeEntitlements: 0,
    expiringSoon: 0,
    totalCasesRemaining: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEntitlement, setSelectedEntitlement] = useState<Entitlement | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
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

  useEffect(() => {
    fetchEntitlements();
    fetchProcesses();
    fetchAccounts();
  }, []);

  const fetchEntitlements = async () => {
    try {
      const response = await fetch('/api/entitlements');
      const data = await response.json();
      setEntitlements(data.entitlements || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching entitlements:', error);
    } finally {
      setLoading(false);
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
      setAccounts(data.clients || data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
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
        fetchEntitlements();
        resetForm();
      }
    } catch (error) {
      console.error('Error creating entitlement:', error);
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
        fetchProcesses();
        setProcessFormData({ name: '', description: '', milestones: [{ name: '', targetMinutes: 60 }] });
      }
    } catch (error) {
      console.error('Error creating process:', error);
    }
  };

  const handleDeleteEntitlement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entitlement?')) return;

    try {
      await fetch(`/api/entitlements?id=${id}`, { method: 'DELETE' });
      fetchEntitlements();
    } catch (error) {
      console.error('Error deleting entitlement:', error);
    }
  };

  const handleDeleteProcess = async (id: string) => {
    if (!confirm('Are you sure you want to delete this process?')) return;

    try {
      await fetch(`/api/entitlements?id=${id}&type=process`, { method: 'DELETE' });
      fetchProcesses();
    } catch (error) {
      console.error('Error deleting process:', error);
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

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Entitlements & SLAs</Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setProcessDialogOpen(true)}
              sx={{ mr: 1 }}
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
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Account</TableCell>
                  <TableCell>Process</TableCell>
                  <TableCell>Valid Until</TableCell>
                  <TableCell>Cases Used</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entitlements.filter((entitlement) => {
                  const searchLower = search.toLowerCase();
                  return !search ||
                    entitlement.name.toLowerCase().includes(searchLower) ||
                    entitlement.account?.name.toLowerCase().includes(searchLower) ||
                    entitlement.process?.name.toLowerCase().includes(searchLower);
                }).map((entitlement) => (
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
                    <TableCell>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEntitlement(entitlement.id);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {entitlements.length === 0 && (
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

        {/* Processes Tab */}
        {tabValue === 1 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Process Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Milestones</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {processes.map((process) => (
                  <TableRow key={process.id}>
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
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">{selectedEntitlement?.name}</Typography>
              <Typography variant="body2" color="textSecondary">
                {selectedEntitlement?.perIncident ? 'Per Incident' : 'Standard'} Entitlement
              </Typography>
            </Box>
            <IconButton onClick={() => setDetailOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedEntitlement && (
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
