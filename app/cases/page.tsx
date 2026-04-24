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
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface Case {
  id: string;
  caseNumber: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  origin: string;
  type: string | null;
  reason: string | null;
  account: { id: string; name: string } | null;
  createdAt: string;
}

const columns: Column[] = [
  { id: 'caseNumber', label: 'Case Number' },
  { id: 'subject', label: 'Subject' },
  { id: 'account', label: 'Account', sortable: false },
  { id: 'priority', label: 'Priority' },
  { id: 'origin', label: 'Origin' },
  { id: 'status', label: 'Status' },
  { id: 'createdAt', label: 'Created' },
  { id: 'actions', label: 'Actions', sortable: false },
];

export default function CasesPage() {
  const [stats, setStats] = useState({
    totalCases: 0,
    newCases: 0,
    openCases: 0,
    inProgressCases: 0,
    escalatedCases: 0,
    closedCases: 0,
  });
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

  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    subject: '',
    description: '',
    status: '',
    priority: '',
    origin: '',
    type: '',
    reason: '',
  });

  const [sortBy, setSortByLocal] = useState('createdAt');
  const [sortOrder, setSortOrderLocal] = useState<'asc' | 'desc'>('desc');

  const { data: cases, loading, error, pagination, setPage, setPageSize, setSort, refresh } = usePagination<Case>({
    url: '/api/cases',
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
      const response = await fetch('/api/cases');
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

  const handleCreateCase = async () => {
    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setDialogOpen(false);
        refresh();
        fetchStats();
        resetForm();
        toast.showSuccess('Case created successfully');
      } else {
        toast.showError('Failed to create case');
      }
    } catch (error) {
      console.error('Error creating case:', error);
      toast.showError('Error creating case');
    }
  };

  const handleUpdateStatus = async (caseId: string, status: string) => {
    try {
      await fetch(`/api/cases/${caseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      refresh();
      fetchStats();
      setDetailOpen(false);
      toast.showSuccess(`Case ${status === 'CLOSED' ? 'closed' : 'escalated'} successfully`);
    } catch (error) {
      console.error('Error updating case:', error);
      toast.showError('Error updating case status');
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    const confirmed = await confirm({
      title: 'Delete Case',
      message: 'Are you sure you want to delete this case? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/cases/${caseId}`, { method: 'DELETE' });
      if (response.ok) {
        refresh();
        fetchStats();
        setDetailOpen(false);
        toast.showSuccess('Case deleted successfully');
      } else {
        toast.showError('Failed to delete case');
      }
    } catch (error) {
      console.error('Error deleting case:', error);
      toast.showError('Error deleting case');
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

  const handleStartEdit = () => {
    if (!selectedCase) return;
    setEditFormData({
      subject: selectedCase.subject || '',
      description: selectedCase.description || '',
      status: selectedCase.status || '',
      priority: selectedCase.priority || '',
      origin: selectedCase.origin || '',
      type: selectedCase.type || '',
      reason: selectedCase.reason || '',
    });
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedCase) return;
    try {
      const response = await fetch(`/api/cases/${selectedCase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        setEditMode(false);
        setDetailOpen(false);
        refresh();
        fetchStats();
        toast.showSuccess('Case updated successfully');
      } else {
        toast.showError('Failed to update case');
      }
    } catch (error) {
      console.error('Error updating case:', error);
      toast.showError('Error updating case');
    }
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
    const searchLower = search.toLowerCase();
    const matchesSearch = !search ||
      c.caseNumber.toLowerCase().includes(searchLower) ||
      c.subject.toLowerCase().includes(searchLower) ||
      c.account?.name.toLowerCase().includes(searchLower);

    let matchesTab = true;
    if (tabValue === 1) matchesTab = c.status === 'NEW';
    else if (tabValue === 2) matchesTab = c.status === 'OPEN' || c.status === 'IN_PROGRESS';
    else if (tabValue === 3) matchesTab = c.status === 'ESCALATED';
    else if (tabValue === 4) matchesTab = c.status === 'CLOSED';

    return matchesSearch && matchesTab;
  });

  const exportData = filteredCases.map((c) => ({
    'Case Number': c.caseNumber,
    Subject: c.subject,
    Account: c.account?.name || '-',
    Priority: c.priority,
    Origin: c.origin,
    Status: c.status,
    Created: new Date(c.createdAt).toLocaleDateString(),
  }));

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Cases</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ExportToolbar data={exportData} filename="cases" title="Cases Export" />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              New Case
            </Button>
          </Box>
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
        {loading ? (
          <TableSkeleton rows={8} columns={8} />
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <SortableTableHead
                columns={columns}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
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
      <Dialog open={detailOpen} onClose={() => { setDetailOpen(false); setEditMode(false); }} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">{selectedCase?.caseNumber}</Typography>
              {!editMode && (
                <Typography variant="body2" color="textSecondary">{selectedCase?.subject}</Typography>
              )}
              {editMode && (
                <Typography variant="body2" color="primary">Editing Case</Typography>
              )}
            </Box>
            <IconButton onClick={() => { setDetailOpen(false); setEditMode(false); }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedCase && !editMode && (
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
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Reason</Typography>
                <Typography variant="body1">{selectedCase.reason || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="textSecondary">Created</Typography>
                <Typography variant="body1">
                  {new Date(selectedCase.createdAt).toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          )}
          {selectedCase && editMode && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Subject *"
                  value={editFormData.subject}
                  onChange={(e) => setEditFormData({ ...editFormData, subject: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  multiline
                  rows={4}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    label="Status"
                  >
                    <MenuItem value="NEW">New</MenuItem>
                    <MenuItem value="OPEN">Open</MenuItem>
                    <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                    <MenuItem value="ESCALATED">Escalated</MenuItem>
                    <MenuItem value="ON_HOLD">On Hold</MenuItem>
                    <MenuItem value="WAITING_ON_CUSTOMER">Waiting on Customer</MenuItem>
                    <MenuItem value="RESOLVED">Resolved</MenuItem>
                    <MenuItem value="CLOSED">Closed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={editFormData.priority}
                    onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
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
                    value={editFormData.origin}
                    onChange={(e) => setEditFormData({ ...editFormData, origin: e.target.value })}
                    label="Origin"
                  >
                    <MenuItem value="WEB">Web</MenuItem>
                    <MenuItem value="EMAIL">Email</MenuItem>
                    <MenuItem value="PHONE">Phone</MenuItem>
                    <MenuItem value="CHAT">Chat</MenuItem>
                    <MenuItem value="SOCIAL">Social</MenuItem>
                    <MenuItem value="PARTNER">Partner</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={editFormData.type}
                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
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
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>Reason</InputLabel>
                  <Select
                    value={editFormData.reason}
                    onChange={(e) => setEditFormData({ ...editFormData, reason: e.target.value })}
                    label="Reason"
                  >
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="Installation">Installation</MenuItem>
                    <MenuItem value="User Education">User Education</MenuItem>
                    <MenuItem value="Performance">Performance</MenuItem>
                    <MenuItem value="Breakdown">Breakdown</MenuItem>
                    <MenuItem value="Feedback">Feedback</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          {selectedCase && editMode && (
            <>
              <Button
                onClick={handleCancelEdit}
                startIcon={<CancelIcon />}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveEdit}
                disabled={!editFormData.subject}
              >
                Save
              </Button>
            </>
          )}
          {selectedCase && !editMode && (
            <>
              {selectedCase.status !== 'CLOSED' && (
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
              <Button
                color="primary"
                startIcon={<EditIcon />}
                onClick={handleStartEdit}
              >
                Edit
              </Button>
              <Button
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => handleDeleteCase(selectedCase.id)}
              >
                Delete
              </Button>
              <Button onClick={() => setDetailOpen(false)}>Close</Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
