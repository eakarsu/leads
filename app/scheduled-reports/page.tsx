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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SearchIcon from '@mui/icons-material/Search';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import HistoryIcon from '@mui/icons-material/History';
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

interface ScheduledReport {
  id: string;
  name: string;
  reportType: string;
  frequency: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  time: string;
  timezone: string;
  recipientEmails: string[];
  format: string;
  includeCharts: boolean;
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  lastStatus: string | null;
  createdAt: string;
  _count?: { executions: number };
}

const columns: Column[] = [
  { id: 'name', label: 'Report Name' },
  { id: 'reportType', label: 'Type' },
  { id: 'frequency', label: 'Schedule', sortable: false },
  { id: 'format', label: 'Format' },
  { id: 'recipientEmails', label: 'Recipients', sortable: false },
  { id: 'lastRunAt', label: 'Last Run' },
  { id: 'nextRunAt', label: 'Next Run' },
  { id: 'isActive', label: 'Status' },
  { id: 'actions', label: 'Actions', sortable: false },
];

export default function ScheduledReportsPage() {
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [stats, setStats] = useState({
    totalReports: 0,
    activeReports: 0,
    pausedReports: 0,
    totalExecutions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ScheduledReport | null>(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { showSuccess, showError } = useToast();
  const { confirm } = useConfirmDialog();

  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    reportType: '',
    frequency: '',
    recipientEmails: '',
  });
  const [editSaving, setEditSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    reportType: 'CUSTOM',
    frequency: 'WEEKLY',
    dayOfWeek: 1,
    dayOfMonth: 1,
    time: '09:00',
    timezone: 'America/New_York',
    recipientEmails: '',
    format: 'PDF',
    includeCharts: true,
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/scheduled-reports');
      const data = await response.json();
      const arr = Array.isArray(data) ? data : data.data || [];
      setReports(arr);
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
      showError('Failed to load scheduled reports');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async () => {
    try {
      const response = await fetch('/api/scheduled-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          recipientEmails: formData.recipientEmails.split(',').map(e => e.trim()).filter(Boolean),
        }),
      });

      if (response.ok) {
        setDialogOpen(false);
        fetchReports();
        resetForm();
        showSuccess('Scheduled report created successfully');
      } else {
        showError('Failed to create scheduled report');
      }
    } catch (error) {
      console.error('Error creating scheduled report:', error);
      showError('Failed to create scheduled report');
    }
  };

  const handleToggleActive = async (reportId: string, isActive: boolean, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await fetch('/api/scheduled-reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reportId, isActive }),
      });
      fetchReports();
      showSuccess(isActive ? 'Report activated' : 'Report paused');
    } catch (error) {
      console.error('Error toggling report status:', error);
      showError('Failed to update report status');
    }
  };

  const handleRunNow = async (reportId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await fetch('/api/scheduled-reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reportId, action: 'run_now' }),
      });
      fetchReports();
      showSuccess('Report execution started');
    } catch (error) {
      console.error('Error running report:', error);
      showError('Failed to run report');
    }
  };

  const handleDeleteReport = async (reportId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const confirmed = await confirm({
      title: 'Delete Scheduled Report',
      message: 'Are you sure you want to delete this scheduled report? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      await fetch(`/api/scheduled-reports?id=${reportId}`, { method: 'DELETE' });
      fetchReports();
      if (selectedReport?.id === reportId) {
        setDetailDialogOpen(false);
        setSelectedReport(null);
      }
      showSuccess('Scheduled report deleted');
    } catch (error) {
      console.error('Error deleting scheduled report:', error);
      showError('Failed to delete scheduled report');
    }
  };

  const handleRowClick = (report: ScheduledReport) => {
    setSelectedReport(report);
    setEditMode(false);
    setDetailDialogOpen(true);
  };

  const handleStartEdit = () => {
    if (!selectedReport) return;
    setEditFormData({
      name: selectedReport.name || '',
      reportType: selectedReport.reportType || '',
      frequency: selectedReport.frequency || '',
      recipientEmails: selectedReport.recipientEmails?.join(', ') || '',
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedReport) return;
    setEditSaving(true);
    try {
      const response = await fetch('/api/scheduled-reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedReport.id,
          name: editFormData.name,
          reportType: editFormData.reportType,
          frequency: editFormData.frequency,
          recipientEmails: editFormData.recipientEmails.split(',').map(e => e.trim()).filter(Boolean),
        }),
      });
      if (response.ok) {
        showSuccess('Report updated successfully');
        setEditMode(false);
        setDetailDialogOpen(false);
        fetchReports();
      } else {
        showError('Failed to update report');
      }
    } catch (error) {
      console.error('Error updating report:', error);
      showError('Failed to update report');
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
      reportType: 'CUSTOM',
      frequency: 'WEEKLY',
      dayOfWeek: 1,
      dayOfMonth: 1,
      time: '09:00',
      timezone: 'America/New_York',
      recipientEmails: '',
      format: 'PDF',
      includeCharts: true,
    });
  };

  const getFrequencyLabel = (report: ScheduledReport) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    switch (report.frequency) {
      case 'DAILY':
        return `Daily at ${report.time}`;
      case 'WEEKLY':
        return `Weekly on ${days[report.dayOfWeek || 0]} at ${report.time}`;
      case 'MONTHLY':
        return `Monthly on day ${report.dayOfMonth} at ${report.time}`;
      case 'QUARTERLY':
        return `Quarterly on day ${report.dayOfMonth} at ${report.time}`;
      default:
        return report.frequency;
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'PDF':
        return <PictureAsPdfIcon fontSize="small" color="error" />;
      case 'EXCEL':
        return <TableChartIcon fontSize="small" color="success" />;
      case 'CSV':
        return <TableChartIcon fontSize="small" color="primary" />;
      default:
        return <AssessmentIcon fontSize="small" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const filteredReports = reports
    .filter((report) => {
      const searchLower = search.toLowerCase();
      const matchesSearch = !search ||
        report.name.toLowerCase().includes(searchLower) ||
        report.reportType.toLowerCase().includes(searchLower);

      let matchesTab = true;
      if (tabValue === 1) matchesTab = report.isActive;
      else if (tabValue === 2) matchesTab = !report.isActive;

      return matchesSearch && matchesTab;
    })
    .sort((a, b) => {
      const aVal = (a as any)[sortBy];
      const bVal = (b as any)[sortBy];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortOrder === 'asc' ? cmp : -cmp;
    });

  const totalItems = filteredReports.length;
  const paginatedReports = filteredReports.slice((page - 1) * pageSize, page * pageSize);

  const exportData = filteredReports.map(r => ({
    Name: r.name,
    Type: r.reportType,
    Frequency: getFrequencyLabel(r),
    Format: r.format,
    Recipients: r.recipientEmails.join(', '),
    Status: r.isActive ? 'Active' : 'Paused',
    'Last Run': formatDate(r.lastRunAt),
    'Next Run': r.isActive ? formatDate(r.nextRunAt) : '-',
  }));

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ScheduleIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4">Scheduled Reports</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ExportToolbar data={exportData} filename="scheduled-reports" title="Scheduled Reports" />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              New Scheduled Report
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AssessmentIcon color="primary" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Total Reports</Typography>
                </Box>
                <Typography variant="h4">{stats.totalReports}</Typography>
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
                <Typography variant="h4">{stats.activeReports}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PauseIcon color="warning" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Paused</Typography>
                </Box>
                <Typography variant="h4">{stats.pausedReports}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <HistoryIcon color="info" sx={{ mr: 1 }} />
                  <Typography color="textSecondary">Total Runs</Typography>
                </Box>
                <Typography variant="h4">{stats.totalExecutions}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Tabs */}
        <Paper sx={{ mb: 2, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ width: 300 }}
            />
          </Box>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={`All (${stats.totalReports})`} />
            <Tab label={`Active (${stats.activeReports})`} />
            <Tab label={`Paused (${stats.pausedReports})`} />
          </Tabs>
        </Paper>

        {/* Reports Table */}
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
                {paginatedReports.map((report) => (
                  <TableRow
                    key={report.id}
                    hover
                    onClick={() => handleRowClick(report)}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {report.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={report.reportType} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{getFrequencyLabel(report)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {getFormatIcon(report.format)}
                        {report.format}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EmailIcon fontSize="small" color="action" />
                        {report.recipientEmails.length}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(report.lastRunAt)}
                      </Typography>
                      {report.lastStatus && (
                        <Chip
                          label={report.lastStatus}
                          size="small"
                          color={report.lastStatus === 'SUCCESS' ? 'success' : 'error'}
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {report.isActive ? formatDate(report.nextRunAt) : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={report.isActive ? 'Active' : 'Paused'}
                        color={report.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={report.isActive ? 'Pause' : 'Activate'}>
                        <IconButton
                          size="small"
                          onClick={(e) => handleToggleActive(report.id, !report.isActive, e)}
                        >
                          {report.isActive ? <PauseIcon /> : <PlayArrowIcon />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Run Now">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => handleRunNow(report.id, e)}
                        >
                          <PlayArrowIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => handleDeleteReport(report.id, e)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedReports.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No scheduled reports found
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
        {selectedReport && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ScheduleIcon color="primary" />
                  <Typography variant="h6">{selectedReport.name}</Typography>
                </Box>
                <IconButton onClick={() => setDetailDialogOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              {selectedReport && !editMode && (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={selectedReport.isActive ? 'Active' : 'Paused'}
                        color={selectedReport.isActive ? 'success' : 'default'}
                      />
                      <Chip label={selectedReport.reportType} variant="outlined" />
                      <Chip
                        icon={getFormatIcon(selectedReport.format)}
                        label={selectedReport.format}
                        variant="outlined"
                      />
                      {selectedReport.includeCharts && (
                        <Chip label="Charts Included" color="info" variant="outlined" />
                      )}
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        <AccessTimeIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Schedule
                      </Typography>
                      <Typography variant="body1">{getFrequencyLabel(selectedReport)}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Timezone: {selectedReport.timezone}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        <EmailIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Recipients
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selectedReport.recipientEmails.map((email, i) => (
                          <Chip key={i} label={email} size="small" />
                        ))}
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Last Execution
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(selectedReport.lastRunAt)}
                      </Typography>
                      {selectedReport.lastStatus && (
                        <Chip
                          label={selectedReport.lastStatus}
                          size="small"
                          color={selectedReport.lastStatus === 'SUCCESS' ? 'success' : 'error'}
                          sx={{ mt: 1 }}
                        />
                      )}
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Next Execution
                      </Typography>
                      <Typography variant="body1">
                        {selectedReport.isActive ? formatDate(selectedReport.nextRunAt) : 'Report is paused'}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Execution History
                      </Typography>
                      <Typography variant="body2">
                        Total executions: {selectedReport._count?.executions || 0}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              )}
              {selectedReport && editMode && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Report Name"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Report Type"
                      value={editFormData.reportType}
                      onChange={(e) => setEditFormData({ ...editFormData, reportType: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Frequency"
                      value={editFormData.frequency}
                      onChange={(e) => setEditFormData({ ...editFormData, frequency: e.target.value })}
                      select
                    >
                      <MenuItem value="DAILY">Daily</MenuItem>
                      <MenuItem value="WEEKLY">Weekly</MenuItem>
                      <MenuItem value="MONTHLY">Monthly</MenuItem>
                      <MenuItem value="QUARTERLY">Quarterly</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Recipients (comma-separated emails)"
                      value={editFormData.recipientEmails}
                      onChange={(e) => setEditFormData({ ...editFormData, recipientEmails: e.target.value })}
                      placeholder="email1@company.com, email2@company.com"
                    />
                  </Grid>
                </Grid>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              {!editMode ? (
                <>
                  <Button
                    startIcon={<PlayArrowIcon />}
                    onClick={(e) => {
                      handleRunNow(selectedReport.id, e);
                      setDetailDialogOpen(false);
                    }}
                  >
                    Run Now
                  </Button>
                  <Button
                    startIcon={selectedReport.isActive ? <PauseIcon /> : <PlayArrowIcon />}
                    onClick={(e) => {
                      handleToggleActive(selectedReport.id, !selectedReport.isActive, e);
                      setDetailDialogOpen(false);
                    }}
                  >
                    {selectedReport.isActive ? 'Pause' : 'Activate'}
                  </Button>
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
                    onClick={(e) => handleDeleteReport(selectedReport.id, e)}
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
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Scheduled Report</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Report Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Report Type *</InputLabel>
                <Select
                  value={formData.reportType}
                  onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
                  label="Report Type *"
                >
                  <MenuItem value="CUSTOM">Custom</MenuItem>
                  <MenuItem value="SALES">Sales</MenuItem>
                  <MenuItem value="PIPELINE">Pipeline</MenuItem>
                  <MenuItem value="ACTIVITY">Activity</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Frequency *</InputLabel>
                <Select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  label="Frequency *"
                >
                  <MenuItem value="DAILY">Daily</MenuItem>
                  <MenuItem value="WEEKLY">Weekly</MenuItem>
                  <MenuItem value="MONTHLY">Monthly</MenuItem>
                  <MenuItem value="QUARTERLY">Quarterly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {formData.frequency === 'WEEKLY' && (
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Day of Week</InputLabel>
                  <Select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: Number(e.target.value) })}
                    label="Day of Week"
                  >
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, i) => (
                      <MenuItem key={i} value={i}>{day}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            {(formData.frequency === 'MONTHLY' || formData.frequency === 'QUARTERLY') && (
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Day of Month"
                  type="number"
                  value={formData.dayOfMonth}
                  onChange={(e) => setFormData({ ...formData, dayOfMonth: Number(e.target.value) })}
                  InputProps={{ inputProps: { min: 1, max: 31 } }}
                />
              </Grid>
            )}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Format *</InputLabel>
                <Select
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                  label="Format *"
                >
                  <MenuItem value="PDF">PDF</MenuItem>
                  <MenuItem value="EXCEL">Excel</MenuItem>
                  <MenuItem value="CSV">CSV</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Recipients (comma-separated emails)"
                value={formData.recipientEmails}
                onChange={(e) => setFormData({ ...formData, recipientEmails: e.target.value })}
                placeholder="email1@company.com, email2@company.com"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.includeCharts}
                    onChange={(e) => setFormData({ ...formData, includeCharts: e.target.checked })}
                  />
                }
                label="Include Charts"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateReport}
            variant="contained"
            disabled={!formData.name || !formData.recipientEmails}
          >
            Create Report
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
