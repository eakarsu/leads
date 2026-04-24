'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Alert,
  Paper,
  Chip,
  Button,
  Grid,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Assessment as ReportIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as RunIcon,
  Download as ExportIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
  TableChart as TabularIcon,
  BarChart as SummaryIcon,
  GridOn as MatrixIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';
import TableSkeleton from '@/components/TableSkeleton';
import SortableTableHead, { Column } from '@/components/SortableTableHead';
import PaginationControls from '@/components/PaginationControls';
import ExportToolbar from '@/components/ExportToolbar';
import { usePagination } from '@/lib/usePagination';
import { useToast } from '@/components/ToastProvider';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface Report {
  id: string;
  name: string;
  description?: string;
  reportType: 'TABULAR' | 'SUMMARY' | 'MATRIX';
  objectType: string;
  columns: string[];
  filters?: any;
  groupings?: string[];
  isPublic: boolean;
  createdAt: string;
  lastRunAt?: string;
}

interface ReportStats {
  totalReports: number;
  publicReports: number;
  privateReports: number;
  byType: {
    TABULAR: number;
    SUMMARY: number;
    MATRIX: number;
  };
}

const OBJECT_TYPES = [
  { value: 'Lead', label: 'Leads' },
  { value: 'Contact', label: 'Contacts' },
  { value: 'Account', label: 'Accounts' },
  { value: 'Opportunity', label: 'Opportunities' },
  { value: 'Case', label: 'Cases' },
  { value: 'Campaign', label: 'Campaigns' },
  { value: 'Task', label: 'Tasks' },
  { value: 'Contract', label: 'Contracts' },
  { value: 'Quote', label: 'Quotes' },
  { value: 'Order', label: 'Orders' },
  { value: 'Invoice', label: 'Invoices' },
];

const tableColumns: Column[] = [
  { id: 'name', label: 'Report Name' },
  { id: 'reportType', label: 'Type' },
  { id: 'objectType', label: 'Object' },
  { id: 'columns', label: 'Columns', sortable: false },
  { id: 'isPublic', label: 'Visibility' },
  { id: 'createdAt', label: 'Created' },
  { id: 'actions', label: 'Actions', sortable: false, align: 'right' },
];

export default function ReportsPage() {
  const router = useRouter();
  const toast = useToast();
  const { confirm } = useConfirmDialog();
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [filterObjectType, setFilterObjectType] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    objectType: '',
    reportType: '' as 'TABULAR' | 'SUMMARY' | 'MATRIX',
    isPublic: false,
  });

  const {
    data: reports,
    loading,
    error,
    pagination,
    setPage,
    setPageSize,
    setSort,
    refresh,
  } = usePagination<Report>({
    url: '/api/reports/builder',
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  });

  // Fetch stats separately
  useEffect(() => {
    fetch('/api/reports/builder', {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.stats) setStats(data.stats);
      })
      .catch(console.error);
  }, []);

  const handleSort = (columnId: string) => {
    const newOrder = sortBy === columnId && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(columnId);
    setSortOrder(newOrder);
    setSort(columnId, newOrder);
  };

  const handleDeleteReport = async (reportId: string) => {
    const confirmed = await confirm({
      title: 'Delete Report',
      message: 'Are you sure you want to delete this report? This action cannot be undone.',
      severity: 'error',
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/reports/builder/${reportId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete report');
      toast.showSuccess('Report deleted successfully');
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const handleStartEdit = () => {
    if (!selectedReport) return;
    setEditFormData({
      name: selectedReport.name,
      description: selectedReport.description || '',
      objectType: selectedReport.objectType,
      reportType: selectedReport.reportType,
      isPublic: selectedReport.isPublic,
    });
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedReport) return;
    try {
      const response = await fetch(`/api/reports/builder/${selectedReport.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFormData.name,
          description: editFormData.description,
          reportType: editFormData.reportType,
          objectType: editFormData.objectType,
          isPublic: editFormData.isPublic,
        }),
      });
      if (!response.ok) throw new Error('Failed to update report');
      const updatedReport = await response.json();
      setSelectedReport({
        ...selectedReport,
        name: updatedReport.name ?? editFormData.name,
        description: updatedReport.description ?? editFormData.description,
        reportType: updatedReport.format ?? editFormData.reportType,
        objectType: updatedReport.objectType ?? editFormData.objectType,
        isPublic: updatedReport.isPublic ?? editFormData.isPublic,
      });
      setEditMode(false);
      toast.showSuccess('Report updated successfully');
      refresh();
    } catch (err: any) {
      toast.showError(err.message);
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'TABULAR': return <TabularIcon fontSize="small" />;
      case 'SUMMARY': return <SummaryIcon fontSize="small" />;
      case 'MATRIX': return <MatrixIcon fontSize="small" />;
      default: return <ReportIcon fontSize="small" />;
    }
  };

  const getReportTypeColor = (type: string): 'info' | 'success' | 'warning' => {
    switch (type) {
      case 'TABULAR': return 'info';
      case 'SUMMARY': return 'success';
      case 'MATRIX': return 'warning';
      default: return 'info';
    }
  };

  const filteredReports = reports.filter(report => {
    if (filterObjectType && report.objectType !== filterObjectType) return false;
    if (activeTab === 1 && !report.isPublic) return false;
    if (activeTab === 2 && report.isPublic) return false;
    return true;
  });

  const exportData = filteredReports.map((r) => ({
    Name: r.name,
    Description: r.description || '',
    Type: r.reportType,
    Object: r.objectType,
    Columns: Array.isArray(r.columns) ? r.columns.length : 0,
    Visibility: r.isPublic ? 'Public' : 'Private',
    Created: new Date(r.createdAt).toLocaleDateString(),
  }));

  return (
    <DashboardLayout>
      <Box>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" gutterBottom>
              All Reports
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View and manage your saved reports
            </Typography>
          </Box>
          <Box display="flex" gap={1} alignItems="center">
            <ExportToolbar data={exportData} filename="reports" title="Reports" />
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={refresh}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/report-builder')}
              size="large"
            >
              Create Report
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => {}}>
            <strong>Error:</strong> {error}
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2">
                Try refreshing the page or check the browser console for details.
              </Typography>
            </Box>
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Total Reports
                    </Typography>
                    <Typography variant="h4">
                      {stats?.totalReports || reports.length}
                    </Typography>
                  </Box>
                  <ReportIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Tabular
                    </Typography>
                    <Typography variant="h4">
                      {stats?.byType?.TABULAR || reports.filter(r => r.reportType === 'TABULAR').length}
                    </Typography>
                  </Box>
                  <TabularIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Summary
                    </Typography>
                    <Typography variant="h4">
                      {stats?.byType?.SUMMARY || reports.filter(r => r.reportType === 'SUMMARY').length}
                    </Typography>
                  </Box>
                  <SummaryIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Public
                    </Typography>
                    <Typography variant="h4">
                      {stats?.publicReports || reports.filter(r => r.isPublic).length}
                    </Typography>
                  </Box>
                  <PublicIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Reports List */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            {/* Tabs and Filters */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                  <Tab label="All Reports" />
                  <Tab label="Public" icon={<PublicIcon fontSize="small" />} iconPosition="start" />
                  <Tab label="Private" icon={<PrivateIcon fontSize="small" />} iconPosition="start" />
                </Tabs>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Filter by Object</InputLabel>
                  <Select
                    value={filterObjectType}
                    onChange={(e) => setFilterObjectType(e.target.value)}
                    label="Filter by Object"
                  >
                    <MenuItem value="">All Objects</MenuItem>
                    {OBJECT_TYPES.map((obj) => (
                      <MenuItem key={obj.value} value={obj.value}>
                        {obj.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Reports Table */}
            {loading ? (
              <Box sx={{ p: 2 }}>
                <TableSkeleton rows={5} columns={7} />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <SortableTableHead
                    columns={tableColumns}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <TableBody>
                    {filteredReports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                          <ReportIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            No reports found
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
                            {reports.length === 0
                              ? 'Your reports library is empty. Create a custom report or import sample data to get started.'
                              : 'No reports match your current filters. Try adjusting the filter or view all reports.'}
                          </Typography>
                          {reports.length === 0 ? (
                            <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
                              <Button
                                variant="contained"
                                size="large"
                                startIcon={<AddIcon />}
                                onClick={() => router.push('/report-builder')}
                              >
                                Create New Report
                              </Button>
                              <Button
                                variant="outlined"
                                size="large"
                                onClick={() => router.push('/settings')}
                              >
                                Import Sample Data
                              </Button>
                            </Box>
                          ) : (
                            <Button
                              variant="outlined"
                              onClick={() => {
                                setActiveTab(0);
                                setFilterObjectType('');
                              }}
                            >
                              Clear Filters
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReports.map((report) => (
                        <TableRow
                          key={report.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => {
                            setSelectedReport(report);
                            setDetailOpen(true);
                          }}
                        >
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              {getReportTypeIcon(report.reportType)}
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {report.name}
                                </Typography>
                                {report.description && (
                                  <Typography variant="caption" color="text.secondary">
                                    {report.description.length > 50
                                      ? `${report.description.substring(0, 50)}...`
                                      : report.description}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={report.reportType}
                              size="small"
                              color={getReportTypeColor(report.reportType)}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip label={report.objectType} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {Array.isArray(report.columns) ? report.columns.length : 0} columns
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {report.isPublic ? (
                              <Chip
                                icon={<PublicIcon />}
                                label="Public"
                                size="small"
                                color="success"
                                variant="outlined"
                              />
                            ) : (
                              <Chip
                                icon={<PrivateIcon />}
                                label="Private"
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(report.createdAt).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                            <Tooltip title="Run Report">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => router.push(`/reports/${report.id}`)}
                              >
                                <RunIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton size="small">
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Export">
                              <IconButton size="small">
                                <ExportIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteReport(report.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
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
          </CardContent>
        </Card>

        {/* Report Detail Dialog */}
        <Dialog open={detailOpen} onClose={() => { setDetailOpen(false); setEditMode(false); }} maxWidth="sm" fullWidth>
          <DialogTitle>{editMode ? 'Edit Report' : 'Report Details'}</DialogTitle>
          <DialogContent>
            {selectedReport && !editMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                  <Typography>{selectedReport.name}</Typography>
                </Box>
                {selectedReport.description && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                    <Typography>{selectedReport.description}</Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                  <Chip
                    label={selectedReport.reportType}
                    size="small"
                    color={getReportTypeColor(selectedReport.reportType)}
                    variant="outlined"
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Object</Typography>
                  <Chip label={selectedReport.objectType} size="small" variant="outlined" />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Visibility</Typography>
                  {selectedReport.isPublic ? (
                    <Chip icon={<PublicIcon />} label="Public" size="small" color="success" variant="outlined" />
                  ) : (
                    <Chip icon={<PrivateIcon />} label="Private" size="small" variant="outlined" />
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Columns</Typography>
                  <Typography>{Array.isArray(selectedReport.columns) ? selectedReport.columns.join(', ') : 'None'}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                  <Typography>{new Date(selectedReport.createdAt).toLocaleString()}</Typography>
                </Box>
              </Box>
            )}
            {selectedReport && editMode && (
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Name"
                  fullWidth
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                />
                <FormControl fullWidth>
                  <InputLabel>Object Type</InputLabel>
                  <Select
                    value={editFormData.objectType}
                    onChange={(e) => setEditFormData({ ...editFormData, objectType: e.target.value })}
                    label="Object Type"
                  >
                    {OBJECT_TYPES.map((obj) => (
                      <MenuItem key={obj.value} value={obj.value}>
                        {obj.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Report Type</InputLabel>
                  <Select
                    value={editFormData.reportType}
                    onChange={(e) => setEditFormData({ ...editFormData, reportType: e.target.value as 'TABULAR' | 'SUMMARY' | 'MATRIX' })}
                    label="Report Type"
                  >
                    <MenuItem value="TABULAR">Tabular</MenuItem>
                    <MenuItem value="SUMMARY">Summary</MenuItem>
                    <MenuItem value="MATRIX">Matrix</MenuItem>
                  </Select>
                </FormControl>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editFormData.isPublic}
                      onChange={(e) => setEditFormData({ ...editFormData, isPublic: e.target.checked })}
                    />
                  }
                  label="Public"
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {selectedReport && !editMode && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleStartEdit}
                >
                  Edit
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    router.push(`/reports/${selectedReport.id}`);
                    setDetailOpen(false);
                  }}
                >
                  Run Report
                </Button>
              </>
            )}
            {editMode && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveEdit}
                >
                  Save
                </Button>
              </>
            )}
            {!editMode && <Button onClick={() => { setDetailOpen(false); setEditMode(false); }}>Close</Button>}
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
