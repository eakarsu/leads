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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import CloseIcon from '@mui/icons-material/Close';
import DashboardLayout from '@/components/DashboardLayout';

interface Case {
  id: string;
  caseNumber: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  origin: string;
  type: string | null;
  account: { id: string; name: string } | null;
  createdAt: string;
}

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [stats, setStats] = useState({
    totalCases: 0,
    newCases: 0,
    openCases: 0,
    inProgressCases: 0,
    escalatedCases: 0,
    closedCases: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'MEDIUM',
    origin: 'WEB',
    type: '',
    accountId: '',
  });

  useEffect(() => {
    fetchCases();
    fetchAccounts();
  }, []);

  const fetchCases = async () => {
    try {
      const response = await fetch('/api/cases');
      const data = await response.json();
      setCases(data.cases || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching cases:', error);
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

  const handleCreateCase = async () => {
    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setDialogOpen(false);
        fetchCases();
        resetForm();
      }
    } catch (error) {
      console.error('Error creating case:', error);
    }
  };

  const handleUpdateStatus = async (caseId: string, status: string) => {
    try {
      await fetch(`/api/cases/${caseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchCases();
      setDetailOpen(false);
    } catch (error) {
      console.error('Error updating case:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      subject: '',
      description: '',
      priority: 'MEDIUM',
      origin: 'WEB',
      type: '',
      accountId: '',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'info';
      case 'OPEN':
        return 'primary';
      case 'IN_PROGRESS':
        return 'warning';
      case 'ESCALATED':
        return 'error';
      case 'CLOSED':
        return 'success';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'default';
      case 'MEDIUM':
        return 'info';
      case 'HIGH':
        return 'warning';
      case 'CRITICAL':
        return 'error';
      default:
        return 'default';
    }
  };

  const filteredCases = cases.filter((c) => {
    // Search filter
    const searchLower = search.toLowerCase();
    const matchesSearch = !search ||
      c.caseNumber.toLowerCase().includes(searchLower) ||
      c.subject.toLowerCase().includes(searchLower) ||
      c.account?.name.toLowerCase().includes(searchLower);

    // Tab filter
    let matchesTab = true;
    if (tabValue === 1) matchesTab = c.status === 'NEW';
    else if (tabValue === 2) matchesTab = c.status === 'OPEN' || c.status === 'IN_PROGRESS';
    else if (tabValue === 3) matchesTab = c.status === 'ESCALATED';
    else if (tabValue === 4) matchesTab = c.status === 'CLOSED';

    return matchesSearch && matchesTab;
  });

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Cases</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            New Case
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <SupportAgentIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary" variant="body2">Total</Typography>
                </Box>
                <Typography variant="h4">{stats.totalCases}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <NewReleasesIcon color="info" sx={{ mr: 1 }} />
                  <Typography color="textSecondary" variant="body2">New</Typography>
                </Box>
                <Typography variant="h4">{stats.newCases}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PendingActionsIcon color="warning" sx={{ mr: 1 }} />
                  <Typography color="textSecondary" variant="body2">In Progress</Typography>
                </Box>
                <Typography variant="h4">{stats.openCases + stats.inProgressCases}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <WarningIcon color="error" sx={{ mr: 1 }} />
                  <Typography color="textSecondary" variant="body2">Escalated</Typography>
                </Box>
                <Typography variant="h4">{stats.escalatedCases}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                  <Typography color="textSecondary" variant="body2">Closed</Typography>
                </Box>
                <Typography variant="h4">{stats.closedCases}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Tabs */}
        <Paper sx={{ mb: 2, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search cases..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ width: 300 }}
            />
          </Box>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={`All (${stats.totalCases})`} />
            <Tab label={`New (${stats.newCases})`} />
            <Tab label={`Open (${stats.openCases + stats.inProgressCases})`} />
            <Tab label={`Escalated (${stats.escalatedCases})`} />
            <Tab label={`Closed (${stats.closedCases})`} />
          </Tabs>
        </Paper>

        {/* Cases Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Case Number</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Account</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Origin</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCases.map((caseItem) => (
                <TableRow
                  key={caseItem.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedCase(caseItem);
                    setDetailOpen(true);
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {caseItem.caseNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{caseItem.subject}</Typography>
                    {caseItem.type && (
                      <Typography variant="caption" color="textSecondary">
                        {caseItem.type}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{caseItem.account?.name || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      icon={caseItem.priority === 'CRITICAL' ? <PriorityHighIcon /> : undefined}
                      label={caseItem.priority}
                      color={getPriorityColor(caseItem.priority) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{caseItem.origin}</TableCell>
                  <TableCell>
                    <Chip
                      label={caseItem.status.replace('_', ' ')}
                      color={getStatusColor(caseItem.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(caseItem.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {caseItem.status !== 'CLOSED' && (
                      <Tooltip title="Close Case">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(caseItem.id, 'CLOSED');
                          }}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredCases.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No cases found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Create Case Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Case</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Subject *"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={4}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Account</InputLabel>
                <Select
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  label="Account"
                >
                  <MenuItem value="">None</MenuItem>
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
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  label="Priority"
                >
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="CRITICAL">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Origin</InputLabel>
                <Select
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  label="Origin"
                >
                  <MenuItem value="WEB">Web</MenuItem>
                  <MenuItem value="EMAIL">Email</MenuItem>
                  <MenuItem value="PHONE">Phone</MenuItem>
                  <MenuItem value="CHAT">Chat</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  label="Type"
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="Bug">Bug</MenuItem>
                  <MenuItem value="Feature Request">Feature Request</MenuItem>
                  <MenuItem value="Question">Question</MenuItem>
                  <MenuItem value="How-to">How-to</MenuItem>
                  <MenuItem value="Problem">Problem</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateCase}
            variant="contained"
            disabled={!formData.subject}
          >
            Create Case
          </Button>
        </DialogActions>
      </Dialog>

      {/* Case Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">{selectedCase?.caseNumber}</Typography>
              <Typography variant="body2" color="textSecondary">{selectedCase?.subject}</Typography>
            </Box>
            <IconButton onClick={() => setDetailOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedCase && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={selectedCase.status.replace('_', ' ')}
                    color={getStatusColor(selectedCase.status) as any}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Priority</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={selectedCase.priority}
                    color={getPriorityColor(selectedCase.priority) as any}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="textSecondary">Origin</Typography>
                <Typography variant="body1">{selectedCase.origin}</Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="textSecondary">Description</Typography>
                <Typography variant="body1" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                  {selectedCase.description || 'No description provided'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Account</Typography>
                <Typography variant="body1">{selectedCase.account?.name || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Type</Typography>
                <Typography variant="body1">{selectedCase.type || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="textSecondary">Created</Typography>
                <Typography variant="body1">
                  {new Date(selectedCase.createdAt).toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          {selectedCase && selectedCase.status !== 'CLOSED' && (
            <>
              <Button
                color="warning"
                onClick={() => handleUpdateStatus(selectedCase.id, 'ESCALATED')}
              >
                Escalate
              </Button>
              <Button
                color="success"
                variant="contained"
                onClick={() => handleUpdateStatus(selectedCase.id, 'CLOSED')}
              >
                Close Case
              </Button>
            </>
          )}
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
