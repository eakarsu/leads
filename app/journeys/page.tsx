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
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RouteIcon from '@mui/icons-material/Route';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SearchIcon from '@mui/icons-material/Search';
import FlagIcon from '@mui/icons-material/Flag';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface Journey {
  id: string;
  name: string;
  description: string | null;
  status: string;
  type: string;
  triggerType: string;
  totalEntered: number;
  totalCompleted: number;
  totalConverted: number;
  createdAt: string;
  _count?: { steps: number; enrollments: number };
}

const columns: Column[] = [
  { id: 'name', label: 'Journey Name' },
  { id: 'type', label: 'Type' },
  { id: 'triggerType', label: 'Trigger' },
  { id: 'totalEntered', label: 'Entered' },
  { id: 'totalCompleted', label: 'Completed' },
  { id: 'totalConverted', label: 'Converted' },
  { id: 'conversionRate', label: 'Rate', sortable: false },
  { id: 'status', label: 'Status' },
  { id: 'actions', label: 'Actions', sortable: false },
];

export default function JourneysPage() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [stats, setStats] = useState({
    totalJourneys: 0,
    activeJourneys: 0,
    pausedJourneys: 0,
    totalEnrollments: 0,
    totalConversions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { showSuccess, showError } = useToast();
  const { confirm } = useConfirmDialog();

  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    triggerType: '',
  });
  const [editSaving, setEditSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'NURTURE',
    triggerType: 'MANUAL',
  });

  useEffect(() => {
    fetchJourneys();
  }, []);

  const fetchJourneys = async () => {
    try {
      const response = await fetch('/api/journeys');
      const data = await response.json();
      const arr = Array.isArray(data) ? data : data.data || [];
      setJourneys(arr);
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching journeys:', error);
      showError('Failed to load journeys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJourney = async () => {
    try {
      const response = await fetch('/api/journeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setDialogOpen(false);
        fetchJourneys();
        resetForm();
        showSuccess('Journey created successfully');
      } else {
        showError('Failed to create journey');
      }
    } catch (error) {
      console.error('Error creating journey:', error);
      showError('Failed to create journey');
    }
  };

  const handleStatusChange = async (journeyId: string, status: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await fetch('/api/journeys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: journeyId, status }),
      });
      fetchJourneys();
      showSuccess(`Journey ${status.toLowerCase()}`);
    } catch (error) {
      console.error('Error updating journey status:', error);
      showError('Failed to update journey status');
    }
  };

  const handleDeleteJourney = async (journeyId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const confirmed = await confirm({
      title: 'Delete Journey',
      message: 'Are you sure you want to delete this journey? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      await fetch(`/api/journeys?id=${journeyId}`, { method: 'DELETE' });
      fetchJourneys();
      if (selectedJourney?.id === journeyId) {
        setDetailDialogOpen(false);
        setSelectedJourney(null);
      }
      showSuccess('Journey deleted successfully');
    } catch (error) {
      console.error('Error deleting journey:', error);
      showError('Failed to delete journey');
    }
  };

  const handleRowClick = (journey: Journey) => {
    setSelectedJourney(journey);
    setEditMode(false);
    setDetailDialogOpen(true);
  };

  const handleStartEdit = () => {
    if (!selectedJourney) return;
    setEditFormData({
      name: selectedJourney.name || '',
      description: selectedJourney.description || '',
      triggerType: selectedJourney.triggerType || '',
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedJourney) return;
    setEditSaving(true);
    try {
      const response = await fetch('/api/journeys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedJourney.id, ...editFormData }),
      });
      if (response.ok) {
        showSuccess('Journey updated successfully');
        setEditMode(false);
        setDetailDialogOpen(false);
        fetchJourneys();
      } else {
        showError('Failed to update journey');
      }
    } catch (error) {
      console.error('Error updating journey:', error);
      showError('Failed to update journey');
    } finally {
      setEditSaving(false);
    }
  };

  const handleSort = (columnId: string) => {
    if (sortBy === columnId) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnId);
      setSortOrder('asc');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'NURTURE',
      triggerType: 'MANUAL',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PAUSED': return 'warning';
      case 'DRAFT': return 'default';
      case 'COMPLETED': return 'info';
      default: return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'NURTURE': return 'Nurture';
      case 'ONBOARDING': return 'Onboarding';
      case 'RE_ENGAGEMENT': return 'Re-engagement';
      case 'UPSELL': return 'Upsell';
      default: return type;
    }
  };

  const getConversionRate = (journey: Journey) => {
    if (journey.totalEntered === 0) return 0;
    return Math.round((journey.totalConverted / journey.totalEntered) * 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredJourneys = journeys
    .filter((journey) => {
      const searchLower = search.toLowerCase();
      const matchesSearch = !search ||
        journey.name.toLowerCase().includes(searchLower) ||
        journey.type.toLowerCase().includes(searchLower);

      let matchesTab = true;
      if (tabValue === 1) matchesTab = journey.status === 'ACTIVE';
      else if (tabValue === 2) matchesTab = journey.status === 'PAUSED';
      else if (tabValue === 3) matchesTab = journey.status === 'DRAFT';

      return matchesSearch && matchesTab;
    })
    .sort((a, b) => {
      const aVal = (a as any)[sortBy];
      const bVal = (b as any)[sortBy];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal));
      return sortOrder === 'asc' ? cmp : -cmp;
    });

  const totalItems = filteredJourneys.length;
  const paginatedJourneys = filteredJourneys.slice((page - 1) * pageSize, page * pageSize);

  const exportData = filteredJourneys.map(j => ({
    Name: j.name,
    Type: getTypeLabel(j.type),
    Trigger: j.triggerType,
    Entered: j.totalEntered,
    Completed: j.totalCompleted,
    Converted: j.totalConverted,
    'Conversion Rate': `${getConversionRate(j)}%`,
    Status: j.status,
    Created: formatDate(j.createdAt),
  }));

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <RouteIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4">Journey Builder</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ExportToolbar data={exportData} filename="journeys" title="Journey Builder" />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              New Journey
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <RouteIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Journeys</Typography>
                </Box>
                <Typography variant="h4">{stats.totalJourneys}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Active</Typography>
                </Box>
                <Typography variant="h4">{stats.activeJourneys}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PauseIcon color="warning" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Paused</Typography>
                </Box>
                <Typography variant="h4">{stats.pausedJourneys}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PeopleIcon color="info" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Enrolled</Typography>
                </Box>
                <Typography variant="h4">{stats.totalEnrollments}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Conversions</Typography>
                </Box>
                <Typography variant="h4">{stats.totalConversions}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Tabs */}
        <Paper sx={{ mb: 2, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search journeys..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ width: 300 }}
            />
          </Box>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={`All (${stats.totalJourneys})`} />
            <Tab label={`Active (${stats.activeJourneys})`} />
            <Tab label={`Paused (${stats.pausedJourneys})`} />
            <Tab label="Draft" />
          </Tabs>
        </Paper>

        {/* Journeys Table */}
        {loading ? (
          <TableSkeleton rows={5} columns={9} />
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
                {paginatedJourneys.map((journey) => (
                  <TableRow
                    key={journey.id}
                    hover
                    onClick={() => handleRowClick(journey)}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {journey.name}
                      </Typography>
                      {journey.description && (
                        <Typography variant="caption" color="textSecondary">
                          {journey.description.substring(0, 50)}...
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={getTypeLabel(journey.type)} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{journey.triggerType}</TableCell>
                    <TableCell>{journey.totalEntered.toLocaleString()}</TableCell>
                    <TableCell>{journey.totalCompleted.toLocaleString()}</TableCell>
                    <TableCell>{journey.totalConverted.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${getConversionRate(journey)}%`}
                        size="small"
                        color={getConversionRate(journey) >= 20 ? 'success' : getConversionRate(journey) >= 10 ? 'warning' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={journey.status}
                        color={getStatusColor(journey.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {journey.status === 'DRAFT' && (
                        <Tooltip title="Activate">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={(e) => handleStatusChange(journey.id, 'ACTIVE', e)}
                          >
                            <PlayArrowIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {journey.status === 'ACTIVE' && (
                        <Tooltip title="Pause">
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={(e) => handleStatusChange(journey.id, 'PAUSED', e)}
                          >
                            <PauseIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {journey.status === 'PAUSED' && (
                        <Tooltip title="Resume">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={(e) => handleStatusChange(journey.id, 'ACTIVE', e)}
                          >
                            <PlayArrowIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => handleDeleteJourney(journey.id, e)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedJourneys.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No journeys found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <PaginationControls
              page={page}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            />
          </TableContainer>
        )}
      </Box>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedJourney && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <RouteIcon color="primary" />
                  <Typography variant="h6">{selectedJourney.name}</Typography>
                </Box>
                <IconButton onClick={() => setDetailDialogOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              {selectedJourney && !editMode && (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={selectedJourney.status}
                        color={getStatusColor(selectedJourney.status) as any}
                      />
                      <Chip label={getTypeLabel(selectedJourney.type)} variant="outlined" />
                      <Chip label={`Trigger: ${selectedJourney.triggerType}`} variant="outlined" />
                    </Box>
                  </Grid>

                  {selectedJourney.description && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="body2" color="text.secondary">
                        {selectedJourney.description}
                      </Typography>
                    </Grid>
                  )}

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <PeopleIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4">{selectedJourney.totalEntered.toLocaleString()}</Typography>
                      <Typography variant="body2" color="text.secondary">Total Entered</Typography>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <FlagIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4">{selectedJourney.totalCompleted.toLocaleString()}</Typography>
                      <Typography variant="body2" color="text.secondary">Completed</Typography>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <TrendingUpIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4">{selectedJourney.totalConverted.toLocaleString()}</Typography>
                      <Typography variant="body2" color="text.secondary">Converted ({getConversionRate(selectedJourney)}%)</Typography>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Journey Details
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Steps</Typography>
                        <Typography variant="body2">{selectedJourney._count?.steps || 0}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Active Enrollments</Typography>
                        <Typography variant="body2">{selectedJourney._count?.enrollments || 0}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Created</Typography>
                        <Typography variant="body2">{formatDate(selectedJourney.createdAt)}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              )}
              {selectedJourney && editMode && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Journey Name"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
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
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Trigger Type"
                      value={editFormData.triggerType}
                      onChange={(e) => setEditFormData({ ...editFormData, triggerType: e.target.value })}
                      select
                    >
                      <MenuItem value="MANUAL">Manual</MenuItem>
                      <MenuItem value="LEAD_CREATED">Lead Created</MenuItem>
                      <MenuItem value="FORM_SUBMIT">Form Submit</MenuItem>
                      <MenuItem value="SEGMENT_ENTRY">Segment Entry</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              {!editMode ? (
                <>
                  {selectedJourney.status === 'DRAFT' && (
                    <Button
                      color="success"
                      startIcon={<PlayArrowIcon />}
                      onClick={(e) => {
                        handleStatusChange(selectedJourney.id, 'ACTIVE', e);
                        setDetailDialogOpen(false);
                      }}
                    >
                      Activate
                    </Button>
                  )}
                  {selectedJourney.status === 'ACTIVE' && (
                    <Button
                      color="warning"
                      startIcon={<PauseIcon />}
                      onClick={(e) => {
                        handleStatusChange(selectedJourney.id, 'PAUSED', e);
                        setDetailDialogOpen(false);
                      }}
                    >
                      Pause
                    </Button>
                  )}
                  {selectedJourney.status === 'PAUSED' && (
                    <Button
                      color="success"
                      startIcon={<PlayArrowIcon />}
                      onClick={(e) => {
                        handleStatusChange(selectedJourney.id, 'ACTIVE', e);
                        setDetailDialogOpen(false);
                      }}
                    >
                      Resume
                    </Button>
                  )}
                  <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
                  <Button
                    startIcon={<EditIcon />}
                    onClick={handleStartEdit}
                  >
                    Edit
                  </Button>
                  <Button
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={(e) => handleDeleteJourney(selectedJourney.id, e)}
                  >
                    Delete
                  </Button>
                </>
              ) : (
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

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Journey</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Journey Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Journey Type *</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  label="Journey Type *"
                >
                  <MenuItem value="NURTURE">Nurture</MenuItem>
                  <MenuItem value="ONBOARDING">Onboarding</MenuItem>
                  <MenuItem value="RE_ENGAGEMENT">Re-engagement</MenuItem>
                  <MenuItem value="UPSELL">Upsell</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Trigger Type *</InputLabel>
                <Select
                  value={formData.triggerType}
                  onChange={(e) => setFormData({ ...formData, triggerType: e.target.value })}
                  label="Trigger Type *"
                >
                  <MenuItem value="MANUAL">Manual</MenuItem>
                  <MenuItem value="LEAD_CREATED">Lead Created</MenuItem>
                  <MenuItem value="FORM_SUBMIT">Form Submit</MenuItem>
                  <MenuItem value="SEGMENT_ENTRY">Segment Entry</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateJourney}
            variant="contained"
            disabled={!formData.name}
          >
            Create Journey
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
