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
  TableHead,
  TableRow,
  CircularProgress,
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
} from '@mui/material';
import {
  Assessment as ReportIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  PlayArrow as RunIcon,
  Download as ExportIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
  TableChart as TabularIcon,
  BarChart as SummaryIcon,
  GridOn as MatrixIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';

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

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [filterObjectType, setFilterObjectType] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/reports/builder', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reports');
      }

      setReports(data.reports || []);
      setStats(data.stats || null);
    } catch (err: any) {
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      const response = await fetch(`/api/reports/builder/${reportId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete report');
      fetchReports();
    } catch (err: any) {
      setError(err.message);
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

  if (loading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

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
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchReports}
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
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
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
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Report Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Object</TableCell>
                    <TableCell>Columns</TableCell>
                    <TableCell>Visibility</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
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
                      <TableRow key={report.id} hover>
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
                        <TableCell align="right">
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
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  );
}
